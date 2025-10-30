import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js';
import {
  BearerToken,
  StartGGScope,
  buildAuthorizeUrl,
  createStartGGAuth2Handler,
} from 'startgg-oauth2-full/src/auth/StartGGOAuth2';

type PendingAuth = {
  userId: string;
  codeVerifier: string;
  scopes: StartGGScope[];
  timer: NodeJS.Timeout;
};

const pendingAuthorizations = new Map<string, PendingAuth>();
const AUTH_TIMEOUT_MS = 10 * 60_000;

const requiredEnv = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'STARTGG_CLIENT_ID'] as const;
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const startggConfig = {
  clientId: process.env.STARTGG_CLIENT_ID!,
  authEndpoint: process.env.STARTGG_AUTH_ENDPOINT ?? 'https://api.start.gg/oauth/authorize',
  tokenEndpoint: process.env.STARTGG_TOKEN_ENDPOINT ?? 'https://api.start.gg/oauth/token',
  redirectUri: process.env.STARTGG_REDIRECT_URI ?? 'http://localhost:5175/oauth/callback',
};

const redirectUrl = new URL(startggConfig.redirectUri);
if (redirectUrl.protocol !== 'http:') {
  console.warn(
    `[discordjs example] Redirect URI ${startggConfig.redirectUri} is non-HTTP; ` +
      'this demo only spins up an HTTP callback server. Adjust as needed.'
  );
}

const callbackPath = redirectUrl.pathname || '/';
const callbackPort = Number(redirectUrl.port || 5175);

const startggHandler = createStartGGAuth2Handler({
  clientId: startggConfig.clientId,
  redirectUri: startggConfig.redirectUri,
  authEndpoint: startggConfig.authEndpoint,
  tokenEndpoint: startggConfig.tokenEndpoint,
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.once('ready', readyClient => {
  console.log(`[discordjs example] Logged in as ${readyClient.user.tag}`);
});

const scopes = [StartGGScope.USER_IDENTITY, StartGGScope.USER_EMAIL];

async function registerSlashCommand(): Promise<void> {
  const command = new SlashCommandBuilder()
    .setName('startgg-auth')
    .setDescription('Generate a Start.gg OAuth authorize URL with PKCE support.')
    .setDMPermission(false);

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  if (DISCORD_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), {
      body: [command.toJSON()],
    });
    console.log(
      `[discordjs example] Registered /startgg-auth for guild ${DISCORD_GUILD_ID}. ` +
        'Guild commands update instantly.'
    );
  } else {
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
      body: [command.toJSON()],
    });
    console.log('[discordjs example] Registered /startgg-auth globally. Propagation may take up to an hour.');
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'startgg-auth') return;

  await interaction.deferReply({ ephemeral: true });

  const state = `${interaction.user.id}-${randomUUID()}`;

  try {
    const { url, codeVerifier } = await buildAuthorizeUrl(
      {
        clientId: startggConfig.clientId,
        authEndpoint: startggConfig.authEndpoint,
        redirectUri: startggConfig.redirectUri,
      },
      {
        scopes,
        state,
        prompt: 'consent',
      }
    );

    const timer = setTimeout(() => {
      pendingAuthorizations.delete(state);
    }, AUTH_TIMEOUT_MS);

    pendingAuthorizations.set(state, {
      userId: interaction.user.id,
      codeVerifier,
      scopes,
      timer,
    });

    await interaction.editReply({
      content: [
        'Authorize Start.gg with PKCE:',
        url,
        '',
        `This link is tied to your Discord user and expires in ${Math.round(AUTH_TIMEOUT_MS / 60000)} minutes.`,
        'After authorizing, the bot will DM you once the callback succeeds.',
      ].join('\n'),
    });
  } catch (error) {
    console.error('[discordjs example] Failed to build authorize URL', error);
    pendingAuthorizations.delete(state);
    await interaction.editReply('Failed to generate authorize URL. Check the bot logs for details.');
  }
});

const app = express();

app.get(callbackPath, async (req, res) => {
  const { state, code, error, error_description: errorDescription } = req.query as Record<string, string | undefined>;

  if (error) {
    console.warn(`[discordjs example] Authorization error: ${error} ${errorDescription ?? ''}`.trim());
    res.status(400).send('Authorization failed. Check the bot logs for details.');
    return;
  }

  if (!state || !code) {
    res.status(400).send('Missing code or state.');
    return;
  }

  const pending = pendingAuthorizations.get(state);
  if (!pending) {
    res.status(400).send('State no longer valid. Start a new authorization from Discord.');
    return;
  }

  clearTimeout(pending.timer);
  pendingAuthorizations.delete(state);

  try {
    const tokenResponse = await startggHandler.exchangeToken(code, pending.codeVerifier, pending.scopes);
    const bearer = BearerToken.fromOAuthResponse(tokenResponse);
    console.log('[discordjs example] OAuth success for user', pending.userId, tokenResponse);

    try {
      const user = await client.users.fetch(pending.userId);
      const expires = bearer.expiresAt ? new Date(bearer.expiresAt).toISOString() : 'unknown';
      await user.send(
        [
          '✅ Start.gg authorization complete!',
          `Access token (truncated): ${bearer.accessToken.slice(0, 8)}…`,
          `Expires at: ${expires}`,
          'Check the bot logs for the full token payload and handle it securely.',
        ].join('\n')
      );
    } catch (dmError) {
      console.warn('[discordjs example] Unable to DM user with result', dmError);
    }

    res.send('Authorization complete! Return to Discord to continue.');
  } catch (exchangeError) {
    console.error('[discordjs example] Token exchange failed', exchangeError);
    res.status(500).send('Token exchange failed. Check the bot logs for details.');
  }
});

async function main(): Promise<void> {
  await registerSlashCommand();
  await client.login(DISCORD_TOKEN);
  app.listen(callbackPort, () => {
    console.log(`[discordjs example] Listening for Start.gg callbacks on http://localhost:${callbackPort}${callbackPath}`);
  });
}

main().catch(err => {
  console.error('[discordjs example] Fatal startup error', err);
  process.exit(1);
});
