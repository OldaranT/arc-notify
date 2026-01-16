import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, TextChannel } from 'discord.js';
import { MetaforgeService } from './services/MetaforgeService.js';
import { EventMessage } from './domains/EventMessage.js';
import { MessageService } from './services/MessageService.js';
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
const liveMessages: Map<string, string> = new Map();

client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);

  const announceChannel = (await client.channels.fetch(process.env.CHANNEL_ID!)) as TextChannel;

  // Clear old messages from the bot (except role reaction message)
  const fetchedMessages = await announceChannel.messages.fetch({ limit: 100 });
  for (const msg of fetchedMessages.values()) {
    if (msg.author.id === client.user?.id) await msg.delete().catch(() => {});
  }
  console.log('[Startup] Cleared old messages in announce channel');

  // Reaction roles
  let roleReactionService: RoleReactionService | undefined;
  if (process.env.ROLE_CHANNEL_ID) {
    const roleChannel = (await client.channels.fetch(process.env.ROLE_CHANNEL_ID!)) as TextChannel;
    roleReactionService = new RoleReactionService(roleChannel.guild, roleChannel);
    await roleReactionService.postReactionRoleMessage();
    console.log('[Startup] Posted/used reaction role message');
  }

  const roleService = new EventRoleService(announceChannel.guild, roleReactionService);
  await roleService.ensureRolesExist();

  const messageService = new MessageService(announceChannel);

  const commandService = new CommandService(client, async () => {
    const events = await metaforge.fetchEvents();
    return events.map((e) => new EventMessage(e));
  });
  await commandService.register();
  console.log('[Startup] Registered commands');

  // Initial live messages per map
  const events = (await metaforge.fetchEvents()).map((e) => new EventMessage(e));
  const now = Date.now();
  const eventsPerMap: Map<string, EventMessage[]> = new Map();

  for (const event of events) {
    if (event.endTime.getTime() <= now) continue;
    const mapEvents = eventsPerMap.get(event.map) || [];
    mapEvents.push(event);
    eventsPerMap.set(event.map, mapEvents);
  }

  for (const [map, mapEvents] of eventsPerMap) {
    const nextEvent = mapEvents.find((e) => e.startTime.getTime() > now) || mapEvents[0];
    const roleId = await roleService.resolve(nextEvent.name, nextEvent.icon);
    const role = await announceChannel.guild.roles.fetch(roleId);
    if (role) {
      const message = await messageService.sendMapEvents([nextEvent], role, liveMessages.get(map));
      liveMessages.set(map, message.id);
      console.log(`[Startup] Sent live message for map "${map}" with event "${nextEvent.name}"`);
    }
  }

  // Polling loop
  const interval = Number(process.env.FETCH_INTERVAL ?? 60) * 1000;
  setInterval(async () => {
    try {
      const events = (await metaforge.fetchEvents()).map((e) => new EventMessage(e));
      const now = Date.now();

      const eventsPerMap: Map<string, EventMessage[]> = new Map();
      for (const event of events) {
        if (event.endTime.getTime() <= now) continue;
        const mapEvents = eventsPerMap.get(event.map) || [];
        mapEvents.push(event);
        eventsPerMap.set(event.map, mapEvents);
      }

      for (const [map, mapEvents] of eventsPerMap) {
        const nextEvent = mapEvents.find((e) => e.startTime.getTime() > now) || mapEvents[0];
        const roleId = await roleService.resolve(nextEvent.name, nextEvent.icon);
        const role = await announceChannel.guild.roles.fetch(roleId);
        if (!role) continue;

        const messageId = liveMessages.get(map);
        const message = await messageService.sendMapEvents([nextEvent], role, messageId);
        liveMessages.set(map, message.id);
        console.log(`[Poll] Updated live message for map "${map}" with event "${nextEvent.name}"`);

        // Pre-event ping 5 mins before
        if (
          nextEvent.startTime.getTime() - now <= 5 * 60 * 1000 &&
          nextEvent.startTime.getTime() - now > 4.5 * 60 * 1000 &&
          !announced.has(nextEvent.key)
        ) {
          announced.add(nextEvent.key);
          await messageService.send(nextEvent, role);
          console.log(`[Ping] Pre-event ping for "${nextEvent.name}"`);
        }
      }
    } catch (err) {
      console.error('❌ Error in poll loop:', err);
    }
  }, interval);
});

(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('❌ Failed to login:', err);
    process.exit(1);
  }
})();
