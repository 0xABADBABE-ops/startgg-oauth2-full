import { randomUUID } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
	BearerToken,
	buildAuthorizeUrl,
	createStartGGAuth2Handler,
	StartGGScope,
} from "startgg-oauth2-full";
import { ConfigError, loadNodeConfig } from "./config.js";

async function main() {
	const cfg = loadNodeConfig();

	console.log(`\nredirect_uri: ${cfg.redirectUri}`);
	console.log(
		"(This exact value must be registered on your Start.gg OAuth app.)",
	);

	const { url, codeVerifier } = await buildAuthorizeUrl(cfg, {
		scopes: [StartGGScope.USER_IDENTITY],
		state: randomUUID(),
	});

	console.log("\nOpen this URL in your browser to authorize:\n");
	console.log(`${url}\n`);

	const rl = createInterface({ input, output });
	const code = (
		await rl.question('Paste the "code" query parameter once redirected: ')
	).trim();
	rl.close();

	if (!code) {
		console.error("No code supplied. Exiting.");
		process.exit(1);
	}

	const handler = createStartGGAuth2Handler(cfg);
	const tokenResponse = await handler.exchangeToken(code, codeVerifier, [
		StartGGScope.USER_IDENTITY,
	]);
	const bearer = BearerToken.fromOAuthResponse(tokenResponse);

	const masked = (t?: string) =>
		t ? `${t.slice(0, 6)}…${t.slice(-4)}` : undefined;
	console.log("\n✅ Token exchange complete");
	console.log("access_token:", masked(tokenResponse.access_token));
	console.log("refresh_token:", masked(tokenResponse.refresh_token));
	console.log("token_type:", tokenResponse.token_type);
	console.log("expires_in:", tokenResponse.expires_in ?? "n/a");
	console.log("\nAuthorization header:", bearer.toAuthHeader());
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
	main().catch((err) => {
		if (err instanceof ConfigError) {
			console.error(`\n${err.message}\n`);
			process.exit(1);
		}
		console.error(err);
		process.exit(1);
	});
}
