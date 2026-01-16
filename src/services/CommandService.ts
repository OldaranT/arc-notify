import {
  Client,
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { EventMessage } from '../domains/EventMessage.js';

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) : str;
}

export class CommandService {
  private client: Client;
  private getEvents: () => Promise<EventMessage[]>;

  constructor(client: Client, getEvents: () => Promise<EventMessage[]>) {
    this.client = client;
    this.getEvents = getEvents;
  }

  async register() {
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const now = Date.now();

      // /next-upcoming
      if (interaction.commandName === 'next-upcoming') {
        const events = await this.getEvents();
        const upcoming = events.filter(
          (e) => e.startTime.getTime() > now && e.startTime.getTime() <= now + 4 * 60 * 60 * 1000
        );

        if (upcoming.length === 0) {
          console.log('[CommandService] No upcoming events found');
          await interaction.reply({ content: 'No upcoming events in the next 4 hours.', ephemeral: true });
          return;
        }

        const embed = {
          title: 'Next Upcoming Events',
          color: 0x1abc9c,
          fields: upcoming.map((e) => ({
            name: `${e.name} on ${e.map}`,
            value: `<t:${Math.floor(e.startTime.getTime() / 1000)}:F> - <t:${Math.floor(
              e.endTime.getTime() / 1000
            )}:F>`,
          })),
        };

        console.log(`[CommandService] Sending ${upcoming.length} upcoming events`);
        await interaction.reply({ embeds: [embed] });
      }

      // /next-event
      if (interaction.commandName === 'next-event') {
        const events = await this.getEvents();

        const options = events
          .slice(0, 25) // Discord max 25 options
          .map(
            (e) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(truncate(e.name, 100))
                .setValue(truncate(e.name, 100))
                .setDescription(truncate(`Next on ${e.map}`, 100))
          );

        const menu = new StringSelectMenuBuilder()
          .setCustomId('next-event-select')
          .setPlaceholder('Select an event')
          .addOptions(options);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        console.log(`[CommandService] Sending next-event dropdown with ${options.length} options`);
        await interaction.reply({ content: 'Select an event:', components: [row], ephemeral: true });
      }
    });

    // Handle dropdown selection
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId !== 'next-event-select') return;

      const selected = interaction.values[0];
      const events = await this.getEvents();
      const filtered = events.filter((e) => e.name === selected);

      const embed = {
        title: `Upcoming ${selected} Events`,
        color: 0x1abc9c,
        fields: filtered.map((e) => ({
          name: `${e.name} on ${e.map}`,
          value: `<t:${Math.floor(e.startTime.getTime() / 1000)}:F> - <t:${Math.floor(
            e.endTime.getTime() / 1000
          )}:F>`,
        })),
      };

      console.log(`[CommandService] User selected ${selected}, sending ${filtered.length} events`);
      await interaction.update({ content: '', embeds: [embed], components: [] });
    });
  }
}
