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
  'buildAnisonQueryCandidates'
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
