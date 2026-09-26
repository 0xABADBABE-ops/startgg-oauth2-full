import type { OAuth2TokenResponse } from "startgg-oauth2-full/auth";
import { STARTGG_ENDPOINTS } from "startgg-oauth2-full";

function readEnv(name: string, fallback?: string): string {
	const value = process.env[name] ?? fallback;
	if (!value) {
		throw new Error(
			`[nextjs example] Missing required environment variable: ${name}`,
		);
	}
	return value;
}

export type StartggExampleConfig = {
	clientId: string;
	clientSecret?: string;
	authEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
};

export function getStartggConfig(): StartggExampleConfig {
	const clientId = readEnv(
		"STARTGG_CLIENT_ID",
		process.env.NEXT_PUBLIC_STARTGG_CLIENT_ID,
	);
	const authEndpoint = readEnv(
		"STARTGG_AUTH_ENDPOINT",
		STARTGG_ENDPOINTS.authorize,
	);
	const tokenEndpoint = readEnv(
		"STARTGG_TOKEN_ENDPOINT",
		STARTGG_ENDPOINTS.token,
	);
	const redirectUri = readEnv(
		"STARTGG_REDIRECT_URI",
		"http://localhost:3000/api/auth/startgg/callback",
	);
	const clientSecret = process.env.STARTGG_CLIENT_SECRET?.trim() ?? "";
	if (!clientSecret) {
		console.warn(
			'[nextjs example] STARTGG_CLIENT_SECRET is not set. start.gg\'s token endpoint requires it even with PKCE, so the exchange will fail with "Invalid client".',
		);
	}

	return {
		clientId,
		clientSecret: clientSecret || undefined,
		authEndpoint,
		tokenEndpoint,
		redirectUri,
	};
}

/**
 * start.gg's token endpoint requires client_secret even for PKCE flows.
 * The library stays spec-pure PKCE, so this example-level helper performs
 * the standard authorization_code POST with the secret added.
 */
export async function exchangeTokenWithSecret(
	cfg: StartggExampleConfig,
	code: string,
	codeVerifier: string,
): Promise<OAuth2TokenResponse> {
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: cfg.redirectUri,
		code_verifier: codeVerifier,
		client_id: cfg.clientId,
		...(cfg.clientSecret ? { client_secret: cfg.clientSecret } : {}),
	});

	const res = await fetch(cfg.tokenEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body,
	});

	if (!res.ok) {
		throw new Error(
			`Token exchange failed: HTTP ${res.status} ${await res.text()}`,
		);
	}

	const tokenResponse = (await res.json()) as OAuth2TokenResponse;
	if (
		!tokenResponse.access_token ||
		tokenResponse.token_type?.toLowerCase() !== "bearer"
	) {
		throw new Error("Token endpoint returned an unexpected payload");
	}
	return tokenResponse;
}
