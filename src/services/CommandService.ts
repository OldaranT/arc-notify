import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Client,
  Interaction,
  PermissionsBitField,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { MetaforgeService } from './MetaforgeService';
import { EventMessage } from '../domains/EventMessage';
import { configService } from './ConfigService';

const NEXT_EVENT_SELECT_ID = 'next-event-select';
const SETUP_NOTIFY_SELECT = 'setup-notify-channel';
const SETUP_ROLE_SELECT = 'setup-role-channel';
const SETUP_CONFIRM = 'setup-confirm';

export class CommandService {
  private client: Client;
  private metaforge = new MetaforgeService();

  private pendingSetup = new Map<string, {
    notifyChannelId?: string;
    roleChannelId?: string;
  }>();

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

          if (
            interaction.commandName === 'setup-reset' ||
            interaction.commandName === 'reset-setup'
          ) {
            configService.save({});
            this.pendingSetup.clear();

            await interaction.reply({
              content: '🔄 Setup reset. You may now run /setup again.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        if (interaction.isChannelSelectMenu()) {
          await this.handleSetupChannelSelect(interaction);
          return;
        }

        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === NEXT_EVENT_SELECT_ID) {
            await this.handleNextEventSelect(interaction);
            return;
          }

          if (interaction.customId === SETUP_CONFIRM) {
            await this.handleSetupConfirm(interaction);
            return;
          }
        }
      } catch (err) {
        console.error('❌ CommandService error:', err);
      }
    });
  }

  /* ================= NEXT EVENT ================= */

  private async buildSelect(events: EventMessage[]) {
    const names = Array.from(new Set(events.map(e => e.name))).sort();
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(NEXT_EVENT_SELECT_ID)
        .setPlaceholder('Select an event')
        .addOptions(
          { label: 'All', value: 'all' },
          ...names.map(name => ({ label: name, value: name }))
        )
    );
  }

  private async handleNextEvent(interaction: ChatInputCommandInteraction) {
    const now = Date.now();
    const events = (await this.metaforge.fetchEvents()).map(e => new EventMessage(e));
    const future = events.filter(e => e.startTime.getTime() > now);

    if (!future.length) {
      await interaction.reply({
        content: '⏳ No upcoming events.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: 'Select an event:',
      components: [await this.buildSelect(future)],
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleNextEventSelect(interaction: StringSelectMenuInteraction) {
    const now = Date.now();
    const events = (await this.metaforge.fetchEvents()).map(e => new EventMessage(e));
    const future = events.filter(e => e.startTime.getTime() > now);

    if (!future.length) {
      await interaction.update({
        content: '⏳ No upcoming events.',
        components: [],
      });
      return;
    }

    const grouped = new Map<string, EventMessage[]>();
    for (const e of future) {
      grouped.set(e.name, [...(grouped.get(e.name) ?? []), e]);
    }

    const row = await this.buildSelect(future);

    /* ---------- ALL EVENTS ---------- */
    if (interaction.values[0] === 'all') {
      const lines: string[] = [];

      for (const [name, list] of grouped) {
        const nextTime = Math.min(...list.map(e => e.startTime.getTime()));
        const runs = list.filter(e => e.startTime.getTime() === nextTime);

        const minsUntil = Math.floor((nextTime - now) / 60000);
        const hours = Math.floor(minsUntil / 60);
        const minutes = minsUntil % 60;

        const durationMinutes = Math.round(
          (runs[0].endTime.getTime() - runs[0].startTime.getTime()) / 60000
        );

        const maps = runs.map(e => e.map).join(', ');

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

    const nextTime = Math.min(...list.map(e => e.startTime.getTime()));
    const runs = list.filter(e => e.startTime.getTime() === nextTime);

    const minsUntil = Math.floor((nextTime - now) / 60000);
    const hours = Math.floor(minsUntil / 60);
    const minutes = minsUntil % 60;

    const durationMinutes = Math.round(
      (runs[0].endTime.getTime() - runs[0].startTime.getTime()) / 60000
    );

    const maps = runs.map(e => e.map).join(', ');

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

  /* ================= SETUP (UNCHANGED) ================= */

  private async handleSetup(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        content: '❌ Only administrators can run setup.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (configService.get().configured) {
      await interaction.reply({
        content: '⚠️ Bot is already set up. Run /setup-reset to reconfigure.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    this.pendingSetup.set(interaction.user.id, {});

    const embed = new EmbedBuilder()
      .setTitle('Bot Setup')
      .setDescription('Select the channels below, then confirm.');

    const notifySelect = new ActionRowBuilder<ChannelSelectMenuBuilder>()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(SETUP_NOTIFY_SELECT)
          .setPlaceholder('Select notify channel')
          .addChannelTypes(ChannelType.GuildText)
      );

    const roleSelect = new ActionRowBuilder<ChannelSelectMenuBuilder>()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(SETUP_ROLE_SELECT)
          .setPlaceholder('Select role channel')
          .addChannelTypes(ChannelType.GuildText)
      );

    const confirm = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SETUP_CONFIRM)
          .setPlaceholder('Confirm setup')
          .addOptions({ label: '✅ Save & Apply', value: 'confirm' })
      );

    await interaction.reply({
      embeds: [embed],
      components: [notifySelect, roleSelect, confirm],
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleSetupChannelSelect(interaction: any) {
    const state = this.pendingSetup.get(interaction.user.id);
    if (!state) return;

    if (interaction.customId === SETUP_NOTIFY_SELECT) {
      state.notifyChannelId = interaction.values[0];
    }

    if (interaction.customId === SETUP_ROLE_SELECT) {
      state.roleChannelId = interaction.values[0];
    }

    await interaction.deferUpdate();
  }

  private async handleSetupConfirm(interaction: StringSelectMenuInteraction) {
    const state = this.pendingSetup.get(interaction.user.id);
    if (!state?.notifyChannelId || !state.roleChannelId) {
      await interaction.reply({
        content: '❌ Please select both channels first.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    configService.save({
      configured: true,
      guildId: interaction.guildId!,
      notifyChannelId: state.notifyChannelId,
      roleChannelId: state.roleChannelId,
      roleMessageId: null,
    });

    this.pendingSetup.delete(interaction.user.id);

    await interaction.update({
      content: '✅ Setup complete. Bot initialized.',
      embeds: [],
      components: [],
    });
  }
}
