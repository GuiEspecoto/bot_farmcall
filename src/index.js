require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');
const { sendPanel, handleInteraction } = require('./panel');
const { VoiceManager } = require('./voiceManager');

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token || !clientId) {
  console.error('Configure DISCORD_TOKEN e CLIENT_ID no .env.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const voice = new VoiceManager();

const commands = [
  new SlashCommandBuilder()
    .setName('farm')
    .setDescription('Controla o Farm Call.')
    .addSubcommand(sub => sub
      .setName('painel')
      .setDescription('Envia o painel do Farm Call.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .toJSON()
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body: commands });
  console.log('Comando /farm registrado.');
}

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'farm') {
      if (interaction.options.getSubcommand() === 'painel') {
        await sendPanel(interaction, voice);
      }
      return;
    }

    await handleInteraction(interaction, voice);
  } catch (error) {
    console.error('Erro:', error);
    const reply = { content: 'Ocorreu um erro ao executar essa ação.', ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.on('error', error => console.error('Discord:', error));
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught exception:', error));

client.login(token).catch(error => {
  console.error('Não foi possível conectar:', error.message);
  process.exit(1);
});
