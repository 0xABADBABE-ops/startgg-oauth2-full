import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { fileURLToPath, URL } from "node:url";
import {
	BearerToken,
	buildAuthorizeUrl,
	StartGGScope,
} from "startgg-oauth2-full";
import { ConfigError, loadNodeConfig } from "./config.js";
import { exchangeTokenWithSecret } from "./exchange.js";

const REQUIRED_SCOPES = [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL];

function openInBrowser(url: string): void {
	const platform = process.platform;
	try {
		if (platform === "darwin") {
			spawn("open", [url], { stdio: "ignore", detached: true }).unref();
		} else if (platform === "win32") {
			// cmd.exe treats unescaped `&` as a command separator, so the URL must stay
			// quoted and the arguments must reach cmd verbatim.
			spawn("cmd.exe", ["/c", "start", '""', `"${url}"`], {
				stdio: "ignore",
				detached: true,
				windowsVerbatimArguments: true,
			}).unref();
		} else {
			spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
		}
	} catch {
		console.log("\nPlease open this URL manually:\n", url);
	}
}

async function main() {
	const cfg = loadNodeConfig();
	const PORT = cfg.port;

	const state = randomUUID();
	const { url: authorizeUrl, codeVerifier } = await buildAuthorizeUrl(
		{
			clientId: cfg.clientId,
			authEndpoint: cfg.authEndpoint,
			redirectUri: cfg.redirectUri,
		},
		{ scopes: REQUIRED_SCOPES, state, extras: { access_type: "offline" } },
	);

	// Answer the callback at whatever path the redirect URI (and therefore the
	// Start.gg app registration) uses, instead of a hardcoded "/callback".
	const callbackPath = new URL(cfg.redirectUri).pathname;

	const server = http.createServer(async (req, res) => {
		try {
			const reqUrl = new URL(req.url || "", `http://localhost:${PORT}`);
			if (reqUrl.pathname !== callbackPath) {
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end("OK");
				return;
			}

			const code = reqUrl.searchParams.get("code");
			const gotState = reqUrl.searchParams.get("state");

			if (!code || !gotState || gotState !== state) {
				res.writeHead(400, { "Content-Type": "text/plain" });
				res.end("Invalid OAuth callback (missing/invalid code or state).");
				console.error("Invalid callback:", { code, state: gotState });
				server.close();
				process.exitCode = 1;
				return;
			}

			try {
				const tokenResponse = await exchangeTokenWithSecret(
					cfg,
					code,
					codeVerifier,
				);
				const bearer = BearerToken.fromOAuthResponse(tokenResponse);
				const masked = (t?: string) =>
					t ? `${t.slice(0, 6)}…${t.slice(-4)}` : undefined;
				console.log("\n✅ OAuth2 token exchange successful!\n");
				console.log("access_token:", masked(tokenResponse.access_token));
				console.log("refresh_token:", masked(tokenResponse.refresh_token));
				console.log("token_type:", tokenResponse.token_type);
				console.log("expires_in:", tokenResponse.expires_in);
				console.log("scope:", tokenResponse.scope ?? "(omitted → unchanged)");
				console.log(
					"\nAuthorization header shape:",
					`Bearer ${masked(tokenResponse.access_token)} (masked — never log real tokens)`,
				);

				res.writeHead(200, { "Content-Type": "text/html" });
				res.end(`
<!doctype html>
<title>OAuth Success</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body style="font-family: system-ui; margin: 2rem;">
  <h1>Success ✅</h1>
  <p>You can close this window and return to the terminal.</p>
</body>`);

				server.close(() => process.exit(0));
			} catch (err) {
				console.error("Token exchange failed:", err);
				res.writeHead(500, { "Content-Type": "text/html" });
				res.end(`<h1>Token exchange failed</h1><pre>${String(err)}</pre>`);
				server.close(() => process.exit(1));
			}
		} catch (err) {
			console.error("Callback error:", err);
			try {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end("Internal error");
			} catch {}
			server.close(() => process.exit(1));
		}
	});

	server.listen(PORT, () => {
		console.log(`\nListening on http://localhost:${PORT}`);
		console.log(`redirect_uri: ${cfg.redirectUri}`);
		console.log(
			"(This exact value must be registered on your Start.gg OAuth app.)",
		);
		console.log("\nOpening browser for OAuth authorization…");
		console.log(
			"(If this does not open automatically, paste this URL manually.)\n",
		);
		console.log(authorizeUrl, "\n");
		openInBrowser(authorizeUrl);
	});
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
	main().catch((e) => {
		if (e instanceof ConfigError) {
			console.error(`\n${e.message}\n`);
			process.exit(1);
		}
		console.error("Fatal:", e);
		process.exit(1);
	});
}
