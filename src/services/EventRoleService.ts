import { Guild, Role } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { RoleReactionService } from './RoleReactionService';

interface RoleConfig {
  [eventName: string]: { roleId: string; emoji: string; icon?: string };
}

const defaultEmojis = ['🌑','🛡️','❄️','🌙','⚡','🔥','🌊','💀','🪐','🔒','🟢','🔴'];

export class EventRoleService {
  private guild: Guild;
  private rolesFile: string;
  private roles: RoleConfig;
  private roleReactionService?: RoleReactionService;

  constructor(guild: Guild, roleReactionService?: RoleReactionService) {
    this.guild = guild;
    this.rolesFile = path.resolve('src/config/roles.json');
    this.roles = fs.existsSync(this.rolesFile)
      ? JSON.parse(fs.readFileSync(this.rolesFile, 'utf-8'))
      : {};
    this.roleReactionService = roleReactionService;
  }

  async resolve(eventName: string, icon?: string): Promise<string> {
    const existing = this.roles[eventName];
    let role: Role | null = null;

    if (existing?.roleId) {
      try {
        role = await this.guild.roles.fetch(existing.roleId);
        if (!role) delete this.roles[eventName];
      } catch {
        role = null;
        delete this.roles[eventName];
      }
    }

    if (!role) {
      role = await this.guild.roles.create({ name: eventName, mentionable: true });
      const emoji = existing?.emoji || defaultEmojis[Object.keys(this.roles).length % defaultEmojis.length];
      this.roles[eventName] = { roleId: role.id, emoji, icon };
      fs.writeFileSync(this.rolesFile, JSON.stringify(this.roles, null, 2), 'utf-8');

      if (this.roleReactionService) {
        await this.roleReactionService.addRole(eventName, role.id, emoji, icon);
      }
    }

    return role.id;
  }

  async ensureRolesExist() {
    for (const name of Object.keys(this.roles)) {
      await this.resolve(name, this.roles[name].icon);
    }
  }

  getAllRoles(): RoleConfig {
    return this.roles;
  }
}
