import { Guild, TextChannel, Message, User, PartialUser } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { configService } from './ConfigService';

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
      fs.existsSync(this.filePath)
        ? JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
        : {};

    this.roles = new Map();
    Object.entries(json).forEach(([name, data]) => {
      this.roles.set(name, {
        name,
        roleId: data.roleId,
        emoji: data.emoji,
        icon: data.icon,
      });
    });

    console.log('[RoleReactionService] Loaded roles:', [...this.roles.keys()]);

    this.registerReactionListeners();
  }

  private registerReactionListeners() {
    const handleReaction = async (reaction: any, user: User | PartialUser) => {
      try {
        if (!this.message) return;
        if (reaction.partial) reaction = await reaction.fetch();
        if (reaction.message.id !== this.message.id) return;
        if (user.bot) return;

        await this.syncMemberRoles(user as User);
      } catch (err) {
        console.error('❌ Reaction handler error:', err);
      }
    };

    this.guild.client.on('messageReactionAdd', handleReaction);
    this.guild.client.on('messageReactionRemove', handleReaction);
  }

  private async syncMemberRoles(user: User) {
    if (!this.message) return;

    const member = await this.guild.members.fetch(user.id);
    const userReactions = this.message.reactions.cache
      .filter(r => r.users.cache.has(user.id))
      .map(r => r.emoji.name);

    for (const role of this.roles.values()) {
      const hasRole = member.roles.cache.has(role.roleId);
      const shouldHave = userReactions.includes(role.emoji);

      if (shouldHave && !hasRole) {
        await member.roles.add(role.roleId).catch(console.error);
      } else if (!shouldHave && hasRole) {
        await member.roles.remove(role.roleId).catch(console.error);
      }
    }
  }

  /* ================= REACTION ROLE MESSAGE ================= */

  public async postReactionRoleMessage(existingMessageId?: string) {
    const embed = {
      title: 'Self-Assign Event Roles',
      description: 'React to get/remove roles for events!',
      color: 0x3498db,
      fields: Array.from(this.roles.values()).map(role => ({
        name: `${role.emoji} ${role.name}`,
        value: '\u200b',
        inline: true,
      })),
    };

    // Try reuse saved message
    if (existingMessageId) {
      try {
        this.message = await this.channel.messages.fetch(existingMessageId);
      } catch {
        this.message = undefined;
      }
    }

    // Create or update
    if (!this.message) {
      this.message = await this.channel.send({ embeds: [embed] });
      console.log('[RoleReactionService] Created role message', this.message.id);
    } else {
      await this.message.edit({ embeds: [embed] });
      console.log('[RoleReactionService] Reused role message', this.message.id);
    }

    // 🔴 Persist message ID
    configService.update({ roleMessageId: this.message.id });

    // Ensure reactions exist
    const current = this.message.reactions.cache.map(r => r.emoji.name);
    for (const role of this.roles.values()) {
      if (!current.includes(role.emoji)) {
        await this.message.react(role.emoji).catch(console.error);
      }
    }
  }

  public async addRole(name: string, roleId: string, emoji: string, icon?: string) {
    this.roles.set(name, { name, roleId, emoji, icon });
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(Object.fromEntries(this.roles), null, 2),
      'utf-8'
    );

    await this.postReactionRoleMessage(this.message?.id);
  }
}
