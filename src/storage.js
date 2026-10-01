const fs = require('node:fs');
const path = require('node:path');
const { normalizeConfig } = require('./config');

const dataDir = path.join(__dirname, '..', 'data');
const file = path.join(dataDir, 'config.json');

function makeFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ guilds: {} }, null, 2));
}

function read() {
  makeFile();

  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Não consegui ler data/config.json: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || !data.guilds || typeof data.guilds !== 'object') {
    throw new Error('data/config.json está inválido.');
  }

  return data;
}

function save(data) {
  makeFile();
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

function getGuildConfig(guildId) {
  const data = read();
  const config = normalizeConfig(data.guilds[guildId]);

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = config;
    save(data);
  }

  return config;
}

function updateGuildConfig(guildId, patch) {
  const data = read();
  const current = normalizeConfig(data.guilds[guildId]);

  data.guilds[guildId] = normalizeConfig({
    ...current,
    ...patch,
    panel: { ...current.panel, ...(patch.panel || {}) }
  });

  save(data);
  return data.guilds[guildId];
}

module.exports = { getGuildConfig, updateGuildConfig, file };
