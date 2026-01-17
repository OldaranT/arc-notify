import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export interface BotConfig {
  configured?: boolean;
  guildId?: string;
  notifyChannelId?: string;
  roleChannelId?: string;
  roleMessageId?: string | null;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'src/config/bot-config.json');

class ConfigService extends EventEmitter {
  private config: BotConfig = {};

  constructor() {
    super();
    this.load();

    // Reload if file edited manually
    fs.watchFile(CONFIG_PATH, () => {
      const before = JSON.stringify(this.config);
      this.load();
      const after = JSON.stringify(this.config);
      if (before !== after) {
        this.emit('reload');
      }
    });
  }

  private load() {
    if (!fs.existsSync(CONFIG_PATH)) {
      this.config = {};
      return;
    }

    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8').trim();
    this.config = raw ? JSON.parse(raw) : {};
  }

  get(): BotConfig {
    return this.config;
  }

  save(config: BotConfig) {
    this.config = config;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    this.emit('reload');
  }

  // 🔹 NEW: partial update without reload
  update(partial: Partial<BotConfig>) {
    this.config = { ...this.config, ...partial };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
  }
}

export const configService = new ConfigService();
