import { TextChannel, Role, EmbedBuilder, Message } from 'discord.js';
import { EventMessage } from '../domains/EventMessage.js';

export class MessageService {
  private channel: TextChannel;

  constructor(channel: TextChannel) {
    this.channel = channel;
  }

  async send(event: EventMessage, role: Role): Promise<Message> {
    const embed = new EmbedBuilder()
      .setTitle(event.name)
      .setDescription(`Happening on **${event.map}**`)
      .setThumbnail(event.icon)
      .addFields(
        { name: 'Start', value: `<t:${Math.floor(event.startTime.getTime() / 1000)}:F>`, inline: true },
        { name: 'End', value: `<t:${Math.floor(event.endTime.getTime() / 1000)}:F>`, inline: true }
      )
      .setColor(0x1abc9c);

    return await this.channel.send({ content: `<@&${role.id}>`, embeds: [embed] });
  }

  async sendMapEvents(events: EventMessage[], role: Role, messageId?: string): Promise<Message> {
    const nextEvent = events[0];
    const embed = new EmbedBuilder()
      .setTitle(nextEvent.name)
      .setDescription(`Happening on **${nextEvent.map}**`)
      .setThumbnail(nextEvent.icon)
      .addFields(
        { name: 'Start', value: `<t:${Math.floor(nextEvent.startTime.getTime() / 1000)}:F>`, inline: true },
        { name: 'End', value: `<t:${Math.floor(nextEvent.endTime.getTime() / 1000)}:F>`, inline: true }
      )
      .setColor(0x1abc9c);

    if (messageId) {
      try {
        const message = await this.channel.messages.fetch(messageId);
        await message.edit({ content: `<@&${role.id}>`, embeds: [embed] });
        return message;
      } catch {
        return await this.channel.send({ content: `<@&${role.id}>`, embeds: [embed] });
      }
    } else {
      return await this.channel.send({ content: `<@&${role.id}>`, embeds: [embed] });
    }
  }
}
