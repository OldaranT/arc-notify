import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Client,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { SetupEvents } from './SetupEvents.js';
import { MetaforgeService } from './MetaforgeService.js';
import { EventMessage } from '../domains/EventMessage.js';

const CONFIG_PATH = path.resolve(
  process.cwd(),
  'src',
  'config',
  'bot-config.json'
);

const SETUP_MODAL_ID = 'setup-modal';
const NEXT_EVENT_SELECT_ID = 'next-event-select';

export class CommandService {
  private client: Client;
  private metaforge = new MetaforgeService();

  constructor(client: Client) {
    this.client = client;
  }

  async register(): Promise<void> {
    this.client.on('interactionCreate', async (interaction: Interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          if (interaction.commandName === 'next-event') {
            await this.handleNextEvent(interaction);
            return;
          }

          if (interaction.commandName === 'setup') {
            await this.handleSetup(interaction);
            return;
          }

          if (interaction.commandName === 'reset-setup') {
            await this.handleResetSetup(interaction);
            return;
          }
        }

        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === NEXT_EVENT_SELECT_ID) {
            await this.handleNextEventSelect(interaction);
            return;
          }
        }

        if (interaction.isModalSubmit()) {
          if (interaction.customId === SETUP_MODAL_ID) {
            await this.handleSetupSubmit(interaction);
            return;
          }
        }
      } catch (err) {
        console.error('❌ CommandService error:', err);
      }
    });
  }

  /* ================================================== */
  /* /next-event                                       */
  /* ================================================== */

  private async buildSelect(events: EventMessage[]) {
    const names = Array.from(
      new Set(events.map((e) => e.name))
    ).sort((a, b) => a.localeCompare(b));

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(NEXT_EVENT_SELECT_ID)
        .setPlaceholder('Select an event')
        .addOptions(
          { label: 'All', value: 'all' },
          ...names.map((name) => ({
            label: name,
            value: name,
          }))
        )
    );
  }

  private async handleNextEvent(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const now = Date.now();

    const events = (await this.metaforge.fetchEvents()).map(
      (e) => new EventMessage(e)
    );

    const futureEvents = events.filter(
      (e) => e.startTime.getTime() > now
    );

    if (!futureEvents.length) {
      await interaction.reply({
        content: '⏳ No upcoming events yet. Waiting for update.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const row = await this.buildSelect(futureEvents);

    await interaction.reply({
      content: 'Select an event:',
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleNextEventSelect(
    interaction: StringSelectMenuInteraction
  ): Promise<void> {
    const now = Date.now();

    const events = (await this.metaforge.fetchEvents()).map(
      (e) => new EventMessage(e)
    );

    const futureEvents = events.filter(
      (e) => e.startTime.getTime() > now
    );

    if (!futureEvents.length) {
      await interaction.update({
        content: '⏳ No upcoming events.',
        components: [],
      });
      return;
    }

    const grouped = new Map<string, EventMessage[]>();
    for (const e of futureEvents) {
      const list = grouped.get(e.name) ?? [];
      list.push(e);
      grouped.set(e.name, list);
    }

    const row = await this.buildSelect(futureEvents);

    /* ---------- ALL ---------- */

    if (interaction.values[0] === 'all') {
      const lines: string[] = [];

      for (const [name, list] of grouped) {
        const nextTime = Math.min(
          ...list.map((e) => e.startTime.getTime())
        );

        const runs = list.filter(
          (e) => e.startTime.getTime() === nextTime
        );

        const minsUntil = Math.floor(
          (nextTime - now) / 60000
        );
        const hours = Math.floor(minsUntil / 60);
        const minutes = minsUntil % 60;

        const durationMinutes = Math.round(
          (runs[0].endTime.getTime() -
            runs[0].startTime.getTime()) /
            60000
        );

        const maps = runs.map((e) => e.map).join(', ');

        lines.push(
          `• **${name}** — Next in: ${hours}h ${minutes}m · Duration: ${durationMinutes}m · Maps: ${maps}`
        );
      }

      const embed = new EmbedBuilder()
        .setTitle('All Upcoming Events')
        .setDescription(lines.join('\n'));

      await interaction.update({
        embeds: [embed],
        components: [row],
      });
      return;
    }

    /* ---------- SINGLE EVENT ---------- */

    const name = interaction.values[0];
    const list = grouped.get(name);

    if (!list) {
      await interaction.update({
        content: '⏳ Event no longer available.',
        components: [row],
      });
      return;
    }

    const nextTime = Math.min(
      ...list.map((e) => e.startTime.getTime())
    );

    const runs = list.filter(
      (e) => e.startTime.getTime() === nextTime
    );

    const minsUntil = Math.floor(
      (nextTime - now) / 60000
    );
    const hours = Math.floor(minsUntil / 60);
    const minutes = minsUntil % 60;

    const durationMinutes = Math.round(
      (runs[0].endTime.getTime() -
        runs[0].startTime.getTime()) /
        60000
    );

    const maps = runs.map((e) => e.map).join(', ');

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription(
        `🕒 Next in: **${hours}h ${minutes}m**\n` +
        `⏱ Duration: **${durationMinutes}m**\n` +
        `🗺 Maps: **${maps}**`
      )
      .setThumbnail(runs[0].icon ?? null);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  }

  /* ================================================== */
  /* SETUP                                             */
  /* ================================================== */

  private async handleSetup(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      await interaction.reply({
        content: '❌ Only administrators can run setup.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(SETUP_MODAL_ID)
      .setTitle('Bot Setup');

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('guildId')
          .setLabel('Guild ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('notifyChannelId')
          .setLabel('Notify Channel ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('roleChannelId')
          .setLabel('Role Channel ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }

  private async handleSetupSubmit(
    interaction: Interaction
  ): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    const config = {
      configured: true,
      guildId: interaction.fields.getTextInputValue('guildId'),
      notifyChannelId:
        interaction.fields.getTextInputValue('notifyChannelId'),
      roleChannelId:
        interaction.fields.getTextInputValue('roleChannelId'),
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    await interaction.reply({
      content: '✅ Setup complete. Applying now…',
      flags: MessageFlags.Ephemeral,
    });

    SetupEvents.emit('setup-complete');
  }

  private async handleResetSetup(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2));

    await interaction.reply({
      content: '🔄 Setup reset. Run /setup again.',
      flags: MessageFlags.Ephemeral,
    });
  }
}
