import { NextResponse } from "next/server";
import { consumePending } from "../../../../../lib/pendingStore";
import { exchangeTokenWithSecret, getStartggConfig } from "../../../../../lib/startgg";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const state = url.searchParams.get("state");
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");
	const errorDescription = url.searchParams.get("error_description");

	if (error) {
		console.warn(
			"[nextjs example] Authorization error from Start.gg",
			error,
			errorDescription,
		);
		return NextResponse.json(
			{ error, errorDescription: errorDescription ?? null },
			{ status: 400 },
		);
	}

	if (!state || !code) {
		return NextResponse.json(
			{ error: "Missing state or code." },
			{ status: 400 },
		);
	}

	const pending = consumePending(state);
	if (!pending) {
		return NextResponse.json(
			{
				error: "State has expired or is invalid. Generate a new authorize URL.",
			},
			{ status: 400 },
		);
	}

	try {
		const tokenResponse = await exchangeTokenWithSecret(
			getStartggConfig(),
			code,
			pending.codeVerifier,
		);
		const masked = (t?: string) =>
			t ? `${t.slice(0, 6)}…${t.slice(-4)}` : null;

		// Never log full tokens — previews only.
		console.log("[nextjs example] Token exchange OK", {
			access_token: masked(tokenResponse.access_token),
			refresh_token: masked(tokenResponse.refresh_token),
			token_type: tokenResponse.token_type,
			expires_in: tokenResponse.expires_in,
			scope: tokenResponse.scope ?? "(omitted → unchanged)",
		});

		return NextResponse.json({
			message: "Authorization complete!",
			scope: tokenResponse.scope ?? null,
			expiresIn: tokenResponse.expires_in ?? null,
			accessTokenPreview: masked(tokenResponse.access_token),
		});
	} catch (err) {
		console.error("[nextjs example] Token exchange failed", err);
		return NextResponse.json(
			{ error: "Token exchange failed. Inspect server logs for details." },
			{ status: 500 },
		);
	}
}
