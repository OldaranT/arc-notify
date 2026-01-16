import { Role } from 'discord.js';

export class EventRole {
  readonly id: string;
  readonly name: string;

  private constructor(role: Role) {
    this.id = role.id;
    this.name = role.name;
  }

  static fromGuild(roleName: string, roles: readonly Role[]): EventRole | null {
    const role = roles.find(r => r.name === roleName);
    return role ? new EventRole(role) : null;
  }

  get mention(): string {
    return `<@&${this.id}>`;
  }
}