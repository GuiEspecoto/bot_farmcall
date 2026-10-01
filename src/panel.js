const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('./storage');

function formatUptime(ms) {
  if (!ms) return '0s';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function panelEmbed(guild, config, voiceManager) {
  const connected = voiceManager.isConnected(guild.id);
  const channelId = config.voiceChannelId;
  const channel = channelId ? guild.channels.cache.get(channelId) : null;
  const embed = new EmbedBuilder()
    .setColor(config.panel.color)
    .setTitle(config.panel.title)
    .setDescription(config.panel.description)
    .addFields(
      { name: '🔊 Status', value: connected ? '🟢 conectado' : '🔴 desconectado', inline: true },
      { name: '📍 Canal', value: channel ? `<#${channel.id}>` : 'não configurado', inline: true },
      { name: '⏱️ Uptime', value: connected ? formatUptime(voiceManager.getUptime(guild.id)) : '0s', inline: true },
      { name: '🎙️ Áudio', value: config.panel.audioMode === 'open' ? 'microfone + fone ligados' : config.panel.audioMode === 'deafened' ? 'microfone + fone mutados' : 'microfone mutado', inline: false },
    )
    .setFooter({ text: config.panel.footer });
  if (config.panel.banner) embed.setImage(config.panel.banner);
  return embed;
}

function panelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('farm:start').setLabel('Iniciar farm').setEmoji('▶️').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('farm:stop').setLabel('Parar farm').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('farm:settings').setLabel('Configurar').setEmoji('⚙️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('farm:audio').setLabel('Modo de áudio').setEmoji('🎙️').setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('farm:channel').setLabel('Escolher canal').setEmoji('🔊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('farm:refresh').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has('ManageGuild');
}

async function sendPanel(interaction, voiceManager) {
  const config = getGuildConfig(interaction.guildId);
  await interaction.reply({ embeds: [panelEmbed(interaction.guild, config, voiceManager)], components: panelComponents() });
}

async function handleInteraction(interaction, voiceManager) {
  if (!interaction.isButton() && !interaction.isChannelSelectMenu() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return false;
  if (!interaction.guild) return true;

  if (!isAdmin(interaction)) {
    await interaction.reply({ content: '❌ Você precisa de **Gerenciar Servidor** para usar o painel.', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:start') {
    const config = getGuildConfig(interaction.guildId);
    if (!config.voiceChannelId) {
      await interaction.reply({ content: '⚠️ Escolha um canal de voz antes de iniciar.', ephemeral: true });
      return true;
    }
    const channel = interaction.guild.channels.cache.get(config.voiceChannelId);
    try {
      await interaction.deferReply({ ephemeral: true });
      await voiceManager.start(interaction.guild, channel, config.panel.audioMode);
      await interaction.editReply('✅ Farm iniciado. O bot entrou no canal configurado.');
    } catch (error) {
      await interaction.editReply(`❌ ${error.message}`);
    }
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:stop') {
    const stopped = voiceManager.stop(interaction.guildId);
    await interaction.reply({ content: stopped ? '🛑 Farm parado.' : 'ℹ️ O bot já estava desconectado.', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:refresh') {
    const config = getGuildConfig(interaction.guildId);
    await interaction.update({ embeds: [panelEmbed(interaction.guild, config, voiceManager)], components: panelComponents() });
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:channel') {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId('farm:channel_select')
      .setPlaceholder('Selecione o canal de voz')
      .setChannelTypes(ChannelType.GuildVoice)
      .setMinValues(1)
      .setMaxValues(1);
    await interaction.reply({ content: '🔊 Selecione o canal que o bot deve usar:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
    return true;
  }

  if (interaction.isChannelSelectMenu() && interaction.customId === 'farm:channel_select') {
    updateGuildConfig(interaction.guildId, { voiceChannelId: interaction.values[0] });
    await interaction.update({ content: `✅ Canal definido para <#${interaction.values[0]}>.`, components: [] });
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:settings') {
    const config = getGuildConfig(interaction.guildId);
    const modal = new ModalBuilder().setCustomId('farm:settings_modal').setTitle('Configurações do Farm Call');
    const title = new TextInputBuilder().setCustomId('title').setLabel('Título do painel').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100).setValue(config.panel.title);
    const description = new TextInputBuilder().setCustomId('description').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setValue(config.panel.description);
    const footer = new TextInputBuilder().setCustomId('footer').setLabel('Rodapé').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200).setValue(config.panel.footer);
    const banner = new TextInputBuilder().setCustomId('banner').setLabel('URL do banner (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(500).setValue(config.panel.banner);
    const color = new TextInputBuilder().setCustomId('color').setLabel('Cor HEX (ex.: #5865F2)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(7).setValue(`#${config.panel.color.toString(16).padStart(6, '0').toUpperCase()}`);
    await interaction.showModal(modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(description),
      new ActionRowBuilder().addComponents(footer),
      new ActionRowBuilder().addComponents(banner),
      new ActionRowBuilder().addComponents(color),
    ));
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'farm:audio') {
    const menu = new StringSelectMenuBuilder().setCustomId('farm:audio_mode').setPlaceholder('Escolha o modo de áudio').addOptions(
      { label: 'Microfone mudo', value: 'muted', description: 'Microfone mutado e fone ligado' },
      { label: 'Mudo total', value: 'deafened', description: 'Microfone e fone mutados' },
      { label: 'Desmutado', value: 'open', description: 'Microfone e fone ligados' },
    );
    await interaction.reply({ content: '🎙️ Escolha como o bot deve ficar na call:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
    return true;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'farm:audio_mode') {
    const mode = interaction.values[0];
    const config = getGuildConfig(interaction.guildId);
    updateGuildConfig(interaction.guildId, { panel: { ...config.panel, audioMode: mode } });
    await interaction.update({ content: `✅ Modo de áudio definido para **${mode === 'open' ? 'desmutado' : mode === 'deafened' ? 'mudo total' : 'microfone mudo'}**.`, components: [] });
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'farm:settings_modal') {
    const config = getGuildConfig(interaction.guildId);
    const rawColor = interaction.fields.getTextInputValue('color').trim().replace(/^#/, '');
    const parsedColor = Number.parseInt(rawColor, 16);
    const bannerValue = interaction.fields.getTextInputValue('banner').trim();
    const safeColor = /^[0-9a-fA-F]{6}$/.test(rawColor) && Number.isInteger(parsedColor) ? parsedColor : config.panel.color;
    const safeBanner = bannerValue === '' || /^https?:\/\//i.test(bannerValue) ? bannerValue : config.panel.banner;
    updateGuildConfig(interaction.guildId, {
      panel: {
        ...config.panel,
        title: interaction.fields.getTextInputValue('title').trim(),
        description: interaction.fields.getTextInputValue('description').trim(),
        footer: interaction.fields.getTextInputValue('footer').trim(),
        banner: safeBanner,
        color: safeColor,
      },
    });
    await interaction.reply({ content: '✅ Configurações salvas. Use `/farm painel` para publicar o painel atualizado.', ephemeral: true });
    return true;
  }

  return true;
}

module.exports = { panelEmbed, panelComponents, sendPanel, handleInteraction, formatUptime };
