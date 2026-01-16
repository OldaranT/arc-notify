import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';
import { MetaforgeService } from './services/MetaforgeService.js';
import { EventMessage } from './domains/EventMessage.js';
import {
  MessageService,
  MapMessageState,
} from './services/MessageService.js';
import { EventRoleService } from './services/EventRoleService.js';
import { CommandService } from './services/CommandService.js';
import { RoleReactionService } from './services/RoleReactionService.js';

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
const announced = new Set<string>();
const liveMessages: Map<string, MapMessageState> = new Map();

client.once('clientReady', async () => {
  console.log(`[Startup] Logged in as ${client.user?.tag}`);

  const announceChannel = (await client.channels.fetch(
    process.env.CHANNEL_ID!
  )) as TextChannel;

  /* -------------------------------------------------- */
  /* STARTUP CLEANUP                                   */
  /* -------------------------------------------------- */

  const fetched = await announceChannel.messages.fetch({ limit: 100 });
  for (const msg of fetched.values()) {
    if (msg.author.id === client.user?.id) {
      await msg.delete().catch(() => {});
    }
  }
  console.log('[Startup] Cleared old bot messages');

  /* -------------------------------------------------- */
  /* ROLE + SERVICES                                   */
  /* -------------------------------------------------- */

  let roleReactionService: RoleReactionService | undefined;
  if (process.env.ROLE_CHANNEL_ID) {
    const roleChannel = (await client.channels.fetch(
      process.env.ROLE_CHANNEL_ID!
    )) as TextChannel;

    roleReactionService = new RoleReactionService(
      roleChannel.guild,
      roleChannel
    );
    await roleReactionService.postReactionRoleMessage();
    console.log('[Startup] Reaction role message ready');
  }

  const roleService = new EventRoleService(
    announceChannel.guild,
    roleReactionService
  );
  await roleService.ensureRolesExist();
  console.log('[Startup] Event roles ensured');

  const messageService = new MessageService(announceChannel);

  const commandService = new CommandService(client);
  await commandService.register();
  console.log('[Startup] Slash commands registered');

  /* -------------------------------------------------- */
  /* INITIAL GLOBAL NOTIFY SEND                         */
  /* -------------------------------------------------- */

  await runGlobalNotify(
    messageService,
    roleService,
    announceChannel,
    true
  );

  /* -------------------------------------------------- */
  /* POLL LOOP                                         */
  /* -------------------------------------------------- */

  const interval = Number(process.env.FETCH_INTERVAL ?? 60) * 1000;

  setInterval(async () => {
    await runGlobalNotify(
      messageService,
      roleService,
      announceChannel,
      false
    );
  }, interval);
});

/* ================================================== */
/* GLOBAL NOTIFY LOGIC                                */
/* ================================================== */

async function runGlobalNotify(
  messageService: MessageService,
  roleService: EventRoleService,
  announceChannel: TextChannel,
  isStartup: boolean
) {
  try {
    const events = (await metaforge.fetchEvents()).map(
      (e) => new EventMessage(e)
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
      list.sort(
        (a, b) =>
          a.startTime.getTime() - b.startTime.getTime()
      );

      const current =
        list.find(
          (e) =>
            e.startTime.getTime() <= now &&
            e.endTime.getTime() > now
        ) ?? null;

      const next =
        list.find((e) => e.startTime.getTime() > now) ??
        list[0];

      const roleId = await roleService.resolve(
        next.name,
        next.icon
      );

      // ✅ FIX: use announceChannel.guild (public)
      const role = await announceChannel.guild.roles.fetch(roleId);
      if (!role) continue;

      const newState = await messageService.sendOrReplace(
        liveMessages.get(map),
        current,
        next,
        role
      );

      liveMessages.set(map, newState);

      console.log(
        `[${isStartup ? 'Startup' : 'Poll'}] ${map} → Current: ${
          current?.name ?? 'None'
        }, Next: ${next.name}`
      );

      const diff = next.startTime.getTime() - now;
      if (
        diff <= 5 * 60 * 1000 &&
        diff > 4.5 * 60 * 1000 &&
        !announced.has(next.key)
      ) {
        announced.add(next.key);
        await messageService.sendPing(next, role);
        console.log(
          `[Ping] 5-minute warning for ${next.name} on ${map}`
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
