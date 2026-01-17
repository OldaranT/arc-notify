import { TextChannel, Role, EmbedBuilder, Message } from 'discord.js';
import { EventMessage } from '../domains/EventMessage';

export interface MapMessageState {
  messageId: string;
  currentKey: string | null;
  nextKey: string;
}

export class MessageService {
  constructor(private channel: TextChannel) {}

  /**
   * Creates or replaces a global notify message ONLY if the event changed.
   * Uses Discord relative timestamps so messages do not need polling updates.
   */
  async sendOrReplace(
    state: MapMessageState | undefined,
    current: EventMessage | null,
    next: EventMessage,
    role: Role
  ): Promise<MapMessageState> {
    // If nothing changed, do nothing
    if (
      state &&
      state.currentKey === (current?.key ?? null) &&
      state.nextKey === next.key
    ) {
      return state;
    }

    // Delete old message if it exists
    if (state?.messageId) {
      try {
        const old = await this.channel.messages.fetch(state.messageId);
        await old.delete();
      } catch {
        // ignore (already deleted, permissions, etc.)
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

    const msg: Message = await this.channel.send({
      content: `${role}`,
      embeds,
    });

    return {
      messageId: msg.id,
      currentKey: current?.key ?? null,
      nextKey: next.key,
    };
  }

  /**
   * Role ping (spam is intentional)
   */
  async sendPing(event: EventMessage, role: Role): Promise<void> {
    await this.channel.send(
      `${role} **${event.name}** is starting soon on **${event.map}**!`
    );
  }
}
