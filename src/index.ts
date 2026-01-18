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
const warned = new Set<string>();
const started = new Set<string>();
const liveMessages = new Map<string, MapMessageState>();

let pollHandle: NodeJS.Timeout | null = null;
let initialized = false;

/* ================= READY ================= */

client.once('clientReady', async () => {
  console.log(`[Startup] Logged in as ${client.user?.tag}`);
  const commandService = new CommandService(client);
  await commandService.register();
  await startOrReload();
});

configService.on('reload', startOrReload);

/* ================= START / RELOAD ================= */

async function startOrReload() {
  const config = configService.get();
  if (!config.configured) return;

  const guild = await client.guilds.fetch(config.guildId!);
  const channel = (await client.channels.fetch(
    config.notifyChannelId!
  )) as TextChannel;

  if (!initialized && config.resendOnStartup) {
    const msgs = await channel.messages.fetch({ limit: 100 });
    for (const msg of msgs.values()) {
      if (msg.author.id === client.user?.id) {
        await msg.delete().catch(() => {});
      }
    }
  }

  await initializeServices(guild, channel, config);
  initialized = true;
}

async function initializeServices(
  guild: any,
  channel: TextChannel,
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

  const messageService = new MessageService(channel);

  if (pollHandle) clearInterval(pollHandle);

  if (config.resendOnStartup) {
    await runGlobalNotify(messageService, roleService, channel);
  }

  pollHandle = setInterval(() => {
    runGlobalNotify(messageService, roleService, channel);
  }, 60_000);
}

/* ================= GLOBAL NOTIFY ================= */

async function runGlobalNotify(
  messageService: MessageService,
  roleService: EventRoleService,
  channel: TextChannel
) {
  const config = configService.get();
  const reminderMs =
    config.reminderMinutes && config.reminderMinutes > 0
      ? config.reminderMinutes * 60_000
      : null;

  const events = (await metaforge.fetchEvents()).map(
    e => new EventMessage(e)
  );

  const now = Date.now();
  const byMap = new Map<string, EventMessage[]>();

  for (const e of events) {
    if (e.endTime.getTime() <= now) continue;
    const list = byMap.get(e.map) ?? [];
    list.push(e);
    byMap.set(e.map, list);
  }

  for (const [map, list] of byMap) {
    list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const current =
      list.find(
        e => e.startTime.getTime() <= now && e.endTime.getTime() > now
      ) ?? null;

    const next =
      list.find(e => e.startTime.getTime() > now) ?? list[0];

    /* -------- Resolve roles -------- */

    const rolesToPing = [];

    if (config.pingRoles) {
      if (current) {
        const currentRoleId = await roleService.resolve(
          current.name,
          current.icon
        );
        const currentRole = await channel.guild.roles.fetch(currentRoleId);
        if (currentRole) rolesToPing.push(currentRole);
      }

      const nextRoleId = await roleService.resolve(next.name, next.icon);
      const nextRole = await channel.guild.roles.fetch(nextRoleId);
      if (nextRole) rolesToPing.push(nextRole);
    }

    let force = false;
    let notice: string | undefined;

    /* -------- Reminder -------- */
    if (
      reminderMs &&
      !warned.has(next.key) &&
      next.startTime.getTime() - now <= reminderMs
    ) {
      warned.add(next.key);
      force = true;
      notice = `Starts <t:${Math.floor(
        next.startTime.getTime() / 1000
      )}:R>`;
    }

    /* -------- Event started -------- */
    if (current && !started.has(current.key)) {
      started.add(current.key);
      force = true;
      notice = `Started <t:${Math.floor(
        current.startTime.getTime() / 1000
      )}:R>`;
    }

    const state = await messageService.sendOrReplace(
      liveMessages.get(map),
      current,
      next,
      rolesToPing,
      force,
      notice
    );

    liveMessages.set(map, state);
  }
}

(async () => {
  await client.login(process.env.DISCORD_TOKEN);
})();
