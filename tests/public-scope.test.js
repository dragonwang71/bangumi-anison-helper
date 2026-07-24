const assert = require('node:assert/strict');
const test = require('node:test');
const { source } = require('./helpers');

test('public metadata uses only the permissions required by the showcase build', () => {
  assert.match(source, /@grant\s+GM_xmlhttpRequest/);
  assert.match(source, /@connect\s+anison\.info/);
  assert.match(source, /@connect\s+mora\.jp/);

  [
    'GM_download',
    'GM_setValue',
    'GM_getValue',
    'GM_addValueChangeListener',
    'GM_removeValueChangeListener',
    '127.0.0.1',
    'localhost',
    'music.163.com'
  ].forEach((value) => assert.doesNotMatch(source, new RegExp(value.replaceAll('.', '\\.'))));
});

test('public build contains Mora and YouTube without private music workflows', () => {
  assert.match(source, /provider: 'mora'/);
  assert.match(source, /provider: 'youtube'/);
  assert.match(source, /Mora/);
  assert.match(source, /YouTube/);

  [
    'netease',
    '网易',
    'local-music',
    'local_tag',
    'LOCAL_MUSIC',
    'D:\\\\DJ',
    '移动中',
    '写入本地音乐'
  ].forEach((value) => assert.equal(source.toLowerCase().includes(value.toLowerCase()), false));
});

test('update links point at the standalone public repository', () => {
  const rawUrl = 'https://raw.githubusercontent.com/dragonwang71/bangumi-anison-helper/main/bangumi-anison-helper.user.js';
  assert.match(source, new RegExp(`@updateURL\\s+${rawUrl.replaceAll('.', '\\.')}`));
  assert.match(source, new RegExp(`@downloadURL\\s+${rawUrl.replaceAll('.', '\\.')}`));
});
