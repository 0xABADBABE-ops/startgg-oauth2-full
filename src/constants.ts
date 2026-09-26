export const STARTGG_ENDPOINTS = {
	authorize: "https://api.start.gg/oauth/authorize",
	token: "https://api.start.gg/oauth/access_token",
	refresh: "https://api.start.gg/oauth/refresh",
	gql: "https://api.start.gg/gql/alpha",
} as const;

export const STARTGG_SCOPES = [
	"user.identity",
	"user.email",
	"tournament.manager",
	"tournament.reporter",
] as const;

export const STARTGG_GQL_AUTH_HEADER = "Bearer" as const;

export type StartGGScopeValue = (typeof STARTGG_SCOPES)[number];

export function isValidStartGGScope(scope: string): scope is StartGGScopeValue {
	return STARTGG_SCOPES.includes(scope as StartGGScopeValue);
}
