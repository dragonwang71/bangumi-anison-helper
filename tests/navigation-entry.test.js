const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const scriptPath = path.join(__dirname, '..', 'bangumi-anison-helper.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

test('userscript starts before supported Annict and Bangumi route navigation', () => {
  assert.match(source, /^\/\/ @match\s+https:\/\/annict\.com\/\*$/m);
  assert.match(source, /^\/\/ @match\s+http:\/\/annict\.com\/\*$/m);
  assert.match(source, /^\/\/ @match\s+https:\/\/bangumi\.tv\/\*$/m);
  assert.match(source, /^\/\/ @match\s+http:\/\/bangumi\.tv\/\*$/m);
  assert.match(source, /document\.addEventListener\('turbo:load', scheduleInit\)/);
});

test('domain-wide startup only initializes UI on supported routes', () => {
  assert.match(source, /function isSupportedEntryPointRoute\(\)/);
  assert.match(source, /if \(!isSupportedEntryPointRoute\(\)\) return;/);
  assert.match(source, /if \(isSupportedEntryPointRoute\(\)\) scheduleInit\(\);/);
});
