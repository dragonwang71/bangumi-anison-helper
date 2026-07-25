const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const scriptPath = path.join(__dirname, '..', 'bangumi-anison-helper.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

test('userscript starts before supported Annict, Bangumi, and MAL route navigation', () => {
  assert.match(source, /^\/\/ @match\s+https:\/\/annict\.com\/\*$/m);
  assert.match(source, /^\/\/ @match\s+http:\/\/annict\.com\/\*$/m);
  assert.match(source, /^\/\/ @match\s+https:\/\/bangumi\.tv\/\*$/m);
  assert.match(source, /^\/\/ @match\s+http:\/\/bangumi\.tv\/\*$/m);
  assert.match(source, /^\/\/ @match\s+https:\/\/myanimelist\.net\/\*$/m);
  assert.match(source, /^\/\/ @match\s+http:\/\/myanimelist\.net\/\*$/m);
  assert.match(source, /document\.addEventListener\('turbo:load', scheduleInit\)/);
});

test('domain-wide startup only initializes UI on supported routes', () => {
  assert.match(source, /function isSupportedEntryPointRoute\(\)/);
  assert.match(source, /if \(!isSupportedEntryPointRoute\(\)\) return;/);
  assert.match(source, /if \(isSupportedEntryPointRoute\(\)\) scheduleInit\(\);/);
});

test('MAL search buttons cover detail, seasonal, and compact list layouts', () => {
  assert.match(source, /function setupMyAnimeListPage\(\)/);
  assert.match(source, /\^\\\/anime\\\/\(\\d\+\)/);
  assert.match(source, /div\.h1\.edit-info/);
  assert.match(source, /\.seasonal-anime \.title-text h2\.h2_anime_title/);
  assert.match(source, /a\.hoverinfo_trigger\.fw-b/);
  assert.match(source, /function loadMyAnimeListTitleCandidates\(/);
  assert.match(source, /function performMyAnimeListPanelSearch\(/);
  assert.match(source, /getMyAnimeListLabeledTitle\(doc, 'Japanese'\)/);
  assert.match(source, /url: `https:\/\/myanimelist\.net\/anime\/\$\{encodeURIComponent\(animeId\)\}`/);
  assert.match(source, /^\/\/ @connect\s+myanimelist\.net$/m);

  const malSetup = source.slice(
    source.indexOf('function setupMyAnimeListPage()'),
    source.indexOf('function isSupportedEntryPointRoute()')
  );
  assert.match(malSetup, /getMyAnimeListPanelParts\(panelAnchor\)/);
  assert.doesNotMatch(source, /applyMyAnimeListPlaceholderClick/);
});
