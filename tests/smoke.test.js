const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audioFlags, normalizeConfig } = require('../src/config');

assert.deepEqual(audioFlags('muted'), { selfMute: true, selfDeaf: false });
assert.deepEqual(audioFlags('deafened'), { selfMute: true, selfDeaf: true });
assert.deepEqual(audioFlags('open'), { selfMute: false, selfDeaf: false });
assert.equal(normalizeConfig({}).panel.audioMode, 'muted');
assert.ok(fs.existsSync(path.join(__dirname, '..', 'src', 'index.js')));
assert.ok(fs.existsSync(path.join(__dirname, '..', 'src', 'panel.js')));

console.log('testes ok');
