const assert = require('node:assert/strict');
const test = require('node:test');
const { loadHelpers } = require('./helpers');

const helpers = loadHelpers([
  'cleanText',
  'extractCvNames',
  'getProviderVocalKeyword',
  'buildKeyword',
  'buildMoraSearchKeywords',
  'stripSeasonSuffix',
  'buildCjkPrefixCandidates',
  'getFirstBySpace',
  'getFirstByPunctuation',
  'isTooGenericQuery',
  'buildAnisonQueryCandidates',
  'getMyAnimeListAnimeIdFromHref',
  'getMyAnimeListLabeledTitle',
  'getMyAnimeListTitleCandidatesFromDocument'
]);

test('Mora search can use the credited voice actor without losing safe fallbacks', () => {
  const keywords = Array.from(
    helpers.buildMoraSearchKeywords('only my railgun', '御坂美琴 (CV: 佐藤利奈)')
  );

  assert.deepEqual(keywords, [
    'only my railgun 佐藤利奈',
    'only my railgun'
  ]);
});

test('YouTube search keeps the visible performer credit', () => {
  assert.equal(
    helpers.getProviderVocalKeyword('youtube', '御坂美琴 (CV: 佐藤利奈)'),
    '御坂美琴 (CV: 佐藤利奈)'
  );
});

test('anime title candidates preserve the original title and add useful fallbacks', () => {
  const candidates = Array.from(
    helpers.buildAnisonQueryCandidates('SPY×FAMILY Season 2')
  );

  assert.equal(candidates[0], 'SPY×FAMILY Season 2');
  assert.ok(candidates.includes('SPY×FAMILY'));
  assert.equal(new Set(candidates).size, candidates.length);
});

test('generic one-character fallbacks are rejected', () => {
  assert.equal(helpers.isTooGenericQuery('A'), true);
  assert.equal(helpers.isTooGenericQuery('ぼ'), true);
  assert.equal(helpers.isTooGenericQuery('ぼっち・ざ・ろっく！'), false);
});

test('MAL anime ids are stable with or without a title slug', () => {
  assert.equal(
    helpers.getMyAnimeListAnimeIdFromHref(
      'https://myanimelist.net/anime/51553/Tongari_Boushi_no_Atelier'
    ),
    '51553'
  );
  assert.equal(helpers.getMyAnimeListAnimeIdFromHref('/anime/52991'), '52991');
  assert.equal(
    helpers.getMyAnimeListAnimeIdFromHref('https://example.com/anime/52991'),
    ''
  );
});

test('MAL title candidates prefer Japanese, then English, then visible fallbacks', () => {
  function labelNode(label, value) {
    return {
      textContent: `${label}:`,
      closest() {
        return { textContent: `${label}: ${value}` };
      },
      parentElement: null
    };
  }

  const japanese = labelNode('Japanese', 'ロミオの青い空');
  const english = labelNode('English', "Romeo's Blue Skies");
  const doc = {
    querySelectorAll() {
      return [japanese, english];
    },
    querySelector() {
      return { textContent: 'Romeo no Aoi Sora' };
    }
  };

  assert.equal(
    helpers.getMyAnimeListLabeledTitle(doc, 'Japanese'),
    'ロミオの青い空'
  );
  assert.deepEqual(
    Array.from(helpers.getMyAnimeListTitleCandidatesFromDocument(doc, 'Romeo no Aoi Sora')),
    ['ロミオの青い空', "Romeo's Blue Skies", 'Romeo no Aoi Sora']
  );
});

test('MAL keeps a Chinese original stored in the Japanese field as the first candidate', () => {
  const chineseOriginal = {
    textContent: 'Japanese:',
    closest() {
      return { textContent: 'Japanese: 时光代理人' };
    },
    parentElement: null
  };
  const doc = {
    querySelectorAll() {
      return [chineseOriginal];
    },
    querySelector() {
      return { textContent: 'Shiguang Dailiren' };
    }
  };

  assert.deepEqual(
    Array.from(helpers.getMyAnimeListTitleCandidatesFromDocument(doc, 'Shiguang Dailiren')),
    ['时光代理人', 'Shiguang Dailiren']
  );
});
