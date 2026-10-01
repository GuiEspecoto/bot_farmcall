const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const { audioFlags } = require('./config');

class VoiceManager {
  constructor() {
    this.startedAt = new Map();
  }

  async start(guild, channel, mode) {
    if (!guild || !channel) throw new Error('Servidor ou canal inválido.');
    if (!channel.isVoiceBased()) throw new Error('O canal escolhido não é de voz.');
    if (!guild.members.me) throw new Error('Não encontrei o bot no servidor.');

    const permissions = channel.permissionsFor(guild.members.me);
    if (!permissions?.has(['ViewChannel', 'Connect'])) {
      throw new Error('O bot precisa de Ver Canal e Conectar no canal escolhido.');
    }

    const oldConnection = getVoiceConnection(guild.id);
    if (oldConnection) oldConnection.destroy();

    const flags = audioFlags(mode);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: flags.selfMute,
      selfDeaf: flags.selfDeaf
    });

    this.startedAt.set(guild.id, Date.now());

    connection.on('stateChange', async (_, state) => {
      if (state.status !== VoiceConnectionStatus.Disconnected) return;

      try {
        await entersState(connection, VoiceConnectionStatus.Signalling, 5000);
        await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
      } catch {
        if (getVoiceConnection(guild.id) === connection) connection.destroy();
        this.startedAt.delete(guild.id);
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15000);
      return connection;
    } catch (error) {
      if (getVoiceConnection(guild.id) === connection) connection.destroy();
      this.startedAt.delete(guild.id);
      throw new Error(`Falha ao entrar na call: ${error.message}`);
    }
  }

  stop(guildId) {
    const connection = getVoiceConnection(guildId);
    if (!connection) return false;

    connection.destroy();
    this.startedAt.delete(guildId);
    return true;
  }

  isConnected(guildId) {
    return Boolean(getVoiceConnection(guildId));
  }

  getUptime(guildId) {
    const started = this.startedAt.get(guildId);
    return started ? Date.now() - started : 0;
  }
}

module.exports = { VoiceManager };
