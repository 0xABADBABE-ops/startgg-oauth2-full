// Example: Complete Next.js App Router with Vercel Connect + Start.gg
//
// Setup:
// 1. Create Start.gg OAuth app at https://start.gg/developer
//    - Redirect URI: https://connect.vercel.com/callback
// 2. Create Vercel Connect Custom OAuth connector named "startgg"
// 3. Attach to project: vercel connect attach oauth/startgg
// 4. Add env vars: STARTGG_CLIENT_ID, STARTGG_CLIENT_SECRET (in Vercel dashboard)
//
// This example shows:
// - Server action to get authorize URL
// - Callback handler
// - Server action to call Start.gg GraphQL API

import {
	getTokenResponse,
	startAuthorization,
	UserAuthorizationRequiredError,
} from "@vercel/connect";
import { cookies } from "next/headers";
import {
	createTokenParams,
	getConnectorUid,
	getLoginScopes,
	STARTGG_VERCEL_CONNECT_CONFIG,
} from "startgg-vercel-connect";

// ============================================
// lib/startgg.ts - Server-side helpers
// ============================================

export async function getStartggAuthorizeUrl(userId: string) {
	const { url } = await startAuthorization(getConnectorUid(), {
		subject: { type: "user", id: userId },
		scopes: getLoginScopes(true),
	});
	return url;
}

export async function getStartggToken(userId: string) {
	const response = await getTokenResponse(getConnectorUid(), {
		subject: { type: "user", id: userId },
		scopes: getLoginScopes(true),
	});
	return response.token;
}

export async function callStartggGraphQL(
	token: string,
	query: string,
	variables?: Record<string, unknown>,
) {
	const response = await fetch(
		STARTGG_VERCEL_CONNECT_CONFIG.endpoints.graphql,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ query, variables }),
		},
	);

	if (!response.ok) {
		throw new Error(`GraphQL request failed: ${response.status}`);
	}

	return response.json();
}

// ============================================
// app/actions.ts - Server Actions
// ============================================

("use server");

export async function startStartggAuth(userId: string) {
	const url = await getStartggAuthorizeUrl(userId);
	return { url };
}

export async function getUserProfile(userId: string) {
	try {
		const token = await getStartggToken(userId);

		const query = `
      query GetUser {
        user {
          id
          name
          authorizations(types: [STARTGG]) {
            externalUsername
          }
        }
      }
    `;

		const data = await callStartggGraphQL(token, query);
		return data.data?.user;
	} catch (error) {
		if (error instanceof UserAuthorizationRequiredError) {
			const url = await getStartggAuthorizeUrl(userId);
			return { error: "authorization_required", url };
		}
		throw error;
	}
}

export async function createTournament(userId: string, name: string) {
	const token = await getStartggToken(userId);

	const mutation = `
    mutation CreateTournament($name: String!) {
      createTournament(name: $name) {
        id
        name
      }
    }
  `;

	const data = await callStartggGraphQL(token, mutation, { name });
	return data.data?.createTournament;
}

// ============================================
// app/page.tsx - Client Component
// ============================================

/*
'use client';

import { useState } from 'react';
import { startStartggAuth, getUserProfile, createTournament } from './actions';

export default function StartggDemo() {
  const [userId] = useState('user_123'); // In real app, get from auth
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const { url } = await startStartggAuth(userId);
    if (url) {
      window.location.href = url;
    }
  }

  async function handleFetchProfile() {
    setLoading(true);
    try {
      const profile = await getUserProfile(userId);
      if (profile?.error === 'authorization_required') {
        window.location.href = profile.url;
      } else {
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTournament() {
    setLoading(true);
    try {
      const tournament = await createTournament(userId, 'My Tournament');
      alert(`Created: ${tournament.name} (${tournament.id})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Start.gg + Vercel Connect Demo</h1>
      
      {!user ? (
        <button onClick={handleLogin} disabled={loading}>
          {loading ? 'Loading...' : 'Connect Start.gg'}
        </button>
      ) : (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleFetchProfile} disabled={loading}>
            Refresh Profile
          </button>
          <button onClick={handleCreateTournament} disabled={loading}>
            Create Tournament
          </button>
        </div>
      )}
    </div>
  );
}
*/

// ============================================
// API Route: app/api/startgg/callback/route.ts
// ============================================

/*
import { NextResponse } from 'next/server';
import { consumePending } from '@/lib/pendingStore'; // Your state store

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=' + error, request.url));
  }

  if (!state || !code) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  const pending = consumePending(state);
  if (!pending) {
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  // Vercel Connect handles the token exchange server-side!
  // The user's next getToken() call will succeed automatically.
  
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
*/
