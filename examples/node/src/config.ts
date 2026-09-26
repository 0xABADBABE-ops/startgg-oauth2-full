import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STARTGG_ENDPOINTS } from "startgg-oauth2-full";

const EXAMPLE_ENV = fileURLToPath(new URL("../.env", import.meta.url));

/**
 * Values that mean "the placeholder was never replaced".
 * Sending any of these to Start.gg makes the authorize page report a confusing
 * `Invalid client` error, so we reject them locally instead.
 */
const PLACEHOLDER_CLIENT_IDS = new Set([
	"",
	"YOUR_CLIENT_ID",
	"YOUR_STARTGG_CLIENT_ID",
]);

export class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConfigError";
	}
}

export type NodeExampleConfig = {
	clientId: string;
	clientSecret?: string;
	authEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	port: number;
};

/**
 * Load `.env` then resolve this example's configuration from the environment.
 *
 * `redirectUri` comes from `STARTGG_REDIRECT_URI`, otherwise it is derived from
 * `PORT` so the value always matches the listener started by `server.ts`.
 */
export function loadNodeConfig(): NodeExampleConfig {
	// Load `.env` next to this example first so the documented root-level
	// `npm run dev:node` / `npm run dev:node:server` work from any cwd; fall
	// back to the caller's working directory.
	dotenv.config({ path: [EXAMPLE_ENV, resolve(process.cwd(), ".env")] });

	const port = Number(process.env.PORT ?? 3000);
	const redirectUri =
		process.env.STARTGG_REDIRECT_URI ?? `http://localhost:${port}/callback`;
	const clientId = (process.env.STARTGG_CLIENT_ID ?? "").trim();

	if (PLACEHOLDER_CLIENT_IDS.has(clientId)) {
		throw new ConfigError(
			[
				"STARTGG_CLIENT_ID is missing or still set to the .env.example placeholder.",
				'Start.gg will respond with "Invalid client" for any of these values.',
				"",
				"Fix:",
				"  1. Create a Public (PKCE) OAuth app: https://start.gg/admin/profile/developer",
				"  2. cp .env.example .env",
				"  3. Set STARTGG_CLIENT_ID=<the client id of that app>",
				`  4. Register this redirect URI on the app (exact match): ${redirectUri}`,
			].join("\n"),
		);
	}

	// Start.gg OAuth client IDs are long alphanumeric strings. Short/numeric values are
	// usually the numeric app ID from the developer console, or a truncated paste.
	if (clientId.length < 8) {
		console.warn(
			[
				"",
				`⚠️  STARTGG_CLIENT_ID ("${clientId}") looks too short to be a Start.gg client ID.`,
				"    Use the OAuth *Client ID* from your app settings, not the numeric app ID.",
				'    Start.gg will otherwise reject the request with "Invalid client".',
				"",
			].join("\n"),
		);
	}

	const clientSecret = process.env.STARTGG_CLIENT_SECRET?.trim() ?? "";
	if (!clientSecret) {
		console.warn(
			[
				"",
				"⚠️  STARTGG_CLIENT_SECRET is not set. start.gg's token endpoint requires",
				'    it even with PKCE, so the final code-for-token exchange will fail',
				'    with "Invalid client".',
				"",
			].join("\n"),
		);
	}

	return {
		clientId,
		// start.gg's token endpoint requires the client secret; the exchange
		// fails with "Invalid client" without it.
		clientSecret: clientSecret || undefined,
		authEndpoint:
			process.env.STARTGG_AUTH_ENDPOINT ?? STARTGG_ENDPOINTS.authorize,
		tokenEndpoint:
			process.env.STARTGG_TOKEN_ENDPOINT ?? STARTGG_ENDPOINTS.token,
		redirectUri,
		port,
	};
}
