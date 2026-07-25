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

test('Japanese is the default UI language and English is opt-in', () => {
  assert.equal(resolveUiLanguage(null), 'ja');
  assert.equal(resolveUiLanguage('ja'), 'ja');
  assert.equal(resolveUiLanguage('en'), 'en');
  assert.equal(resolveUiLanguage('fr'), 'ja');
});

test('Japanese and English contain the same complete set of UI messages', () => {
  const uiText = readUiText();
  assert.deepEqual(Object.keys(uiText.en).sort(), Object.keys(uiText.ja).sort());
  Object.values(uiText.ja).forEach((value) => assert.ok(value));
  Object.values(uiText.en).forEach((value) => assert.ok(value));
});

test('the compact language selector and localized metadata are present', () => {
  assert.match(source, /@name\s+Bangumi Anison Helper - アニメ主題歌検索/);
  assert.match(source, /@name:en\s+Bangumi Anison Helper - Anime Theme Song Search/);
  assert.doesNotMatch(source, /@name:zh-CN|@description:zh-CN/);
  assert.match(source, /className = 'anison-language-select'/);
  assert.match(source, /\{ value: 'ja', label: '日本語' \}/);
  assert.match(source, /\{ value: 'en', label: 'English' \}/);
  assert.match(source, /localStorage\.setItem\(UI_LANGUAGE_KEY, uiLanguage\)/);
});

test('legacy Chinese functional labels are no longer shown', () => {
  [
    'mora自动',
    '点击关闭',
    '点击开启',
    '新窗',
    '新页',
    '点击暂停',
    '点击试听',
    '搜mora中',
    '未找到',
    '复制',
    '已复制',
    '搜索中',
    '已打开',
    '加载曲目中',
    '请输入搜索关键字',
    '未找到表格数据'
  ].forEach((label) => assert.equal(source.includes(label), false, `Unexpected label: ${label}`));
});
