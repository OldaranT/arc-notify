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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { MetaforgeService } from './MetaforgeService';
import { EventMessage } from '../domains/EventMessage';
import { configService } from './ConfigService';

const NEXT_EVENT_SELECT_ID = 'next-event-select';

/* ---- SETUP IDS ---- */
const SETUP_NOTIFY_SELECT = 'setup-notify-channel';
const SETUP_ROLE_SELECT = 'setup-role-channel';
const SETUP_RESEND_SELECT = 'setup-resend';
const SETUP_REMINDER_SELECT = 'setup-reminder';
const SETUP_ROLEMSG_SELECT = 'setup-rolemsg-select';

const SETUP_ROLEMSG_MODAL = 'setup-rolemsg-modal';
const SETUP_ROLEMSG_INPUT = 'setup-rolemsg-input';

export class CommandService {
  private client: Client;
  private metaforge = new MetaforgeService();

  private pendingSetup = new Map<
    string,
    {
      notifyChannelId?: string;
      roleChannelId?: string;
      roleMessageId?: string | null;
      resendOnStartup: boolean;
      reminderMinutes: number;
      pingRoles: boolean;
    }
  >();

  constructor(client: Client) {
    this.client = client;
  }

  async register(): Promise<void> {
    this.client.on('interactionCreate', async (interaction: Interaction) => {
      try {
        /* ================= CHAT COMMANDS ================= */
        if (interaction.isChatInputCommand()) {
          switch (interaction.commandName) {
            case 'next-event':
              await this.handleNextEvent(interaction);
              return;

            case 'setup':
              await this.handleSetup(interaction);
              return;

            case 'current-setup':
              await this.handleCurrentSetup(interaction);
              return;

            case 'reset-setup':
            case 'setup-reset':
              configService.reset();
              this.pendingSetup.clear();
              await interaction.reply({
                content: '🔄 Setup fully reset. Run /setup again.',
                flags: MessageFlags.Ephemeral,
              });
              return;
          }
        }

        /* ================= SELECT MENUS ================= */
        if (interaction.isStringSelectMenu()) {
          if (interaction.customId === NEXT_EVENT_SELECT_ID) {
            await this.handleNextEventSelect(interaction);
            return;
          }

          await this.handleSetupSelect(interaction);
          return;
        }

        if (interaction.isChannelSelectMenu()) {
          await this.handleSetupChannelSelect(interaction);
          return;
        }

        /* ================= MODALS ================= */
        if (interaction.isModalSubmit()) {
          if (interaction.customId === SETUP_ROLEMSG_MODAL) {
            await this.handleRoleMessageModal(interaction);
            return;
          }
        }
      } catch (err) {
        console.error('❌ CommandService error:', err);
      }
    });
  }

  /* ================= NEXT EVENT ================= */

