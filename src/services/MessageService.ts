import { TextChannel, Role, EmbedBuilder, Message } from 'discord.js';
import { EventMessage } from '../domains/EventMessage.js';

export interface MapMessageState {
  messageId: string;
  currentKey: string | null;
  nextKey: string;
}

export class MessageService {
  constructor(private channel: TextChannel) {}

  /**
   * Creates or replaces a global notify message.
   * Recreates ONLY if:
   * - current/next event changed
   * - OR force === true (ex: 5-minute warning)
   *
   * Uses Discord relative timestamps so messages do not need polling updates.
   */
  async sendOrReplace(
    state: MapMessageState | undefined,
    current: EventMessage | null,
    next: EventMessage,
    roles: Role[],
    force = false,
    extraNote?: string
  ): Promise<MapMessageState> {
    const currentKey = current?.key ?? null;

    if (
      !force &&
      state &&
      state.currentKey === currentKey &&
      state.nextKey === next.key
    ) {
      return state;
    }

    if (state?.messageId) {
      try {
        const old = await this.channel.messages.fetch(state.messageId);
        await old.delete();
      } catch {
        // ignore
      }
    }

    const embeds: EmbedBuilder[] = [];

    /* ---------------- CURRENT EVENT ---------------- */

    if (current) {
      embeds.push(
        new EmbedBuilder()
          .setTitle(`🟢 Current: ${current.name}`)
          .setDescription(
            `⏱ **Ends:** <t:${Math.floor(
              current.endTime.getTime() / 1000
            )}:R>\n` +
            `🕰 **Ends at:** <t:${Math.floor(
              current.endTime.getTime() / 1000
            )}:F>`
          )
          .setThumbnail(current.icon ?? null)
          .setFooter({ text: current.map })
      );
    }

    /* ---------------- NEXT EVENT ---------------- */

    const durationMin = Math.round(
      (next.endTime.getTime() - next.startTime.getTime()) / 60000
    );

    embeds.push(
      new EmbedBuilder()
        .setTitle(`🔜 Next: ${next.name}`)
        .setDescription(
          `🕒 **Starts:** <t:${Math.floor(
            next.startTime.getTime() / 1000
          )}:R>\n` +
          `🕰 **Starts at:** <t:${Math.floor(
            next.startTime.getTime() / 1000
          )}:F>\n` +
          `🕰 **Ends at:** <t:${Math.floor(
            next.endTime.getTime() / 1000
          )}:F>\n` +
          `⏱ **Duration:** ${durationMin}m`
        )
        .setThumbnail(next.icon ?? null)
        .setFooter({ text: next.map })
    );

    const uniqueRoles = Array.from(
      new Set(roles.map((r) => r.id))
    ).map((id) => roles.find((r) => r.id === id)!);

    const msg: Message = await this.channel.send({
      content:
        uniqueRoles.map((r) => `${r}`).join(' ') +
        (extraNote ? `\n⚠️ **${extraNote}**` : ''),
      embeds,
    });

    return {
      messageId: msg.id,
      currentKey,
      nextKey: next.key,
    };
  }

  /**
   * Role ping (spam is intentional)
   */
  async sendPing(
    event: EventMessage,
    role: Role,
    verb: 'started' | 'starts'
  ): Promise<void> {
    const ts = Math.floor(event.startTime.getTime() / 1000);

    await this.channel.send(
      `${role} **${event.name}** on **${event.map}** ${verb} <t:${ts}:R>`
    );
  }
}
