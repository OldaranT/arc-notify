import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('next-event')
    .setDescription('View upcoming events'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Run initial bot setup'),

  new SlashCommandBuilder()
    .setName('current-setup')
    .setDescription('View the current bot configuration'),

  new SlashCommandBuilder()
    .setName('reset-setup')
    .setDescription('Reset bot configuration'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_TOKEN!
);

(async () => {
  try {
    console.log('🔁 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('❌ Command registration failed:', err);
  }
})();
