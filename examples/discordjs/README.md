# Discord.js Bot Demo

This example shows how to generate Start.gg OAuth authorize links and exchange tokens from a Discord slash command using `discord.js` v14.

## Prerequisites
- Node.js 18+ (for global `fetch` and WebCrypto).
- A Discord application with a bot token and the `applications.commands` scope.
- A Start.gg OAuth client configured with a redirect URI like `http://localhost:3000/api/auth/startgg/callback` (the callback server binds whatever port/path `STARTGG_REDIRECT_URI` contains).

## Setup
```bash
cd examples/discordjs
cp .env.example .env
# Edit .env with your Discord IDs and Start.gg client info
npm install
```

Required `.env` values:
- `DISCORD_TOKEN` – bot token.
- `DISCORD_CLIENT_ID` – application/client ID.
- `STARTGG_CLIENT_ID` – Start.gg OAuth client ID.
- `STARTGG_CLIENT_SECRET` – required by Start.gg's token endpoint (the exchange fails with `Invalid client` without it, even with PKCE). Sent only from the bot's server-side callback.
- Optional: `DISCORD_GUILD_ID` for instant guild-only slash-command registration (global commands may take up to an hour to propagate).
- Optional overrides: `STARTGG_AUTH_ENDPOINT`, `STARTGG_TOKEN_ENDPOINT`, `STARTGG_REDIRECT_URI`.

## Running the Bot
```bash
npm run dev
```

The script registers the `/startgg-auth` command, logs the bot in, and starts an Express callback server that listens on the redirect URI's port/path (defaults to `http://localhost:3000/api/auth/startgg/callback`).

1. Invoke `/startgg-auth` in a guild where the bot is present (open the generated link in the same tab you use for Start.gg).
2. Follow the generated authorize link; after approving Start.gg, the callback exchanges the code for tokens with the client secret added server-side.
3. The bot logs masked token previews and DMs you a confirmation with truncated credentials for demonstration.

Store tokens securely in real applications—persist them in encrypted storage instead of sending them via DM.
