const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const filename = fs.existsSync(path.join(root, 'bangumi-anison.user.js'))
  ? 'bangumi-anison.user.js'
  : 'bangumi-anison-helper.user.js';
const source = fs.readFileSync(path.join(root, filename), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1);
  const end = source.indexOf('\n  function ', start + 1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

const sandbox = { URL, atob, module: { exports: {} } };
vm.runInNewContext(
  `${extractFunction('toRealAnisonUrl')}\n${extractFunction('normalizeLinks')}
module.exports = { toRealAnisonUrl, normalizeLinks };`,
  sandbox
);
const { toRealAnisonUrl, normalizeLinks } = sandbox.module.exports;

function link(attributes) {
  return { getAttribute: (name) => attributes[name] ?? null };
}

test('current Anison TV and game results become distinct working program links', () => {
  // Targets observed in the NEEDY GIRL OVERDOSE search response, 2026-11-05.
  const links = ['MjY0MjU=', 'MjQzODk='].map((id) => link({
    href: '#', 'data-mode': 'link', 'data-cat': 'program', 'data-page': id
  }));
  normalizeLinks({ querySelectorAll: () => links });
  assert.deepEqual(links.map((item) => item.href), [
    'http://anison.info/data/program/26425.html',
    'http://anison.info/data/program/24389.html'
  ]);
  for (const item of links) {
    assert.equal(item.target, '_blank');
    assert.equal(item.rel, 'noopener noreferrer');
  }
});

test('song and performer links in the expanded track list also resolve', () => {
  for (const [mode, category, encoded, id] of [
    ['link', 'song', 'MTU2MDQy', '156042'],
    ['link', 'person', 'NTUxODY=', '55186'],
    ['url', 'program', 'MjQzODk=', '24389']
  ]) {
    assert.equal(toRealAnisonUrl('#', link({
      'data-mode': mode, 'data-cat': category, 'data-page': encoded
    })), `http://anison.info/data/${category}/${id}.html`);
  }
});

test('legacy JavaScript links and ordinary URLs still work', () => {
  for (const [href, expected] of [
    ["javascript:link('program','26425')", 'http://anison.info/data/program/26425.html'],
    ['./program/24389.html', 'http://anison.info/data/program/24389.html'],
    ['/data/song/156042.html', 'http://anison.info/data/song/156042.html'],
    ['https://anison.info/data/program/26425.html', 'https://anison.info/data/program/26425.html']
  ]) assert.equal(toRealAnisonUrl(href), expected);
});

test('malformed or non-navigation metadata falls back without breaking other links', () => {
  const fallback = 'http://anison.info/data/program/24389.html';
  for (const attributes of [
    { 'data-page': 'not base64!' },
    { 'data-page': btoa('../24389') },
    { 'data-cat': '../program' },
    { 'data-mode': 'editlink' },
    { 'data-page': '' }
  ]) {
    assert.equal(toRealAnisonUrl(fallback, link({
      'data-mode': 'link', 'data-cat': 'program', 'data-page': 'MjY0MjU=',
      ...attributes
    })), fallback);
  }
  const valid = link({ href: '#', 'data-mode': 'link', 'data-cat': 'program', 'data-page': 'MjY0MjU=' });
  normalizeLinks({ querySelectorAll: () => [
    link({ href: fallback, 'data-mode': 'link', 'data-cat': 'program', 'data-page': '!' }),
    valid
  ] });
  assert.equal(valid.href, 'http://anison.info/data/program/26425.html');
});
