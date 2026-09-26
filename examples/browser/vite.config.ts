import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

/**
 * start.gg's token endpoint requires client_secret and sends no CORS
 * headers, so a pure browser page can never call it directly. This dev-only
 * middleware receives the page's token POST on the same origin and forwards
 * it with the secret from this example's .env added server-side. The secret
 * therefore never reaches the browser.
 */
function readLocalEnv(): Record<string, string> {
	const env: Record<string, string> = {};
	try {
		const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
		for (const line of raw.split(/\r?\n/)) {
			const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
			if (match) env[match[1]] = match[2].trim();
		}
	} catch {
		// No .env yet — the middleware returns a setup hint instead.
	}
	return env;
}

const MISSING_SECRETS = new Set([
	"",
	"YOUR_STARTGG_CLIENT_SECRET",
	"paste-your-real-secret-here",
]);

function startggTokenProxy() {
	return {
		name: "startgg-token-proxy",
		configureServer(server: {
			middlewares: {
				use: (path: string, handler: (req: any, res: any) => void) => void;
			};
		}) {
			server.middlewares.use("/startgg/token", async (req: any, res: any) => {
				const clientSecret = readLocalEnv().STARTGG_CLIENT_SECRET ?? "";
				if (MISSING_SECRETS.has(clientSecret)) {
					res.statusCode = 500;
					res.setHeader("Content-Type", "application/json");
					res.end(
						JSON.stringify({
							error:
								"STARTGG_CLIENT_SECRET is missing in examples/browser/.env — copy it from your Start.gg app settings page.",
						}),
					);
					return;
				}

				const chunks: Uint8Array[] = [];
				for await (const chunk of req) chunks.push(chunk as Uint8Array);
				const params = new URLSearchParams(
					Buffer.concat(chunks).toString("utf8"),
				);
				params.set("client_secret", clientSecret);

				try {
					const upstream = await fetch(
						"https://api.start.gg/oauth/access_token",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
								Accept: "application/json",
							},
							body: params,
						},
					);
					res.statusCode = upstream.status;
					res.setHeader(
						"Content-Type",
						upstream.headers.get("content-type") ?? "application/json",
					);
					res.end(await upstream.text());
				} catch (err) {
					res.statusCode = 502;
					res.setHeader("Content-Type", "application/json");
					res.end(
						JSON.stringify({ error: "Token relay failed", detail: String(err) }),
					);
				}
			});
		},
	};
}

export default defineConfig({
	plugins: [startggTokenProxy()],
	server: {
		// Port 3000 so the dev origin matches the callback registered on the
		// Start.gg app (http://localhost:3000/api/auth/startgg/callback); the
		// SPA history fallback serves this page at that path after the redirect.
		port: 3000,
		open: true,
	},
});
