# Discord.js Bot Demo

This example shows how to generate Start.gg OAuth authorize links and exchange tokens from a Discord slash command using `discord.js` v14.

## Prerequisites
- Node.js 18+ (for global `fetch` and WebCrypto).
- A Discord application with a bot token and the `applications.commands` scope.
- A Start.gg OAuth client configured with a redirect URI like `http://localhost:5175/oauth/callback`.

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
- Optional: `DISCORD_GUILD_ID` for faster guild-only slash command registration.
- Optional overrides: `STARTGG_AUTH_ENDPOINT`, `STARTGG_TOKEN_ENDPOINT`, `STARTGG_REDIRECT_URI`.

## Running the Bot
```bash
npm run dev
```

The script registers the `/startgg-auth` command, logs the bot in, and starts an Express callback server that listens on the redirect URI's port/path (defaults to `http://localhost:5175/oauth/callback`).

1. Invoke `/startgg-auth` in a guild where the bot is present.
2. Follow the generated authorize link; after approving Start.gg, the callback exchanges the code for tokens.
3. The bot logs the full token response and DMs you a confirmation with truncated credentials for demonstration.

Store tokens securely in real applications—persist them in encrypted storage instead of sending them via DM.
