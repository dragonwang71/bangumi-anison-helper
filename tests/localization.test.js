const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { loadHelpers, source } = require('./helpers');

const { resolveUiLanguage } = loadHelpers(['resolveUiLanguage']);

function readUiText() {
  const match = source.match(/const UI_TEXT = (\{[\s\S]*?\n  \});/);
  assert.ok(match, 'Expected UI_TEXT to exist');
  return vm.runInNewContext(`(${match[1]})`);
}

test('Japanese is the default UI language with English and Chinese available', () => {
  assert.equal(resolveUiLanguage(null), 'ja');
  assert.equal(resolveUiLanguage('ja'), 'ja');
  assert.equal(resolveUiLanguage('en'), 'en');
  assert.equal(resolveUiLanguage('zh-CN'), 'zh-CN');
  assert.equal(resolveUiLanguage('fr'), 'ja');
});

test('Japanese, English, and Chinese contain the same complete set of UI messages', () => {
  const uiText = readUiText();
  assert.deepEqual(Object.keys(uiText.en).sort(), Object.keys(uiText.ja).sort());
  assert.deepEqual(Object.keys(uiText['zh-CN']).sort(), Object.keys(uiText.ja).sort());
  Object.values(uiText.ja).forEach((value) => assert.ok(value));
  Object.values(uiText.en).forEach((value) => assert.ok(value));
  Object.values(uiText['zh-CN']).forEach((value) => assert.ok(value));
});

test('the compact language selector and localized metadata are present', () => {
  assert.match(source, /@name\s+Bangumi Anison Helper - アニメ主題歌検索/);
  assert.match(source, /@name:en\s+Bangumi Anison Helper - Anime Theme Song Search/);
  assert.match(source, /@name:zh-CN\s+Bangumi Anison Helper - 动画主题曲搜索/);
  assert.match(source, /@description:zh-CN\s+/);
  assert.match(source, /className = 'anison-language-select'/);
  const japaneseIndex = source.indexOf("{ value: 'ja', label: '日本語' }");
  const englishIndex = source.indexOf("{ value: 'en', label: 'English' }");
  const chineseIndex = source.indexOf("{ value: 'zh-CN', label: '中文' }");
  assert.ok(japaneseIndex > -1);
  assert.ok(japaneseIndex < englishIndex);
  assert.ok(englishIndex < chineseIndex);
  assert.match(source, /localStorage\.setItem\(UI_LANGUAGE_KEY, uiLanguage\)/);
});

test('Chinese includes the main search and playback controls', () => {
  const uiText = readUiText()['zh-CN'];
  assert.equal(uiText.search, '搜索');
  assert.equal(uiText.tracks, '曲目');
  assert.equal(uiText.playPreview, '试听');
  assert.equal(uiText.copy, '复制');
  assert.equal(uiText.malTitleLoading, '正在读取 MyAnimeList 标题…');
});
