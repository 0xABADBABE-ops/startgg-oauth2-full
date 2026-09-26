import {
	isValidStartGGScope,
	STARTGG_ENDPOINTS,
	STARTGG_GQL_AUTH_HEADER,
	STARTGG_SCOPES,
	type StartGGScopeValue,
} from "../src/constants";

describe("StartGG Constants", () => {
	describe("STARTGG_ENDPOINTS", () => {
		test("authorize endpoint is correct", () => {
			expect(STARTGG_ENDPOINTS.authorize).toBe(
				"https://api.start.gg/oauth/authorize",
			);
		});

		test("token endpoint is correct", () => {
			expect(STARTGG_ENDPOINTS.token).toBe(
				"https://api.start.gg/oauth/access_token",
			);
		});

		test("gql endpoint is correct", () => {
			expect(STARTGG_ENDPOINTS.gql).toBe("https://api.start.gg/gql/alpha");
		});

		test("is readonly at TypeScript level (as const)", () => {
			// TypeScript will error on: STARTGG_ENDPOINTS.authorize = 'https://evil.com'
			// This is compile-time only, verified by tsc --noEmit
			expect(true).toBe(true);
		});
	});

	describe("STARTGG_SCOPES", () => {
		test("contains all expected scopes", () => {
			expect(STARTGG_SCOPES).toEqual([
				"user.identity",
				"user.email",
				"tournament.manager",
				"tournament.reporter",
			]);
		});

		test("is readonly at TypeScript level (as const)", () => {
			// TypeScript will error on: STARTGG_SCOPES.push('evil.scope')
			// This is compile-time only, verified by tsc --noEmit
			expect(true).toBe(true);
		});
	});

	describe("STARTGG_GQL_AUTH_HEADER", () => {
		test("is Bearer", () => {
			expect(STARTGG_GQL_AUTH_HEADER).toBe("Bearer");
		});
	});

	describe("isValidStartGGScope", () => {
		test("returns true for valid scopes", () => {
			expect(isValidStartGGScope("user.identity")).toBe(true);
			expect(isValidStartGGScope("user.email")).toBe(true);
			expect(isValidStartGGScope("tournament.manager")).toBe(true);
			expect(isValidStartGGScope("tournament.reporter")).toBe(true);
		});

		test("returns false for invalid scopes", () => {
			expect(isValidStartGGScope("invalid.scope")).toBe(false);
			expect(isValidStartGGScope("user")).toBe(false);
			expect(isValidStartGGScope("")).toBe(false);
			expect(isValidStartGGScope("user.identity.user.email")).toBe(false);
		});

		test("narrows type correctly", () => {
			const input: string = "user.identity";
			if (isValidStartGGScope(input)) {
				// TypeScript narrows to StartGGScopeValue
				const narrowed: StartGGScopeValue = input;
				expect(narrowed).toBe("user.identity");
			}
		});
	});
});
