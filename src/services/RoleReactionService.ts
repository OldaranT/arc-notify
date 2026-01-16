import { Guild, TextChannel, Message, User, PartialUser } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface EventRole {
  name: string;
  roleId: string;
  emoji: string;
  icon?: string;
}

export class RoleReactionService {
  private guild: Guild;
  private channel: TextChannel;
  private roles: Map<string, EventRole>;
  private filePath: string;
  private message?: Message;

  constructor(guild: Guild, channel: TextChannel) {
    this.guild = guild;
    this.channel = channel;
    this.filePath = path.resolve('src/config/roles.json');

    const json: Record<string, { roleId: string; emoji: string; icon?: string }> =
      fs.existsSync(this.filePath) ? JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) : {};

    this.roles = new Map();
    Object.entries(json).forEach(([name, data]) => {
      this.roles.set(name, { name, roleId: data.roleId, emoji: data.emoji, icon: data.icon });
    });

    console.log('[RoleReactionService] Loaded roles:', Array.from(this.roles.keys()));

    this.registerReactionListeners();
  }

  private registerReactionListeners() {
    const handleReaction = async (reaction: any, user: User | PartialUser) => {
      try {
        if (!this.message) return;
        if (reaction.partial) reaction = await reaction.fetch();
        if (!reaction.message || reaction.message.id !== this.message.id) return;
        if (user.bot) return;

        console.log(`[RoleReactionService] Syncing roles for ${user.tag}`);
        await this.syncMemberRoles(user as User);
      } catch (err) {
        console.error('❌ Error handling reaction:', err);
      }
    };

    this.guild.client.on('messageReactionAdd', handleReaction);
    this.guild.client.on('messageReactionRemove', handleReaction);
  }

  private async syncMemberRoles(user: User) {
    if (!this.message) return;

    try {
      const member = await this.guild.members.fetch(user.id);
      const userReactions = this.message.reactions.cache
        .filter((r) => r.users.cache.has(user.id))
        .map((r) => r.emoji.name);

      for (const role of this.roles.values()) {
        const hasRole = member.roles.cache.has(role.roleId);
        const shouldHave = userReactions.includes(role.emoji);

        if (shouldHave && !hasRole) {
          await member.roles.add(role.roleId).catch(console.error);
          console.log(`✅ Added role ${role.name} to ${member.user.tag}`);
        } else if (!shouldHave && hasRole) {
          await member.roles.remove(role.roleId).catch(console.error);
          console.log(`❌ Removed role ${role.name} from ${member.user.tag}`);
        }
      }
    } catch (err) {
      console.error('❌ Failed to sync member roles:', err);
    }
  }

  public async postReactionRoleMessage(existingMessageId?: string) {
    console.log('[RoleReactionService] Posting reaction role message...');

    const embed = {
      title: 'Self-Assign Event Roles',
      description: 'React to get/remove roles for events!',
      color: 0x3498db,
      fields: Array.from(this.roles.values()).map((role) => ({
        name: `${role.emoji} ${role.name}`,
        value: '\u200b',
        inline: true,
      })),
    };

    const fetchedMessages = await this.channel.messages.fetch({ limit: 50 });
    console.log(`[RoleReactionService] Fetched ${fetchedMessages.size} messages from channel`);

    // Try reuse by existingMessageId
    if (existingMessageId) {
      const existing = fetchedMessages.get(existingMessageId);
      if (existing) this.message = existing;
    }

    // Else try first previous bot embed
    if (!this.message) {
      const previous = fetchedMessages.find(
        (m) => m.author.id === this.guild.client.user?.id && m.embeds.length > 0
      );
      if (previous) this.message = previous;
    }

    // Delete other bot messages
    for (const msg of fetchedMessages.values()) {
      if (msg.author.id === this.guild.client.user?.id && msg.id !== this.message?.id) {
        await msg.delete().catch(() => {});
        console.log(`[RoleReactionService] Deleted old bot message ${msg.id}`);
      }
    }

    // Send or edit embed
    if (this.message) {
      await this.message.edit({ embeds: [embed] });
      console.log(`[RoleReactionService] Edited existing embed message ${this.message.id}`);
    } else {
      this.message = await this.channel.send({ embeds: [embed] });
      console.log(`[RoleReactionService] Sent new embed message ${this.message.id}`);
    }

    // Add missing reactions
    const currentReactions = this.message.reactions.cache.map((r) => r.emoji.name);
    for (const role of this.roles.values()) {
      if (!currentReactions.includes(role.emoji)) {
        await this.message.react(role.emoji).catch(console.error);
        console.log(`[RoleReactionService] Reacted with ${role.emoji}`);
      }
    }
  }

  public async addRole(name: string, roleId: string, emoji: string, icon?: string) {
    this.roles.set(name, { name, roleId, emoji, icon });
    fs.writeFileSync(this.filePath, JSON.stringify(Object.fromEntries(this.roles), null, 2), 'utf-8');
    console.log(`[RoleReactionService] Added role ${name}`);
    await this.postReactionRoleMessage(this.message?.id);
  }

  public getAllRoles() {
    return Array.from(this.roles.values());
  }
}
