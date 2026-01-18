import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';

import { MetaforgeService } from './services/MetaforgeService';
import { EventMessage } from './domains/EventMessage';
import { MessageService, MapMessageState } from './services/MessageService';
import { EventRoleService } from './services/EventRoleService';
import { CommandService } from './services/CommandService';
import { RoleReactionService } from './services/RoleReactionService';
import { configService } from './services/ConfigService';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const metaforge = new MetaforgeService();
const started = new Set<string>();
const warned5 = new Set<string>();
const liveMessages: Map<string, MapMessageState> = new Map();

let pollHandle: NodeJS.Timeout | null = null;
let initialized = false;

/* ================= CLIENT READY ================= */

client.once('clientReady', async () => {
  console.log(`[Startup] Logged in as ${client.user?.tag}`);

  const commandService = new CommandService(client);
  await commandService.register();
  console.log('[Startup] Slash commands registered');

  await startOrReload();
});

configService.on('reload', async () => {
  console.log('[Config] Reload triggered');
  await startOrReload();
});

/* ================= START / RELOAD ================= */

async function startOrReload() {
  const config = configService.get();
  if (!config.configured) {
    console.log('[Init] Waiting for /setup');
    return;
  }

  const guild = await client.guilds.fetch(config.guildId!);
  const announceChannel = (await client.channels.fetch(
    config.notifyChannelId!
  )) as TextChannel;

  if (!initialized) {
    const fetched = await announceChannel.messages.fetch({ limit: 100 });
    for (const msg of fetched.values()) {
      if (msg.author.id === client.user?.id) {
        await msg.delete().catch(() => {});
      }
    }
    console.log('[Startup] Cleared old bot messages');
  }

  await initializeServices(guild, announceChannel, config);
  initialized = true;
}

async function initializeServices(
  guild: any,
  announceChannel: TextChannel,
  config: any
) {
  let roleReactionService: RoleReactionService | undefined;

  if (config.roleChannelId) {
    const roleChannel = (await client.channels.fetch(
      config.roleChannelId
    )) as TextChannel;

    roleReactionService = new RoleReactionService(guild, roleChannel);
    await roleReactionService.postReactionRoleMessage(
      config.roleMessageId ?? undefined
    );
  }

  const roleService = new EventRoleService(guild, roleReactionService);
  await roleService.ensureRolesExist();

  const messageService = new MessageService(announceChannel);

  if (pollHandle) clearInterval(pollHandle);

  await runGlobalNotify(messageService, roleService, announceChannel, true);

  pollHandle = setInterval(async () => {
    await runGlobalNotify(messageService, roleService, announceChannel, false);
  }, 60_000);
}

/* ================= GLOBAL NOTIFY ================= */

async function runGlobalNotify(
  messageService: MessageService,
  roleService: EventRoleService,
  announceChannel: TextChannel,
  isStartup: boolean
) {
  try {
    const events = (await metaforge.fetchEvents()).map(
      e => new EventMessage(e)
    );

    const now = Date.now();
    const eventsPerMap = new Map<string, EventMessage[]>();

    for (const e of events) {
      if (e.endTime.getTime() <= now) continue;
      const list = eventsPerMap.get(e.map) ?? [];
      list.push(e);
      eventsPerMap.set(e.map, list);
    }

    for (const [map, list] of eventsPerMap) {
      list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      const current =
        list.find(e => e.startTime.getTime() <= now && e.endTime.getTime() > now) ?? null;

      const next =
        list.find(e => e.startTime.getTime() > now) ?? list[0];

      /* ---------- RESOLVE ROLES ---------- */

      let currentRole = null;
      if (current) {
        const id = await roleService.resolve(current.name, current.icon);
        currentRole = await announceChannel.guild.roles.fetch(id);
      }

      const nextRoleId = await roleService.resolve(next.name, next.icon);
      const nextRole = await announceChannel.guild.roles.fetch(nextRoleId);
      if (!nextRole) continue;

      let forceRefresh = false;
      let note: string | undefined;

      /* ---------- CURRENT EVENT START ---------- */
      if (current && currentRole && !started.has(current.key)) {
        started.add(current.key);
        await messageService.sendPing(current, currentRole, 'started');
        forceRefresh = true;
      }

      /* ---------- 5 MIN WARNING ---------- */
      const diff = next.startTime.getTime() - now;
      if (
        diff <= 5 * 60 * 1000 &&
        diff > 4.5 * 60 * 1000 &&
        !warned5.has(next.key)
      ) {
        warned5.add(next.key);
        await messageService.sendPing(next, nextRole, 'starts');
        forceRefresh = true;
        note = `Starts <t:${Math.floor(
          next.startTime.getTime() / 1000
        )}:R>`;
      }

      const state = await messageService.sendOrReplace(
        liveMessages.get(map),
        current,
        next,
        [nextRole],
        forceRefresh,
        note
      );

      liveMessages.set(map, state);

      if (!isStartup) {
        console.log(
          `[Poll] ${map} → Current: ${current?.name ?? 'None'}, Next: ${next.name}`
        );
      }
    }
  } catch (err) {
    console.error('❌ Global notify error:', err);
  }
}

(async () => {
  await client.login(process.env.DISCORD_TOKEN);
})();
