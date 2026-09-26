import type { OAuth2TokenResponse } from "startgg-oauth2-full/auth";
import type { NodeExampleConfig } from "./config.js";

/**
 * start.gg's token endpoint requires client_secret even for PKCE flows.
 * The library stays spec-pure PKCE, so this example-level helper performs
 * the standard authorization_code POST with the secret added.
 */
export async function exchangeTokenWithSecret(
	cfg: NodeExampleConfig,
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
