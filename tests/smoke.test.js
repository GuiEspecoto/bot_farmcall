const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  audioFlags,
  normalizeConfig
} = require('../src/config');

const {
  sanitizeText,
  sanitizeImageUrl,
  isValidSnowflake,
  validateVoiceChannelSelection
} = require('../src/inputFilter');

assert.deepEqual(
  audioFlags('muted'),
  { selfMute: true, selfDeaf: false }
);

assert.deepEqual(
  audioFlags('deafened'),
  { selfMute: true, selfDeaf: true }
);

assert.deepEqual(
  audioFlags('open'),
  { selfMute: false, selfDeaf: false }
);

assert.equal(
  normalizeConfig({}).panel.audioMode,
  'muted'
);

assert.ok(
  fs.existsSync(
    path.join(__dirname, '..', 'src', 'inputFilter.js')
  )
);

assert.equal(
  sanitizeText(
    '  teste\u0000   seguro  ',
    100
  ),
  'teste seguro'
);

assert.equal(
  sanitizeText(
    '@everyone teste',
    100
  ),
  '@\u200beveryone teste'
);

assert.equal(
  sanitizeText(
    '<@123456789012345678>',
    100
  ),
  '<@\u200b123456789012345678>'
);

assert.equal(
  sanitizeText(
    'linha 1\n\n\n\nlinha 2',
    100,
    { multiline: true }
  ),
  'linha 1\n\nlinha 2'
);

assert.equal(
  sanitizeImageUrl(
    'https://example.com/banner.png'
  ),
  'https://example.com/banner.png'
);

assert.equal(
  sanitizeImageUrl(
    'http://example.com/banner.png'
  ),
  null
);

assert.equal(
  sanitizeImageUrl(
    'https://user:pass@example.com/banner.png'
  ),
  null
);

assert.equal(
  sanitizeImageUrl(''),
  ''
);

assert.equal(
  isValidSnowflake(
    '123456789012345678'
  ),
  true
);

assert.equal(
  isValidSnowflake('123'),
  false
);

const channelId =
  '123456789012345678';

const fakeChannel = {
  id: channelId,
  guildId: 'guild-test',

  isVoiceBased() {
    return true;
  },

  permissionsFor() {
    return {
      has(values) {
        return (
          values.includes('ViewChannel') &&
          values.includes('Connect')
        );
      }
    };
  }
};

const fakeGuild = {
  id: 'guild-test',

  members: {
    me: {
      id: 'bot-test'
    }
  },

  channels: {
    cache: new Map([
      [channelId, fakeChannel]
    ])
  }
};

const valid =
  validateVoiceChannelSelection(
    fakeGuild,
    channelId
  );

assert.equal(
  valid.ok,
  true
);

assert.equal(
  valid.channel,
  fakeChannel
);

const invalid =
  validateVoiceChannelSelection(
    fakeGuild,
    '123'
  );

assert.equal(
  invalid.ok,
  false
);

console.log(
  'testes ok - filtro V2 validado'
);