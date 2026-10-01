const defaultPanel = {
  title: '🐇 Farm Call',
  description: 'Configure a conexão de voz do bot.',
  color: 0x5865f2,
  banner: '',
  footer: 'Farm Call',
  audioMode: 'muted'
};

function audioMode(value) {
  return ['muted', 'deafened', 'open'].includes(value) ? value : defaultPanel.audioMode;
}

function audioFlags(value) {
  switch (audioMode(value)) {
    case 'deafened':
      return { selfMute: true, selfDeaf: true };
    case 'open':
      return { selfMute: false, selfDeaf: false };
    default:
      return { selfMute: true, selfDeaf: false };
  }
}

function normalizeConfig(data = {}) {
  const panel = { ...defaultPanel, ...(data.panel || {}) };

  panel.audioMode = audioMode(panel.audioMode);
  if (typeof panel.title !== 'string' || !panel.title.trim()) panel.title = defaultPanel.title;
  if (typeof panel.description !== 'string') panel.description = defaultPanel.description;
  if (typeof panel.footer !== 'string') panel.footer = defaultPanel.footer;
  if (typeof panel.banner !== 'string') panel.banner = '';
  if (!Number.isInteger(panel.color) || panel.color < 0 || panel.color > 0xffffff) panel.color = defaultPanel.color;

  return {
    voiceChannelId: typeof data.voiceChannelId === 'string' ? data.voiceChannelId : null,
    panel
  };
}

module.exports = { defaultPanel, audioMode, audioFlags, normalizeConfig };