  private buildEventSelect(events: EventMessage[]) {
    const names = Array.from(new Set(events.map(e => e.name))).sort();

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(NEXT_EVENT_SELECT_ID)
        .setPlaceholder('Select an event')
        .addOptions(
          { label: 'All events', value: 'all' },
          ...names.map(name => ({ label: name, value: name }))
        )
    );
  }

  private async handleNextEvent(interaction: ChatInputCommandInteraction) {
    const future = await this.getFutureEvents();

    if (!future.length) {
      await interaction.reply({
        content: '⏳ No upcoming events.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = this.buildAllNearestEventsEmbed(future);

    await interaction.reply({
      embeds: [embed],
      components: [this.buildEventSelect(future)],
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleNextEventSelect(
    interaction: StringSelectMenuInteraction
  ) {
    const future = await this.getFutureEvents();
    const selected = interaction.values[0];

    let embed: EmbedBuilder;

    if (selected === 'all') {
      embed = this.buildAllNearestEventsEmbed(future);
    } else {
      const events = future.filter(e => e.name === selected);

      if (!events.length) {
        embed = new EmbedBuilder()
          .setTitle(selected)
          .setDescription('⏳ Waiting for updates');
      } else {
        embed = this.buildSpecificEventEmbed(events);
      }
    }

    await interaction.update({
      embeds: [embed],
      components: interaction.message.components,
    });
  }

  private async getFutureEvents(): Promise<EventMessage[]> {
    const now = Date.now();
    const events = (await this.metaforge.fetchEvents()).map(
      e => new EventMessage(e)
    );

    return events
      .filter(e => e.startTime.getTime() > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * ALL:
   * - nearest upcoming event per event name
   * - if same timestamp, show all
   */
  private buildAllNearestEventsEmbed(events: EventMessage[]) {
    const grouped = new Map<string, EventMessage[]>();

    for (const e of events) {
      const list = grouped.get(e.name) ?? [];
      list.push(e);
      grouped.set(e.name, list);
    }

    const selected: EventMessage[] = [];

    for (const list of grouped.values()) {
      list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      const first = list[0];
      const sameTime = list.filter(
        e => e.startTime.getTime() === first.startTime.getTime()
      );
      selected.push(...sameTime);
    }

    selected.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const embed = new EmbedBuilder().setTitle('📅 Upcoming Events');

    embed.setDescription(
      selected
        .map(
          e =>
            `• ${e.icon ?? ''} **${e.name}** — <t:${Math.floor(
              e.startTime.getTime() / 1000
            )}:R>`
        )
        .join('\n')
    );

    return embed;
  }

  /**
   * SPECIFIC EVENT:
   * - show icon
   * - show up to 2 upcoming events
   */
  private buildSpecificEventEmbed(events: EventMessage[]) {
    const upcoming = events.slice(0, 2);
    const icon = upcoming[0]?.icon ?? '';

    const embed = new EmbedBuilder()
      .setTitle(`${icon} ${upcoming[0].name}`)
      .setDescription(
        upcoming
          .map(
            e =>
              `• <t:${Math.floor(
                e.startTime.getTime() / 1000
              )}:R>`
          )
          .join('\n')
      );

    return embed;
  }

  /* ================= CURRENT SETUP ================= */

  private async handleCurrentSetup(
    interaction: ChatInputCommandInteraction
  ) {
    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      await interaction.reply({
        content: '❌ Only administrators can view the current setup.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const config = configService.get();

    const roleMessageLink =
      config.guildId && config.roleChannelId && config.roleMessageId
        ? `https://discord.com/channels/${config.guildId}/${config.roleChannelId}/${config.roleMessageId}`
        : '—';

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Current Bot Setup')
      .addFields(
        { name: 'Configured', value: config.configured ? '✅ Yes' : '❌ No', inline: true },
        { name: 'Notify Channel', value: config.notifyChannelId ? `<#${config.notifyChannelId}>` : '—', inline: true },
        { name: 'Role Channel', value: config.roleChannelId ? `<#${config.roleChannelId}>` : '—', inline: true },
        { name: 'Role Message', value: roleMessageLink },
        { name: 'Resend On Startup', value: config.resendOnStartup ? 'Enabled' : 'Disabled', inline: true },
        {
          name: 'Reminder',
          value:
            config.reminderMinutes && config.reminderMinutes > 0
              ? `${config.reminderMinutes} minutes`
              : 'Disabled',
          inline: true,
        },
        { name: 'Ping Roles', value: config.pingRoles ? 'Enabled' : 'Disabled', inline: true }
      );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  /* ================= SETUP (UNCHANGED LOGIC) ================= */

  private async handleSetup(interaction: ChatInputCommandInteraction) {
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

    this.pendingSetup.set(interaction.user.id, {
      resendOnStartup: true,
      reminderMinutes: 5,
      pingRoles: true,
      roleMessageId: null,
    });

    const embed = new EmbedBuilder()
      .setTitle('Bot Setup')
      .setDescription(
        '**Required:** select channels\n' +
          '**Optional:** behavior & role message reuse'
      );

    await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(SETUP_NOTIFY_SELECT)
            .setPlaceholder('Notify channel (required)')
            .addChannelTypes(ChannelType.GuildText)
        ),
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(SETUP_ROLE_SELECT)
            .setPlaceholder('Role channel (required)')
            .addChannelTypes(ChannelType.GuildText)
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SETUP_RESEND_SELECT)
            .setPlaceholder('Resend global notify on startup')
            .addOptions(
              { label: 'True', value: 'true' },
              { label: 'False', value: 'false' }
            )
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SETUP_REMINDER_SELECT)
            .setPlaceholder('Reminder before event start')
            .addOptions(
              { label: 'Disabled', value: '0' },
              { label: '5 minutes', value: '5' },
              { label: '10 minutes', value: '10' },
              { label: '15 minutes', value: '15' }
            )
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SETUP_ROLEMSG_SELECT)
            .setPlaceholder('Role message & save')
            .addOptions(
              { label: 'Create new role message', value: 'new' },
              { label: 'Reuse existing (enter ID)', value: 'reuse' }
            )
        ),
      ],
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

  private async handleSetupSelect(interaction: StringSelectMenuInteraction) {
    const state = this.pendingSetup.get(interaction.user.id);
    if (!state) return;

    if (interaction.customId === SETUP_RESEND_SELECT) {
      state.resendOnStartup = interaction.values[0] === 'true';
    }

    if (interaction.customId === SETUP_REMINDER_SELECT) {
      state.reminderMinutes = Number(interaction.values[0]);
    }

    if (interaction.customId === SETUP_ROLEMSG_SELECT) {
      if (interaction.values[0] === 'reuse') {
        const modal = new ModalBuilder()
          .setCustomId(SETUP_ROLEMSG_MODAL)
          .setTitle('Reuse Role Message')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(SETUP_ROLEMSG_INPUT)
                .setLabel('Existing role message ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );

        await interaction.showModal(modal);
        return;
      }

      await this.finalizeSetup(interaction);
      return;
    }

    await interaction.deferUpdate();
  }

  private async handleRoleMessageModal(interaction: any) {
    const state = this.pendingSetup.get(interaction.user.id);
    if (!state) return;

    state.roleMessageId =
      interaction.fields.getTextInputValue(SETUP_ROLEMSG_INPUT);

    await this.finalizeSetup(interaction);
  }

  private async finalizeSetup(interaction: Interaction) {
    const state = this.pendingSetup.get(interaction.user.id);
    if (!state?.notifyChannelId || !state.roleChannelId) {
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: '❌ Please select both required channels.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    configService.save({
      configured: true,
      guildId: interaction.guildId!,
      notifyChannelId: state.notifyChannelId,
      roleChannelId: state.roleChannelId,
      roleMessageId: state.roleMessageId ?? null,
      resendOnStartup: state.resendOnStartup,
      reminderMinutes: state.reminderMinutes,
      pingRoles: state.pingRoles,
    });

    this.pendingSetup.delete(interaction.user.id);

    if (interaction.isRepliable()) {
      await interaction.reply({
        content: '✅ Setup complete. Configuration saved.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
