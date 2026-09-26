// Start.gg Vercel Connect Configuration
// Provides typed constants and helpers for using Start.gg with Vercel Connect

export const STARTGG_VERCEL_CONNECT_CONFIG = {
	/** Connector name used in Vercel Connect (oauth/startgg) */
	connectorUid: "oauth/startgg",

	/** Start.gg OAuth endpoints */
	endpoints: {
		authorize: "https://api.start.gg/oauth/authorize",
		token: "https://api.start.gg/oauth/access_token",
		graphql: "https://api.start.gg/gql/alpha",
	},

	/** Available scopes */
	scopes: {
		USER_IDENTITY: "user.identity",
		USER_EMAIL: "user.email",
		TOURNAMENT_MANAGER: "tournament.manager",
		TOURNAMENT_REPORTER: "tournament.reporter",
	} as const,

	/** All scopes as array */
	allScopes: [
		"user.identity",
		"user.email",
		"tournament.manager",
		"tournament.reporter",
	] as const,

	/** Default scopes for basic login */
	defaultScopes: ["user.identity"] as const,

	/** Scopes requiring user.identity */
	scopesRequiringIdentity: [
		"user.email",
		"tournament.manager",
		"tournament.reporter",
	],

	/** Vercel Connect callback URL (must be registered in Start.gg OAuth app) */
	vercelCallbackUrl: "https://connect.vercel.com/callback",

	/** Token endpoint auth method supported by Start.gg */
	tokenEndpointAuthMethod: "client_secret_post" as const,

	/** PKCE is required for Start.gg */
	pkceRequired: true,

	/** Refresh tokens are supported */
	refreshTokensSupported: true,
} as const;

export type StartGGScope =
	(typeof STARTGG_VERCEL_CONNECT_CONFIG.scopes)[keyof typeof STARTGG_VERCEL_CONNECT_CONFIG.scopes];

export type StartGGScopeValue =
	(typeof STARTGG_VERCEL_CONNECT_CONFIG.allScopes)[number];

/**
 * Get the connector UID for Vercel Connect SDK calls
 */
export function getConnectorUid(): string {
	return STARTGG_VERCEL_CONNECT_CONFIG.connectorUid;
}

/**
 * Validate that a scope is a valid Start.gg scope
 */
export function isValidStartGGScope(scope: string): scope is StartGGScopeValue {
	return STARTGG_VERCEL_CONNECT_CONFIG.allScopes.includes(
		scope as StartGGScopeValue,
	);
}

/**
 * Get scopes for a typical user login flow
 */
export function getLoginScopes(includeEmail = true): StartGGScopeValue[] {
	const scopes: StartGGScopeValue[] = ["user.identity"];
	if (includeEmail) scopes.push("user.email");
	return scopes;
}

/**
 * Get scopes for tournament management
 */
export function getTournamentScopes(): StartGGScopeValue[] {
	return ["user.identity", "tournament.manager"];
}

/**
 * Get scopes for tournament reporting
 */
export function getReporterScopes(): StartGGScopeValue[] {
	return ["user.identity", "tournament.reporter"];
}

/**
 * Configuration for creating the Custom OAuth connector via Vercel CLI
 * Use with: vercel connect create --config <(cat config.json)
 */
export const vercelConnectorConfig = {
	name: "startgg",
	type: "oauth",
	managed: false,
	config: {
		authorizationUrl: STARTGG_VERCEL_CONNECT_CONFIG.endpoints.authorize,
		tokenUrl: STARTGG_VERCEL_CONNECT_CONFIG.endpoints.token,
		scopes: STARTGG_VERCEL_CONNECT_CONFIG.allScopes,
		pkce: STARTGG_VERCEL_CONNECT_CONFIG.pkceRequired,
		tokenEndpointAuthMethod:
			STARTGG_VERCEL_CONNECT_CONFIG.tokenEndpointAuthMethod,
	},
} as const;

/**
 * Type-safe helper to build getToken/getTokenResponse parameters
 */
export function createTokenParams(options: {
	subject: { type: "user"; id: string } | { type: "app" };
	scopes?: StartGGScopeValue[];
	installationId?: string;
}) {
	const scopes = options.scopes ?? STARTGG_VERCEL_CONNECT_CONFIG.defaultScopes;
	const installationId = options.installationId;

	// Validate all scopes
	for (const scope of scopes) {
		if (!isValidStartGGScope(scope)) {
			throw new Error(`Invalid Start.gg scope: ${scope}`);
		}
	}

	return {
		connector: STARTGG_VERCEL_CONNECT_CONFIG.connectorUid,
		subject: options.subject,
		scopes,
		...(installationId ? { installationId } : {}),
	};
}

/**
 * Type-safe helper for startAuthorization parameters
 */
export function createAuthParams(options: {
	subject: { type: "user"; id: string };
	scopes?: StartGGScopeValue[];
}) {
	return createTokenParams({ ...options, subject: options.subject });
}
