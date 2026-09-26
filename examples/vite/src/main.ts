import {
	BearerToken,
	buildAuthorizeUrl,
	createStartGGAuth2Handler,
	STARTGG_ENDPOINTS,
	StartGGScope,
} from "startgg-oauth2-full";

const form = document.querySelector<HTMLFormElement>("#auth-form");
const urlOutput = document.querySelector<HTMLPreElement>("#authorize-url");
const verifierOutput = document.querySelector<HTMLPreElement>("#code-verifier");
const challengeOutput =
	document.querySelector<HTMLPreElement>("#code-challenge");
const callbackStatus =
	document.querySelector<HTMLParagraphElement>("#callback-status");
const tokenPreview = document.querySelector<HTMLPreElement>("#token-preview");

if (
	!form ||
	!urlOutput ||
	!verifierOutput ||
	!challengeOutput ||
	!callbackStatus ||
	!tokenPreview
) {
	throw new Error("Demo markup not found");
}

// Default to the relay on this dev origin: start.gg's token endpoint has no
// CORS and requires the client secret, so the browser must not call it
// directly (the vite middleware in vite.config.ts adds the secret).
const DEFAULT_TOKEN_ENDPOINT = "/startgg/token";
const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/auth/startgg/callback";

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const data = new FormData(form);

	const clientId = String(data.get("clientId") ?? "");
	const authEndpoint = String(
		data.get("authEndpoint") ?? STARTGG_ENDPOINTS.authorize,
	);
	const tokenEndpoint = String(
		data.get("tokenEndpoint") ?? DEFAULT_TOKEN_ENDPOINT,
	);
	const redirectUri =
		String(data.get("redirectUri") ?? "") || DEFAULT_REDIRECT_URI;

	try {
		const { url, codeVerifier, codeChallenge } = await buildAuthorizeUrl(
			{ clientId, authEndpoint, redirectUri },
			{
				scopes: [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL],
				state: crypto.randomUUID(),
				extras: { prompt: "consent" },
			},
		);

		// Same tab on purpose: sessionStorage (verifier) is per-tab.
		sessionStorage.setItem("startgg:lastVerifier", codeVerifier);
		sessionStorage.setItem(
			"startgg:lastConfig",
			JSON.stringify({ clientId, authEndpoint, tokenEndpoint, redirectUri }),
		);

		urlOutput.textContent = url;
		const link = document.querySelector<HTMLAnchorElement>("#authorize-link");
		if (link) {
			link.href = url;
			link.hidden = false;
		}
		verifierOutput.textContent = codeVerifier;
		challengeOutput.textContent = codeChallenge;
		callbackStatus.textContent = "Waiting for authorization code…";
		tokenPreview.textContent = "Token preview appears here after callback.";
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		urlOutput.textContent = `Failed to build URL: ${message}`;
		verifierOutput.textContent = "—";
		challengeOutput.textContent = "—";
	}
});

async function handleCallbackIfPresent() {
	const params = new URLSearchParams(window.location.search);
	const code = params.get("code");
	const state = params.get("state");
	if (!code || !state) return;

	const codeVerifier = sessionStorage.getItem("startgg:lastVerifier");
	const stored = sessionStorage.getItem("startgg:lastConfig");
	if (!codeVerifier || !stored) {
		callbackStatus.textContent =
			"Missing verifier/config in session storage; restart the flow.";
		return;
	}

	try {
		const handler = createStartGGAuth2Handler(JSON.parse(stored));
		const tokenResponse = await handler.exchangeToken(code, codeVerifier, [
			StartGGScope.USER_IDENTITY,
			StartGGScope.USER_EMAIL,
		]);

		const bearer = BearerToken.fromOAuthResponse(tokenResponse);
		callbackStatus.textContent = "Authorization complete!";
		tokenPreview.textContent = JSON.stringify(
			{
				accessTokenPreview: `${bearer.accessToken.slice(0, 8)}…`,
				expiresIn: tokenResponse.expires_in ?? null,
				scope: tokenResponse.scope ?? null,
				refreshTokenPresent: Boolean(tokenResponse.refresh_token),
			},
			null,
			2,
		);
	} catch (error) {
		console.error("[vite example] Token exchange failed", error);
		const message = error instanceof Error ? error.message : String(error);
		callbackStatus.textContent = `Token exchange failed: ${message}`;
	}
}

handleCallbackIfPresent().catch((err) => {
	console.error("[vite example] Failed to process callback", err);
});
