function neutralizeDiscordMentions(value) {
  return value
    .replace(/@(everyone|here)/gi, '@\u200b$1')
    .replace(/<@([!&]?\d+)>/g, '<@\u200b$1>')
    .replace(/<#(\d+)>/g, '<#\u200b$1>');
}

function sanitizeText(value, maxLength, options = {}) {
  if (typeof value !== 'string') return '';

  const multiline = Boolean(options.multiline);

  let text = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  text = neutralizeDiscordMentions(text);

  if (multiline) {
    text = text
      .split('\n')
      .map(line => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    text = text
      .replace(/[\n\t]+/g, ' ')
      .replace(/ {2,}/g, ' ');
  }

  text = text.trim();

  if (Number.isInteger(maxLength) && maxLength > 0) {
    text = text.slice(0, maxLength);
  }

  return text;
}

function sanitizeImageUrl(value, maxLength = 500) {
  if (typeof value !== 'string') return null;

  const input = value.trim();

  if (input === '') return '';
  if (input.length > maxLength) return null;

  try {
    const url = new URL(input);

    if (url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    if (url.username || url.password) return null;
    if (url.href.length > maxLength) return null;

    return url.href;
  } catch {
    return null;
  }
}

function isValidSnowflake(value) {
  return (
    typeof value === 'string' &&
    /^\d{17,20}$/.test(value)
  );
}

function validateVoiceChannelSelection(guild, channelId) {
  if (!guild) {
    return {
      ok: false,
      reason: 'Servidor inválido.'
    };
  }

  if (!isValidSnowflake(channelId)) {
    return {
      ok: false,
      reason: 'ID do canal inválido.'
    };
  }

  const channel = guild.channels?.cache?.get(channelId);

  if (!channel) {
    return {
      ok: false,
      reason: 'O canal selecionado não existe ou não está disponível.'
    };
  }

  if (
    typeof channel.isVoiceBased !== 'function' ||
    !channel.isVoiceBased()
  ) {
    return {
      ok: false,
      reason: 'O canal selecionado não é de voz.'
    };
  }

  if (
    channel.guildId &&
    guild.id &&
    channel.guildId !== guild.id
  ) {
    return {
      ok: false,
      reason: 'O canal pertence a outro servidor.'
    };
  }

  const botMember = guild.members?.me;

  if (!botMember) {
    return {
      ok: false,
      reason: 'Não foi possível validar o bot no servidor.'
    };
  }

  const permissions = channel.permissionsFor?.(botMember);

  if (
    !permissions ||
    !permissions.has(['ViewChannel', 'Connect'])
  ) {
    return {
      ok: false,
      reason: 'O bot precisa das permissões Ver Canal e Conectar.'
    };
  }

  return {
    ok: true,
    channel
  };
}

module.exports = {
  sanitizeText,
  sanitizeImageUrl,
  isValidSnowflake,
  validateVoiceChannelSelection,
  neutralizeDiscordMentions
};