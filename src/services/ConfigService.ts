import fs from 'fs';
import path from 'path';

export interface BotConfig {
  configured?: boolean;
  guildId?: string;
  notifyChannelId?: string;
  roleChannelId?: string;
  roleMessageId?: string | null;

  resendOnStartup?: boolean;
  reminderMinutes?: number;
  pingRoles?: boolean;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'bot-config.json');

const DEFAULTS = {
  resendOnStartup: true,
  reminderMinutes: 5,
  pingRoles: true,
};

class ConfigService {
  private config: BotConfig = {};
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(CONFIG_PATH)) {
      this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  }

  /** 🔁 Normal save → triggers reload */
  save(config: BotConfig) {
    this.config = {
      ...DEFAULTS,
      ...this.config,
      ...config,
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
    this.emitReload();
  }

  /**
   * 🔇 Silent update
   * Used for internal bookkeeping (ex: roleMessageId)
   * Does NOT reload the bot
   */
  updateSilent(config: BotConfig) {
    this.config = {
      ...DEFAULTS,
      ...this.config,
      ...config,
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
  }

  // Backward compatibility
  update(config: BotConfig) {
    this.save(config);
  }

  get(): BotConfig {
    return {
      ...DEFAULTS,
      ...this.config,
    };
  }

  on(event: 'reload', listener: () => void) {
    if (event === 'reload') {
      this.listeners.push(listener);
    }
  }

  private emitReload() {
    for (const fn of this.listeners) fn();
  }
}

export const configService = new ConfigService();
