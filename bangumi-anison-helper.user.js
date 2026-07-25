// ==UserScript==
// @name         Bangumi Anison Helper - アニメ主題歌検索
// @name:ja      Bangumi Anison Helper - アニメ主題歌検索
// @name:en      Bangumi Anison Helper - Anime Theme Song Search
// @namespace    https://github.com/dragonwang71/bangumi-anison-helper
// @version      1.1.2
// @description  Bangumi・Annict・MyAnimeListの作品ページにアニメ主題歌情報を表示し、Mora試聴とYouTube検索を追加します。
// @description:ja Bangumi・Annict・MyAnimeListの作品ページにアニメ主題歌情報を表示し、Mora試聴とYouTube検索を追加します。
// @description:en Show anime opening and ending songs on Bangumi, Annict, and MyAnimeList with Mora previews and YouTube search.
// @homepageURL  https://github.com/dragonwang71/bangumi-anison-helper
// @supportURL   https://github.com/dragonwang71/bangumi-anison-helper/issues
// @updateURL    https://raw.githubusercontent.com/dragonwang71/bangumi-anison-helper/main/bangumi-anison-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/dragonwang71/bangumi-anison-helper/main/bangumi-anison-helper.user.js
// @match        https://bangumi.tv/*
// @match        http://bangumi.tv/*
// @match        https://annict.com/*
// @match        http://annict.com/*
// @match        https://myanimelist.net/*
// @match        http://myanimelist.net/*
// @grant        GM_xmlhttpRequest
// @connect      anison.info
// @connect      myanimelist.net
// @connect      mora.jp
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const moraCache = new Map();
  const moraInlineCache = new Map();
  const moraListenUrlCache = new Map();
  const myAnimeListTitleCache = new Map();
  const PREVIEW_MODE_KEY = 'anison_preview_mode';
  const AUTO_MORA_INLINE_KEY = 'anison_auto_mora_inline';
  const UI_LANGUAGE_KEY = 'anison_ui_language';
  const PREVIEW_MODES = { WINDOW: 'window', NEWTAB: 'newtab' };
  const PREVIEW_WINDOW_NAME = 'anison_preview_window';
  const UI_TEXT = {
    ja: {
      autoMoraOn: 'Mora自動：オン',
      autoMoraOff: 'Mora自動：オフ',
      disableAutoMora: 'クリックすると、曲目のMora自動検索をオフにします',
      enableAutoMora: 'クリックすると、曲目のMora自動検索をオンにします',
      previewWindow: '小窓',
      previewNewTab: '新規タブ',
      previewWindowTitle: '現在：同じ小窓で開く（クリックで新規タブに切り替え）',
      previewNewTabTitle: '現在：新しいタブで開く（クリックで小窓に切り替え）',
      pausePreview: '試聴を一時停止',
      playPreview: '試聴する',
      moraPreview: 'Moraで試聴',
      moraSearching: 'Moraを検索中…',
      moraNotFound: '見つかりません',
      copy: 'コピー',
      copied: 'コピー済み',
      searching: '検索中…',
      opened: '開きました',
      tracks: '曲目',
      loadingShort: '読込中',
      actionsHeader: '試聴・検索',
      loadingTracks: '曲目を読み込み中…',
      detailTableNotFound: '曲目表が見つかりません',
      detailTableParseFailed: '曲目表を解析できませんでした',
      detailParseFailed: '曲目データを解析できませんでした',
      detailLoadFailed: '曲目を読み込めませんでした',
      enterSearchKeyword: '検索キーワードを入力してください',
      loading: '読み込み中…',
      parseFailed: 'データを解析できませんでした',
      noTableData: '表データが見つかりません（表記を変えた候補も検索しました）',
      searchPlaceholder: 'anison.info を検索',
      searchHint: 'キーワードを編集して検索できます',
      search: '検索',
      language: '表示言語',
      languageHint: 'Bangumi Anison Helper の表示言語',
      opening: '展開中',
      working: '処理中',
      malTitleLoading: 'MyAnimeList のタイトルを読み込み中…',
      malTitleUnavailable: '検索に使える MyAnimeList のタイトルが見つかりません'
    },
    en: {
      autoMoraOn: 'Mora auto: on',
      autoMoraOff: 'Mora auto: off',
      disableAutoMora: 'Turn off automatic Mora search for track lists',
      enableAutoMora: 'Turn on automatic Mora search for track lists',
      previewWindow: 'Window',
      previewNewTab: 'New tab',
      previewWindowTitle: 'Current: reuse one preview window (click for new tabs)',
      previewNewTabTitle: 'Current: open a new tab each time (click for one preview window)',
      pausePreview: 'Pause preview',
      playPreview: 'Play preview',
      moraPreview: 'Preview on Mora',
      moraSearching: 'Searching Mora…',
      moraNotFound: 'Not found',
      copy: 'Copy',
      copied: 'Copied',
      searching: 'Searching…',
      opened: 'Opened',
      tracks: 'Tracks',
      loadingShort: 'Loading',
      actionsHeader: 'Preview & search',
      loadingTracks: 'Loading tracks…',
      detailTableNotFound: 'Track table not found',
      detailTableParseFailed: 'Could not parse the track table',
      detailParseFailed: 'Could not parse track data',
      detailLoadFailed: 'Could not load tracks',
      enterSearchKeyword: 'Enter a search keyword',
      loading: 'Loading…',
      parseFailed: 'Could not parse the data',
      noTableData: 'No table data found after trying normalized search terms',
      searchPlaceholder: 'Search anison.info',
      searchHint: 'Edit the keyword, then search again',
      search: 'Search',
      language: 'Language',
      languageHint: 'Bangumi Anison Helper display language',
      opening: 'Opening',
      working: 'Working',
      malTitleLoading: 'Loading the title from MyAnimeList…',
      malTitleUnavailable: 'No MyAnimeList title is available for search'
    }
  };
  let previewMode = PREVIEW_MODES.WINDOW;
  let autoMoraInlineEnabled = true;
  let uiLanguage = 'ja';
  let previewWindowRef = null;
  let inlineMoraAudio = null;
  let inlineMoraNowPlayingBtn = null;
  const inlineMoraTaskQueue = [];
  let inlineMoraTaskRunning = 0;
  const INLINE_MORA_MAX_CONCURRENCY = 2;
  const MORA_INLINE_PLAY_ICON = 'https://cf.mora.jp/cfdocs/pc/img/package/pc_btn_play_w.png';
  const MORA_INLINE_PAUSE_ICON = 'https://cf.mora.jp/cfdocs/pc/img/package/pc_pause_btn.gif';

  function applyButtonFeedback(el) {
    el.style.transition = 'all .12s ease';
    el.addEventListener('mouseenter', function () {
      if (!el.disabled) el.style.filter = 'brightness(1.08)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.filter = '';
      el.style.transform = '';
    });
    el.addEventListener('mousedown', function () {
      if (!el.disabled) el.style.transform = 'translateY(1px) scale(0.98)';
    });
    el.addEventListener('mouseup', function () {
      el.style.transform = '';
    });
  }

  function flashButtonText(el, text, ms) {
    const oldText = el.textContent;
    el.textContent = text;
    setTimeout(function () {
      el.textContent = oldText;
    }, ms || 700);
  }

  function resolveUiLanguage(saved) {
    return saved === 'en' ? 'en' : 'ja';
  }

  function getUiLanguage() {
    try {
      return resolveUiLanguage(localStorage.getItem(UI_LANGUAGE_KEY));
    } catch (e) {}
    return 'ja';
  }

  function uiText(key) {
    return (UI_TEXT[uiLanguage] && UI_TEXT[uiLanguage][key]) || UI_TEXT.ja[key] || key;
  }

  function setLocalizedText(el, key) {
    if (!el) return;
    el.dataset.anisonI18n = key;
    el.textContent = uiText(key);
  }

  function clearLocalizedText(el) {
    if (!el) return;
    delete el.dataset.anisonI18n;
  }

  function setLocalizedAttribute(el, attribute, key) {
    if (!el) return;
    el.dataset[`anisonI18n${attribute.replace(/(^|-)([a-z])/g, function (_, __, letter) {
      return letter.toUpperCase();
    })}`] = key;
    el.setAttribute(attribute, uiText(key));
  }

  function refreshLocalizedUi() {
    document.querySelectorAll('[data-anison-i18n]').forEach(function (el) {
      el.textContent = uiText(el.dataset.anisonI18n);
    });
    [
      { attribute: 'title', datasetKey: 'anisonI18nTitle' },
      { attribute: 'placeholder', datasetKey: 'anisonI18nPlaceholder' },
      { attribute: 'aria-label', datasetKey: 'anisonI18nAriaLabel' }
    ].forEach(function (item) {
      document.querySelectorAll(`[data-${item.datasetKey.replace(/[A-Z]/g, function (letter) {
        return `-${letter.toLowerCase()}`;
      })}]`).forEach(function (el) {
        el.setAttribute(item.attribute, uiText(el.dataset[item.datasetKey]));
      });
    });
    document.querySelectorAll('.anison-language-select').forEach(function (select) {
      select.value = uiLanguage;
    });
    document.querySelectorAll('.anison-inline-mora button[data-state]').forEach(function (btn) {
      setInlineMoraPlayBtnState(btn, btn.dataset.state);
    });
    refreshPreviewModeToggles();
    refreshAutoMoraInlineToggles();
  }

  function setUiLanguage(language) {
    uiLanguage = resolveUiLanguage(language);
    try {
      localStorage.setItem(UI_LANGUAGE_KEY, uiLanguage);
    } catch (e) {}
    refreshLocalizedUi();
  }

  function getPreviewMode() {
    try {
      const saved = localStorage.getItem(PREVIEW_MODE_KEY);
      if (saved === PREVIEW_MODES.WINDOW || saved === PREVIEW_MODES.NEWTAB) return saved;
      // Backward compatible: old versions used "split".
      if (saved === 'split') return PREVIEW_MODES.WINDOW;
    } catch (e) {}
    return PREVIEW_MODES.WINDOW;
  }

  function getAutoMoraInlineEnabled() {
    try {
      const saved = localStorage.getItem(AUTO_MORA_INLINE_KEY);
      if (saved === '0' || saved === 'false' || saved === 'off') return false;
      if (saved === '1' || saved === 'true' || saved === 'on') return true;
    } catch (e) {}
    return true;
  }

  function setAutoMoraInlineEnabled(enabled) {
    const next = !!enabled;
    autoMoraInlineEnabled = next;
    try {
      localStorage.setItem(AUTO_MORA_INLINE_KEY, next ? '1' : '0');
    } catch (e) {}
    refreshAutoMoraInlineToggles();
  }

  function setPreviewMode(mode) {
    const next = mode === PREVIEW_MODES.NEWTAB ? PREVIEW_MODES.NEWTAB : PREVIEW_MODES.WINDOW;
    previewMode = next;
    try {
      localStorage.setItem(PREVIEW_MODE_KEY, next);
    } catch (e) {}
    refreshPreviewModeToggles();
  }

  function refreshAutoMoraInlineToggles() {
    document.querySelectorAll('.anison-auto-mora-toggle').forEach(function (btn) {
      setLocalizedText(btn, autoMoraInlineEnabled ? 'autoMoraOn' : 'autoMoraOff');
      setLocalizedAttribute(btn, 'title', autoMoraInlineEnabled ? 'disableAutoMora' : 'enableAutoMora');
      btn.style.opacity = autoMoraInlineEnabled ? '1' : '0.75';
    });
  }

  function refreshPreviewModeToggles() {
    document.querySelectorAll('.anison-preview-mode-toggle').forEach(function (btn) {
      setLocalizedText(btn, previewMode === PREVIEW_MODES.WINDOW ? 'previewWindow' : 'previewNewTab');
      setLocalizedAttribute(btn, 'title', previewMode === PREVIEW_MODES.WINDOW ? 'previewWindowTitle' : 'previewNewTabTitle');
      btn.style.opacity = previewMode === PREVIEW_MODES.WINDOW ? '1' : '0.85';
    });
  }

  function openInReusableWindow(url) {
    if (!url) return;
    try {
      if (previewWindowRef && !previewWindowRef.closed) {
        previewWindowRef.location.href = url;
        previewWindowRef.focus();
        return;
      }
    } catch (e) {}
    previewWindowRef = window.open(url, PREVIEW_WINDOW_NAME, 'resizable=yes,scrollbars=yes');
    try {
      if (previewWindowRef) previewWindowRef.focus();
    } catch (e) {}
  }

  function cleanText(text) {
    return (text == null ? '' : String(text)).replace(/\s+/g, ' ').trim();
  }

  function normalizeCopyText(text) {
    return (text || '')
      .replace(/\r/g, '')
      .replace(/\n+/g, ' ')
      .replace(/[\t\f\v]+/g, ' ')
      .trim();
  }

  function getCellTextByLine(cell, lineSeparator) {
    if (!cell) return '';
    const sep = typeof lineSeparator === 'string' ? lineSeparator : ' ';

    // Robustly split by visual line boundaries (<br>/block nodes), not only \n text.
    const lines = [];
    let buf = '';

    function flush() {
      const t = cleanText(buf);
      if (t) lines.push(t);
      buf = '';
    }

    function isBlockLikeTag(tag) {
      return /^(DIV|P|LI|TR|TD|TH|SECTION|ARTICLE|HEADER|FOOTER|H[1-6]|UL|OL)$/i.test(tag || '');
    }

    function walk(node) {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        buf += node.nodeValue || '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName || '';
      if (tag.toUpperCase() === 'BR') {
        flush();
        return;
      }

      const blockLike = isBlockLikeTag(tag);
      if (blockLike) flush();

      Array.from(node.childNodes).forEach(walk);

      if (blockLike) flush();
    }

    walk(cell);
    flush();
    if (lines.length > 0) return lines.join(sep);

    // Fallback: many singer cells are links separated visually but textContent is concatenated.
    const linkLines = Array.from(cell.querySelectorAll('a'))
      .map(function (a) { return cleanText(a.textContent); })
      .filter(Boolean);
    if (linkLines.length > 1) return linkLines.join(sep);

    const raw = typeof cell.innerText === 'string' ? cell.innerText : (cell.textContent || '');
    return cleanText(raw);
  }

  function extractCvNames(text) {
    const names = [];
    const re = /(?:\(|（)\s*CV\s*[:：]\s*([^)）]+?)\s*(?:\)|）)/giu;
    const src = text || '';
    let m;
    while ((m = re.exec(src)) !== null) {
      const name = cleanText(m[1]);
      if (name) names.push(name);
    }
    return Array.from(new Set(names));
  }

  function getProviderVocalKeyword(provider, vocalText) {
    const vocal = cleanText(vocalText);
    if (!vocal) return '';
    if (provider !== 'mora') return vocal;
    const cvNames = extractCvNames(vocal);
    if (cvNames.length > 0) return cvNames.join(' ');
    return vocal;
  }

  function buildKeyword(songText, vocalText) {
    return [cleanText(songText), cleanText(vocalText)].filter(Boolean).join(' ');
  }

  function buildMoraSearchKeywords(songText, vocalText) {
    const song = cleanText(songText);
    const providerVocal = getProviderVocalKeyword('mora', vocalText);
    const songNoBracket = cleanText(song.replace(/[【】\[\]\(\)（）『』「」]/g, ' '));
    const withVocal = buildKeyword(song, providerVocal);
    return Array.from(new Set([withVocal, song, songNoBracket].map(cleanText).filter(Boolean)));
  }

  function parseMoraAuditionOnclick(onclickText) {
    const text = onclickText || '';
    const m = text.match(/Audition\.onAuditionBtn\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*'([^']*)'(?:\s*,\s*'([^']*)')?/i);
    if (!m) return null;
    return {
      materialNo: cleanText(m[1]),
      mediaFlg: Number(m[2] || 1) || 1,
      image200: cleanText(m[3] || ''),
      artistName: cleanText(m[4] || '')
    };
  }

  function pickFirstMoraSearchMusicItem(doc) {
    if (!doc) return null;
    const items = Array.from(doc.querySelectorAll('article.search_musicWrapper[id^="search_summary_music_item"]'));
    if (items.length === 0) return null;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const playAnchor = item.querySelector('.search_musicTry a.search_btnTryAudio');
      if (!playAnchor) continue;

      const onclickInfo = parseMoraAuditionOnclick(playAnchor.getAttribute('onclick') || '');
      const materialNo = cleanText((playAnchor.getAttribute('rel') || '') || (onclickInfo ? onclickInfo.materialNo : ''));
      if (!materialNo) continue;

      const coverImg = item.querySelector('.search_musicTitle img');
      const titleNode = item.querySelector('a.linkArea p') || item.querySelector('p');
      const artistNode = item.querySelector('.search_musicArtist');
      const trackLink =
        item.querySelector('a[href*="/package/"][href*="trackMaterialNo="]') ||
        item.querySelector('a[href*="/package/"]');

      return {
        materialNo: materialNo,
        mediaFlg: onclickInfo ? onclickInfo.mediaFlg : 1,
        cover130: cleanText(coverImg ? (coverImg.getAttribute('src') || '') : ''),
        cover200: cleanText(onclickInfo ? onclickInfo.image200 : ''),
        title: cleanText(titleNode ? titleNode.textContent : ''),
        artist: cleanText(artistNode ? artistNode.textContent : ''),
        trackUrl: cleanText(trackLink ? trackLink.href : '')
      };
    }
    return null;
  }

  function fetchMoraListenUrl(materialNo, onDone, onFail) {
    const id = cleanText(materialNo);
    if (!id) {
      onFail();
      return;
    }

    const cached = moraListenUrlCache.get(id);
    if (cached && cached.url && Date.now() - cached.time < 5 * 60 * 1000) {
      onDone(cached.url);
      return;
    }

    const url = `https://mora.jp/listenDownload?materialNo=${encodeURIComponent(id)}`;
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://mora.jp/search/top'
      },
      onload: function (resp) {
        try {
          const data = JSON.parse((resp.responseText || '').trim());
          const listenUrl = cleanText(data && data.listenUrl ? data.listenUrl : '');
          if (!listenUrl) {
            onFail();
            return;
          }
          moraListenUrlCache.set(id, { url: listenUrl, time: Date.now() });
          onDone(listenUrl);
        } catch (e) {
          onFail();
        }
      },
      onerror: function () {
        onFail();
      }
    });
  }

  function fetchMoraInlineItem(songText, vocalText, onDone, onFail) {
    const key = `${songText}||${vocalText}`;
    if (moraInlineCache.has(key)) {
      const cached = moraInlineCache.get(key);
      if (cached) onDone(cached);
      else onFail();
      return;
    }

    const keywords = buildMoraSearchKeywords(songText, vocalText);
    if (keywords.length === 0) {
      moraInlineCache.set(key, null);
      onFail();
      return;
    }

    function tryKeyword(idx) {
      if (idx >= keywords.length || idx >= 3) {
        moraInlineCache.set(key, null);
        onFail();
        return;
      }

      const keyword = keywords[idx];
      const searchUrl = `https://mora.jp/search/top?keyWord=${encodeURIComponent(keyword)}`;
      const resultApi = `https://mora.jp/search/getResult?keyWord=${encodeURIComponent(keyword)}&_=${Date.now()}`;
      GM_xmlhttpRequest({
        method: 'GET',
        url: resultApi,
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: searchUrl
        },
        onload: function (resp) {
          try {
            const data = JSON.parse((resp.responseText || '').trim());
            const trackList = (((data || {}).data || {}).trackResult || {}).list || [];
            const packageList = (((data || {}).data || {}).packageResult || {}).list || [];

            function normListenFlg(x) {
              const raw = x && x.listenFlg;
              if (raw === undefined || raw === null || raw === '') return 1;
              const n = Number(raw);
              return Number.isFinite(n) ? n : 1;
            }

            function buildItem(raw) {
              const materialNo = cleanText(String(raw && raw.materialNo ? raw.materialNo : ''));
              if (!materialNo) return null;
              const packagePage = cleanText(raw.packagePage || '');
              const trackUrl = packagePage ? `${packagePage}${packagePage.indexOf('?') >= 0 ? '&' : '?'}trackMaterialNo=${encodeURIComponent(materialNo)}` : '';
              return {
                materialNo: materialNo,
                mediaFlg: Number(raw.mediaFlg || 1) || 1,
                title: cleanText(raw.trackTitle || raw.packageTitle || ''),
                artist: cleanText(raw.artistName || ''),
                cover130: cleanText(raw.weblistsizeimage || ''),
                cover200: cleanText(raw.fullsizeimage || ''),
                trackUrl: trackUrl
              };
            }

            const candidates = [];
            const seen = new Set();
            function pushCandidate(raw) {
              const item = buildItem(raw);
              if (!item || !item.materialNo || seen.has(item.materialNo)) return;
              seen.add(item.materialNo);
              candidates.push(item);
            }

            if (Array.isArray(trackList) && trackList.length > 0) {
              trackList
                .filter(function (x) { return x && x.materialNo && normListenFlg(x) !== 0; })
                .forEach(pushCandidate);
              trackList
                .filter(function (x) { return x && x.materialNo && normListenFlg(x) === 0; })
                .forEach(pushCandidate);
            }
            if (Array.isArray(packageList) && packageList.length > 0) {
              packageList
                .filter(function (x) { return x && x.materialNo; })
                .forEach(pushCandidate);
            }

            if (candidates.length === 0) {
              tryKeyword(idx + 1);
              return;
            }

            function tryCandidate(candidateIdx) {
              if (candidateIdx >= candidates.length) {
                tryKeyword(idx + 1);
                return;
              }
              const item = candidates[candidateIdx];
              fetchMoraListenUrl(item.materialNo, function (listenUrl) {
                const result = {
                  materialNo: item.materialNo,
                  mediaFlg: item.mediaFlg,
                  title: item.title,
                  artist: item.artist,
                  coverUrl: item.cover130 || item.cover200 || '',
                  trackUrl: item.trackUrl,
                  listenUrl: listenUrl,
                  keyword: keyword,
                  searchUrl: searchUrl,
                  fetchedAt: Date.now()
                };
                moraInlineCache.set(key, result);
                onDone(result);
              }, function () {
                tryCandidate(candidateIdx + 1);
              });
            }

            tryCandidate(0);
          } catch (e) {
            // Fallback to legacy HTML parser when API response shape changes.
            GM_xmlhttpRequest({
              method: 'GET',
              url: searchUrl,
              headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                Referer: 'https://mora.jp/search/top'
              },
              onload: function (fallbackResp) {
                try {
                  const doc = new DOMParser().parseFromString(fallbackResp.responseText, 'text/html');
                  const legacyItem = pickFirstMoraSearchMusicItem(doc);
                  if (!legacyItem || !legacyItem.materialNo) {
                    tryKeyword(idx + 1);
                    return;
                  }
                  fetchMoraListenUrl(legacyItem.materialNo, function (listenUrl) {
                    const result = {
                      materialNo: legacyItem.materialNo,
                      mediaFlg: legacyItem.mediaFlg,
                      title: legacyItem.title,
                      artist: legacyItem.artist,
                      coverUrl: legacyItem.cover130 || legacyItem.cover200 || '',
                      trackUrl: legacyItem.trackUrl,
                      listenUrl: listenUrl,
                      keyword: keyword,
                      searchUrl: searchUrl,
                      fetchedAt: Date.now()
                    };
                    moraInlineCache.set(key, result);
                    onDone(result);
                  }, function () {
                    tryKeyword(idx + 1);
                  });
                } catch (e2) {
                  tryKeyword(idx + 1);
                }
              },
              onerror: function () {
                tryKeyword(idx + 1);
              }
            });
          }
        },
        onerror: function () {
          tryKeyword(idx + 1);
        }
      });
    }

    tryKeyword(0);
  }

  function setInlineMoraPlayBtnState(btn, state) {
    if (!btn) return;
    const s = state || 'play';
    const isPauseLike = s === 'pause' || s === 'loading';
    btn.dataset.state = s;
    btn.disabled = s === 'loading';
    btn.title = uiText(s === 'pause' ? 'pausePreview' : 'playPreview');
    btn.style.backgroundImage = `url("${isPauseLike ? MORA_INLINE_PAUSE_ICON : MORA_INLINE_PLAY_ICON}")`;
    btn.style.backgroundRepeat = 'no-repeat';
    btn.style.backgroundPosition = isPauseLike ? 'center center' : 'center top';
    btn.style.backgroundSize = isPauseLike ? 'contain' : '100% 200%';
    btn.style.opacity = s === 'loading' ? '0.85' : '1';
  }

  function ensureInlineMoraAudio() {
    if (inlineMoraAudio) return inlineMoraAudio;

    const audio = document.createElement('audio');
    audio.preload = 'none';
    audio.style.display = 'none';
    audio.volume = 0.5;
    document.body.appendChild(audio);

    audio.addEventListener('ended', function () {
      if (inlineMoraNowPlayingBtn) {
        setInlineMoraPlayBtnState(inlineMoraNowPlayingBtn, 'play');
        inlineMoraNowPlayingBtn.disabled = false;
        inlineMoraNowPlayingBtn = null;
      }
    });
    audio.addEventListener('error', function () {
      if (inlineMoraNowPlayingBtn) {
        setInlineMoraPlayBtnState(inlineMoraNowPlayingBtn, 'play');
        inlineMoraNowPlayingBtn.disabled = false;
        inlineMoraNowPlayingBtn = null;
      }
    });

    inlineMoraAudio = audio;
    return inlineMoraAudio;
  }

  function enqueueInlineMoraTask(task) {
    inlineMoraTaskQueue.push(task);
    runInlineMoraTaskQueue();
  }

  function runInlineMoraTaskQueue() {
    while (inlineMoraTaskRunning < INLINE_MORA_MAX_CONCURRENCY && inlineMoraTaskQueue.length > 0) {
      const task = inlineMoraTaskQueue.shift();
      inlineMoraTaskRunning += 1;
      task(function done() {
        inlineMoraTaskRunning = Math.max(0, inlineMoraTaskRunning - 1);
        runInlineMoraTaskQueue();
      });
    }
  }

  function ensureFreshMoraListenUrl(item, onDone, onFail) {
    if (!item || !item.materialNo) {
      onFail();
      return;
    }

    const cached = moraListenUrlCache.get(item.materialNo);
    if (cached && cached.url && Date.now() - cached.time < 5 * 60 * 1000) {
      onDone(cached.url);
      return;
    }

    fetchMoraListenUrl(item.materialNo, function (url) {
      item.listenUrl = url;
      item.fetchedAt = Date.now();
      onDone(url);
    }, onFail);
  }

  function setInlineMoraStatus(cell, textKey, tone) {
    if (!cell) return;
    cell.innerHTML = '';
    const tip = document.createElement('span');
    tip.className = 'anison-inline-mora-tip';
    setLocalizedText(tip, textKey);
    tip.style.cssText = [
      'display:inline-block',
      'font-size:11px',
      'line-height:14px',
      `color:${tone === 'error' ? '#ff9a9a' : '#b8c0cc'}`,
      'white-space:nowrap',
      'text-align:right',
      'width:100%'
    ].join(';');
    cell.appendChild(tip);
  }

  function stripUiNoise(text) {
    return cleanText(
      (text || '')
        .replace(/コピー済み|コピー|\bCopied\b|\bCopy\b/gi, ' ')
    );
  }

  function createInlineMoraWidget(targetCell, item) {
    const host = document.createElement('div');
    host.className = 'anison-inline-mora';
    host.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:flex-end',
      'gap:6px',
      'width:100%',
      'margin-left:0',
      'vertical-align:middle'
    ].join(';');

    const cover = document.createElement('img');
    cover.src = item.coverUrl;
    cover.alt = item.title || 'mora cover';
    cover.referrerPolicy = 'no-referrer';
    cover.style.cssText = [
      'width:40px',
      'height:40px',
      'object-fit:cover',
      'border:1px solid #555',
      'border-radius:3px',
      'background:#111'
    ].join(';');

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    setLocalizedAttribute(playBtn, 'aria-label', 'moraPreview');
    playBtn.title = item.title ? `Mora: ${item.title}` : uiText('moraPreview');
    playBtn.style.cssText = [
      'width:26px',
      'height:26px',
      'padding:0',
      'border:0',
      'border-radius:3px',
      'background-color:transparent',
      'cursor:pointer',
      'box-shadow:none'
    ].join(';');
    setInlineMoraPlayBtnState(playBtn, 'play');
    applyButtonFeedback(playBtn);

    playBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const audio = ensureInlineMoraAudio();
      const isCurrent = inlineMoraNowPlayingBtn === playBtn && !audio.paused;
      if (isCurrent) {
        audio.pause();
        setInlineMoraPlayBtnState(playBtn, 'play');
        inlineMoraNowPlayingBtn = null;
        return;
      }

      setInlineMoraPlayBtnState(playBtn, 'loading');
      ensureFreshMoraListenUrl(item, function (listenUrl) {
        if (!listenUrl) {
          setInlineMoraPlayBtnState(playBtn, 'play');
          return;
        }

        if (inlineMoraNowPlayingBtn && inlineMoraNowPlayingBtn !== playBtn) {
          setInlineMoraPlayBtnState(inlineMoraNowPlayingBtn, 'play');
        }

        inlineMoraNowPlayingBtn = playBtn;
        audio.src = listenUrl;
        audio.currentTime = 0;
        audio.volume = 0.5;
        const maybePromise = audio.play();
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(function () {
            setInlineMoraPlayBtnState(playBtn, 'pause');
          }).catch(function () {
            setInlineMoraPlayBtnState(playBtn, 'play');
            if (inlineMoraNowPlayingBtn === playBtn) inlineMoraNowPlayingBtn = null;
          });
        } else {
          setInlineMoraPlayBtnState(playBtn, 'pause');
        }
      }, function () {
        setInlineMoraPlayBtnState(playBtn, 'play');
      });
    });

    host.appendChild(playBtn);
    if (item.coverUrl) host.appendChild(cover);
    targetCell.innerHTML = '';
    targetCell.appendChild(host);
  }

  function addInlineMoraToDetailTable(table) {
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      const tds = tr.querySelectorAll('td');
      const songCell = tr.querySelector('td[headers="song"]') || tds[1];
      const vocalCell = tr.querySelector('td[headers="vocal"]') || tds[2];
      const inlineCell = tr.querySelector('td[headers="mora_inline"]') || tds[0];
      if (!songCell || !vocalCell || !inlineCell) return;
      if (inlineCell.querySelector('.anison-inline-mora')) return;
      inlineCell.style.whiteSpace = 'nowrap';
      inlineCell.style.minWidth = '96px';
      inlineCell.style.textAlign = 'right';
      setInlineMoraStatus(inlineCell, 'moraSearching', 'loading');

      const songText = cleanText(songCell.textContent);
      const vocalText = getCellTextByLine(vocalCell, '  ');
      const normalizedSongText = stripUiNoise(songText);
      const normalizedVocalText = stripUiNoise(vocalText);
      if (!normalizedSongText) return;

      enqueueInlineMoraTask(function (done) {
        fetchMoraInlineItem(normalizedSongText, normalizedVocalText, function (item) {
          if (item) {
            createInlineMoraWidget(inlineCell, item);
          } else {
            setInlineMoraStatus(inlineCell, 'moraNotFound', 'error');
          }
          done();
        }, function () {
          setInlineMoraStatus(inlineCell, 'moraNotFound', 'error');
          done();
        });
      });
    });
  }

  function toRealAnisonUrl(href) {
    const raw = (href || '').trim();
    const m = raw.match(/javascript:link\('([^']+)','([^']+)'\)/);
    if (m) return `http://anison.info/data/${m[1]}/${m[2]}.html`;
    if (/^https?:\/\//i.test(raw)) return raw;
    return new URL(raw, 'http://anison.info/data/').href;
  }

  function stripSeasonSuffix(text) {
    return cleanText(
      (text || '')
        .replace(/\s*第\s*[0-9０-９IVXLCMivxlcm]+\s*(期|クール)\s*$/u, '')
        .replace(/\s*第\s*[0-9０-９IVXLCMivxlcm]+\s*話\s*$/u, '')
        .replace(/\s*(season|s)\s*[0-9０-９]+\s*$/iu, '')
        .replace(/\s*cour\s*[0-9０-９]+\s*$/iu, '')
        .replace(/\s*(part|pt)\s*[0-9０-９]+\s*$/iu, '')
    );
  }

  function buildCjkPrefixCandidates(text) {
    const compact = cleanText(text).replace(/\s+/g, '');
    if (!compact) return [];
    const looksLikeCjk = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(compact);
    if (!looksLikeCjk || compact.length < 8) return [];
    return [8, 6, 4]
      .filter(function (n) { return compact.length > n; })
      .map(function (n) { return compact.slice(0, n); });
  }

  function getFirstBySpace(text) {
    const s = cleanText(text);
    if (!s) return '';
    const parts = s.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts[0] : s;
  }

  function getFirstByPunctuation(text) {
    const s = cleanText(text);
    if (!s) return '';

    // Protect patterns like "Re:ゼロ" from being split into just "Re".
    const protectedS = s
      .replace(/^Re:/i, '__RE_COLON__')
      .replace(/^No\./i, '__NO_DOT__');

    const first = cleanText(
      (protectedS.split(/[~～\-—|／/・,，、:：]+/u).find(Boolean) || '')
        .replace('__RE_COLON__', 'Re:')
        .replace('__NO_DOT__', 'No.')
    );
    return first || s;
  }

  function isTooGenericQuery(q) {
    const s = cleanText(q);
    if (!s) return true;
    if (Array.from(s).length <= 1) return true;
    // Avoid highly generic fallbacks such as "Re"
    if (/^[A-Za-z]+$/.test(s) && s.length <= 3) return true;
    return false;
  }

  function buildAnisonQueryCandidates(title) {
    const src = cleanText(title || '');
    const nfk = cleanText(src.normalize('NFKC'));
    const nfkNoSeason = stripSeasonSuffix(nfk);
    const firstBySpace = getFirstBySpace(nfkNoSeason);
    const firstByPunc = getFirstByPunctuation(firstBySpace);
    const symbolToSpace = cleanText(nfk.replace(/[^\p{L}\p{N}\s]/gu, ' '));
    const noSpace = cleanText(symbolToSpace.replace(/\s+/g, ''));
    const noBracket = cleanText(firstBySpace.replace(/[【】\[\]\(\)（）『』「」]/g, ''));
    const bracketCore = cleanText(((nfk.match(/[【\[\(（『「]\s*([^】\]\)）』」]+?)\s*[】\]\)）』」]/u) || [])[1] || ''));
    const bracketWrapped = bracketCore ? `【${bracketCore}】` : '';
    const noBracketNoSeason = stripSeasonSuffix(noBracket);
    const bracketCoreNoSeason = stripSeasonSuffix(bracketCore);
    const firstSegment = cleanText(
      firstByPunc
        .split(/[~～\-—|／/・,，、\s【】\[\]\(\)（）『』「」]+/u)
        .find(Boolean) || ''
    );
    const firstSegmentNoSuffix = cleanText(firstSegment.replace(/(?:\d+|[IVXLCM]+)$/iu, ''));
    const cjkPrefixes = buildCjkPrefixCandidates(noBracketNoSeason || nfkNoSeason || nfk);

    const candidates = [
      src,
      nfk,
      nfkNoSeason,
      firstBySpace,
      firstByPunc,
      bracketWrapped,
      bracketCore,
      bracketCoreNoSeason,
      noBracket,
      noBracketNoSeason,
      symbolToSpace,
      noSpace,
      firstSegment,
      firstSegmentNoSuffix,
      ...cjkPrefixes
    ]
      .map(cleanText)
      .filter(function (q) { return q && !isTooGenericQuery(q); });

    return Array.from(new Set(candidates));
  }

  function normalizeForMatch(text) {
    return cleanText((text || '').normalize('NFKC'))
      .replace(/[^\p{L}\p{N}]/gu, '')
      .toLowerCase();
  }

  function buildMatchKeys(title) {
    return Array.from(new Set(
      buildAnisonQueryCandidates(title)
        .map(normalizeForMatch)
        .filter(function (k) {
          if (!k) return false;
          const hasCjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(k);
          return hasCjk ? k.length >= 3 : k.length >= 5;
        })
    ));
  }

  function isAnisonResultRelevant(srcTable, title) {
    const keys = buildMatchKeys(title);
    if (keys.length === 0) return true;

    const rows = Array.from(srcTable.querySelectorAll('tbody tr td[headers="program"]'))
      .slice(0, 20)
      .map(function (td) { return normalizeForMatch(td.textContent || ''); })
      .filter(Boolean);
    if (rows.length === 0) return false;

    return rows.some(function (rowText) {
      return keys.some(function (k) {
        return rowText.includes(k) || k.includes(rowText);
      });
    });
  }

  function fetchAnisonTableWithFallback(title, onDone, onFail) {
    const candidates = buildAnisonQueryCandidates(title);
    let idx = 0;

    function nextTry() {
      if (idx >= candidates.length) {
        onFail();
        return;
      }

      const q = candidates[idx++];
      const url = `http://anison.info/data/n.php?q=${encodeURIComponent(q)}&m=pro`;
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function (resp) {
          try {
            const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
            const srcTable = doc.querySelector('table.sorted');
            const rowCount = srcTable ? srcTable.querySelectorAll('tbody tr').length : 0;
            if (srcTable && rowCount > 0 && isAnisonResultRelevant(srcTable, title)) {
              onDone(srcTable, q);
              return;
            }
            nextTry();
          } catch (e) {
            nextTry();
          }
        },
        onerror: function () {
          nextTry();
        }
      });
    }

    nextTry();
  }

  function copyText(text) {
    const value = normalizeCopyText(text);
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(function () {});
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function attachCopyButton(cell, textGetter) {
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.minWidth = '0';

    while (cell.firstChild) {
      content.appendChild(cell.firstChild);
    }

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'anison-copy-btn';
    setLocalizedText(copyBtn, 'copy');
    copyBtn.style.cssText = [
      'margin-left:8px',
      'padding:1px 6px',
      'font-size:12px',
      'line-height:16px',
      'border:1px solid #555',
      'border-radius:3px',
      'background:#1e1e1e',
      'color:#fff',
      'cursor:pointer',
      'flex:0 0 auto'
    ].join(';');
    copyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      copyText(textGetter());
      flashButtonText(copyBtn, uiText('copied'), 800);
    });
    applyButtonFeedback(copyBtn);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';
    row.style.justifyContent = 'space-between';
    row.style.gap = '6px';
    row.appendChild(content);
    row.appendChild(copyBtn);
    cell.appendChild(row);
  }

  function addCopyButtonsToDetailTable(table) {
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      const tds = tr.querySelectorAll('td');
      const songCell = tr.querySelector('td[headers="song"]') || tds[1];
      const vocalCell = tr.querySelector('td[headers="vocal"]') || tds[2];
      if (!songCell || !vocalCell) return;
      const songText = cleanText(songCell.textContent);
      const vocalText = getCellTextByLine(vocalCell, '  ');

      attachCopyButton(songCell, function () {
        return songText;
      });

      attachCopyButton(vocalCell, function () {
        return `${songText} ${vocalText}`;
      });
    });
  }

  function pickBestMoraItem(doc, songText, vocalText) {
    const items = Array.from(doc.querySelectorAll('article.search_musicWrapper'));
    if (items.length === 0) return null;

    const normalizedSong = cleanText(songText).toLowerCase();
    const normalizedVocal = cleanText(vocalText).toLowerCase();
    let best = null;

    items.forEach(function (item) {
      const title = cleanText(item.querySelector('p') ? item.querySelector('p').textContent : '');
      const artist = cleanText(item.querySelector('.search_musicArtist') ? item.querySelector('.search_musicArtist').textContent : '');
      const linkNode =
        item.querySelector('a[href*="/package/"][href*="trackMaterialNo="]') ||
        item.querySelector('a[href*="/package/"]');
      if (!linkNode) return;

      const titleLc = title.toLowerCase();
      const artistLc = artist.toLowerCase();
      let score = 0;
      if (titleLc === normalizedSong) score += 5;
      else if (titleLc.includes(normalizedSong) || normalizedSong.includes(titleLc)) score += 3;
      if (normalizedVocal && (artistLc.includes(normalizedVocal) || normalizedVocal.includes(artistLc))) score += 3;

      const candidate = { title: title, artist: artist, url: linkNode.href, score: score };
      if (!best || candidate.score > best.score) best = candidate;
    });

    return best;
  }

  function fetchMoraBestMatch(songText, vocalText, onDone, onFail) {
    const key = `${songText}||${vocalText}`;
    if (moraCache.has(key)) {
      onDone(moraCache.get(key));
      return;
    }

    const searchUrl = `https://mora.jp/search/top?keyWord=${encodeURIComponent(`${songText} ${vocalText}`)}`;
    GM_xmlhttpRequest({
      method: 'GET',
      url: searchUrl,
      onload: function (resp) {
        try {
          const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
          const best = pickBestMoraItem(doc, songText, vocalText);
          const result = best && best.url ? best : { url: searchUrl, title: songText, artist: vocalText, score: -1 };
          moraCache.set(key, result);
          onDone(result);
        } catch (e) {
          onFail(searchUrl);
        }
      },
      onerror: function () {
        onFail(searchUrl);
      }
    });
  }

  function resolvePreviewTarget(provider, songText, vocalText, onDone, onFail) {
    const providerVocal = getProviderVocalKeyword(provider, vocalText);
    const keyword = buildKeyword(songText, providerVocal);
    if (provider === 'youtube') {
      onDone({
        provider: provider,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`,
        keyword: keyword
      });
      return;
    }
    if (provider === 'mora') {
      fetchMoraBestMatch(songText, providerVocal, function (result) {
        onDone({
          provider: provider,
          url: result.url,
          keyword: keyword
        });
      }, function () {
        onFail({
          provider: provider,
          url: `https://mora.jp/search/top?keyWord=${encodeURIComponent(keyword)}`,
          keyword: keyword
        });
      });
      return;
    }
    onFail({
      provider: provider,
      url: '',
      keyword: keyword
    });
  }

  function handlePreviewAction(provider, songText, vocalText, triggerBtn) {
    const isMora = provider === 'mora';
    if (isMora) {
      setLocalizedText(triggerBtn, 'searching');
      triggerBtn.disabled = true;
    }

    function restoreBtn() {
      if (!isMora) return;
      clearLocalizedText(triggerBtn);
      triggerBtn.textContent = 'Mora';
      triggerBtn.disabled = false;
    }

    function openByMode(target) {
      const mode = getPreviewMode();
      if (mode === PREVIEW_MODES.NEWTAB) {
        if (target.url) window.open(target.url, '_blank');
        flashButtonText(triggerBtn, uiText('opened'), 700);
      } else {
        if (target.url) openInReusableWindow(target.url);
        flashButtonText(triggerBtn, uiText('opened'), 700);
      }
    }

    resolvePreviewTarget(provider, songText, vocalText, function (target) {
      restoreBtn();
      openByMode(target);
    }, function (fallbackTarget) {
      restoreBtn();
      openByMode(fallbackTarget);
    });
  }

  function addPreviewModeToggleToDetailTable(table) {
    const actionTh = table.querySelector('th#actions');
    if (!actionTh) return;
    if (actionTh.querySelector('.anison-preview-mode-toggle')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'anison-preview-mode-toggle';
    toggleBtn.style.cssText = [
      'margin-left:6px',
      'padding:0 5px',
      'font-size:11px',
      'line-height:14px',
      'border:1px solid #555',
      'border-radius:3px',
      'background:#1e1e1e',
      'color:#fff',
      'cursor:pointer',
      'vertical-align:middle'
    ].join(';');
    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const next = previewMode === PREVIEW_MODES.WINDOW ? PREVIEW_MODES.NEWTAB : PREVIEW_MODES.WINDOW;
      setPreviewMode(next);
      flashButtonText(toggleBtn, uiText(next === PREVIEW_MODES.WINDOW ? 'previewWindow' : 'previewNewTab'), 650);
    });
    applyButtonFeedback(toggleBtn);
    actionTh.appendChild(toggleBtn);
    refreshPreviewModeToggles();
  }

  function addPreviewButtonsToDetailTable(table) {
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      const tds = tr.querySelectorAll('td');
      const songCell = tr.querySelector('td[headers="song"]') || tds[1];
      const vocalCell = tr.querySelector('td[headers="vocal"]') || tds[2];
      const actionCell = tr.querySelector('td[headers="actions"]') || tds[3];
      if (!songCell || !vocalCell || !actionCell) return;

      const songText = cleanText(songCell.textContent);
      const vocalText = getCellTextByLine(vocalCell, '  ');
      if (!songText) return;

      const actionWrap = document.createElement('div');
      actionWrap.className = 'anison-preview-actions';
      actionWrap.style.cssText = [
        'display:flex',
        'gap:6px',
        'align-items:center',
        'flex-wrap:nowrap',
        'min-width:112px'
      ].join(';');

      [
        { provider: 'mora', label: 'Mora' },
        { provider: 'youtube', label: 'YouTube' }
      ].forEach(function (item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.label;
        button.style.cssText = [
          'padding:1px 6px',
          'font-size:12px',
          'line-height:16px',
          'border:1px solid #555',
          'border-radius:3px',
          'background:#1e1e1e',
          'color:#fff',
          'cursor:pointer'
        ].join(';');
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          handlePreviewAction(item.provider, songText, vocalText, button);
        });
        applyButtonFeedback(button);
        actionWrap.appendChild(button);
      });

      actionCell.appendChild(actionWrap);
    });
  }

  function normalizeLinks(root) {
    root.querySelectorAll('a[href]').forEach(function (a) {
      const realUrl = toRealAnisonUrl(a.getAttribute('href') || '');
      a.href = realUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  function applyTableStyle(table) {
    const bgColor = '#2b2d31';
    const borderColor = '#3a3d42';
    table.style.margin = '0 auto';
    table.style.width = 'auto';
    table.style.maxWidth = '100%';
    table.style.background = bgColor;
    table.style.color = '#fff';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '13px';
    table.querySelectorAll('th,td').forEach(function (cell) {
      cell.style.background = bgColor;
      cell.style.color = '#fff';
      cell.style.border = `1px solid ${borderColor}`;
      cell.style.padding = '4px 8px';
      cell.style.lineHeight = '1.5';
      cell.style.verticalAlign = 'top';
    });
    table.querySelectorAll('a').forEach(function (link) {
      link.style.color = '#fff';
      link.style.textDecoration = 'none';
      link.addEventListener('mouseenter', function () {
        link.style.color = '#8fc7ff';
      });
      link.addEventListener('mouseleave', function () {
        link.style.color = '#fff';
      });
    });
  }

  function addDetailButtons(mainTable, detailArea) {
    const programTh = mainTable.querySelector('th#program') || mainTable.querySelector('thead tr th');
    if (programTh && !programTh.querySelector('.anison-auto-mora-toggle')) {
      const autoBtn = document.createElement('button');
      autoBtn.type = 'button';
      autoBtn.className = 'anison-auto-mora-toggle';
      autoBtn.style.cssText = [
        'margin-left:8px',
        'padding:0 6px',
        'font-size:11px',
        'line-height:16px',
        'border:1px solid #555',
        'border-radius:3px',
        'background:#1e1e1e',
        'color:#fff',
        'cursor:pointer',
        'vertical-align:middle'
      ].join(';');
      autoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setAutoMoraInlineEnabled(!autoMoraInlineEnabled);
        flashButtonText(autoBtn, uiText(autoMoraInlineEnabled ? 'autoMoraOn' : 'autoMoraOff'), 650);
      });
      applyButtonFeedback(autoBtn);
      programTh.appendChild(autoBtn);
      refreshAutoMoraInlineToggles();
    }

    const links = mainTable.querySelectorAll('a[href*="/data/program/"]');
    links.forEach(function (a) {
      const row = a.closest('tr');
      const rightCell = row ? row.querySelector('td[headers="program"]') : null;
      const programTitle = cleanText(a.textContent || (rightCell ? rightCell.textContent : ''));
      const detailBtn = document.createElement('button');
      detailBtn.type = 'button';
      detailBtn.className = 'anison-detail-btn';
      setLocalizedText(detailBtn, 'tracks');
      detailBtn.style.cssText = [
        'margin-left:8px',
        'padding:1px 6px',
        'font-size:12px',
        'line-height:16px',
        'border:1px solid #555',
        'border-radius:3px',
        'background:#1e1e1e',
        'color:#fff',
        'cursor:pointer',
        'float:right'
      ].join(';');

      detailBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        flashButtonText(detailBtn, uiText('loadingShort'), 600);
        loadDetailTable(a.href, detailArea);
      });
      applyButtonFeedback(detailBtn);

      if (rightCell) {
        rightCell.appendChild(detailBtn);
      } else {
        a.insertAdjacentElement('afterend', detailBtn);
      }
    });
  }

  function buildDetailTable(srcTable) {
    const useAutoMoraInline = autoMoraInlineEnabled;
    const wanted = useAutoMoraInline
      ? ['mora_inline', 'oped', 'song', 'vocal', 'actions']
      : ['oped', 'song', 'vocal', 'actions'];
    const theadRow = srcTable.querySelector('thead tr');
    const rows = srcTable.querySelectorAll('tbody tr');
    if (!theadRow || rows.length === 0) return null;

    const table = document.createElement('table');
    table.className = 'anison-detail-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    wanted.forEach(function (id) {
      const sourceHeader = (id === 'actions' || id === 'mora_inline')
        ? null
        : theadRow.querySelector(`th#${id}`);
      const header = document.createElement('th');
      header.id = id;
      if (id === 'mora_inline') {
        header.textContent = '';
        header.style.width = '86px';
        header.style.minWidth = '86px';
      } else if (id === 'actions') {
        const label = document.createElement('span');
        setLocalizedText(label, 'actionsHeader');
        header.appendChild(label);
      } else {
        header.textContent = sourceHeader ? sourceHeader.textContent.trim() : id;
      }
      headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(function (sourceRow) {
      const row = document.createElement('tr');
      wanted.forEach(function (id) {
        const sourceCell = (id === 'actions' || id === 'mora_inline')
          ? null
          : sourceRow.querySelector(`td[headers="${id}"]`);
        const cell = document.createElement('td');
        cell.setAttribute('headers', id);
        if (id === 'mora_inline') {
          cell.style.minWidth = '86px';
          cell.style.whiteSpace = 'nowrap';
        }
        if (sourceCell) cell.innerHTML = sourceCell.innerHTML;
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    addPreviewButtonsToDetailTable(table);
    addPreviewModeToggleToDetailTable(table);
    if (useAutoMoraInline) addInlineMoraToDetailTable(table);
    addCopyButtonsToDetailTable(table);
    normalizeLinks(table);
    applyTableStyle(table);
    return table;
  }

  function loadDetailTable(programUrl, detailArea) {
    setLocalizedText(detailArea, 'loadingTracks');
    GM_xmlhttpRequest({
      method: 'GET',
      url: programUrl,
      onload: function (resp) {
        try {
          const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
          const srcTable = doc.querySelector('table.sorted');
          if (!srcTable) {
            setLocalizedText(detailArea, 'detailTableNotFound');
            return;
          }

          const detailTable = buildDetailTable(srcTable);
          if (!detailTable) {
            setLocalizedText(detailArea, 'detailTableParseFailed');
            return;
          }

          clearLocalizedText(detailArea);
          detailArea.innerHTML = '';
          detailArea.appendChild(detailTable);
        } catch (err) {
          setLocalizedText(detailArea, 'detailParseFailed');
        }
      },
      onerror: function () {
        setLocalizedText(detailArea, 'detailLoadFailed');
      }
    });
  }

  function setResultPanelSearching(panelParts, searching) {
    if (!panelParts || !panelParts.searchBtn) return;
    panelParts.searchBtn.disabled = !!searching;
    panelParts.searchBtn.textContent = searching ? '...' : '⌕';
  }

  function renderAnisonForTitle(title, mainArea, detailArea, onSuccess, panelParts, onFailure) {
    const query = cleanText(title);
    let searchToken = null;
    if (panelParts) {
      panelParts.searchToken = (panelParts.searchToken || 0) + 1;
      searchToken = panelParts.searchToken;
    }
    function isCurrentSearch() {
      return !panelParts || panelParts.searchToken === searchToken;
    }

    if (!query) {
      setLocalizedText(mainArea, 'enterSearchKeyword');
      clearLocalizedText(detailArea);
      detailArea.innerHTML = '';
      setResultPanelSearching(panelParts, false);
      return;
    }

    if (panelParts && panelParts.searchInput) {
      panelParts.searchInput.value = query;
    }
    setResultPanelSearching(panelParts, true);
    setLocalizedText(mainArea, 'loading');
    clearLocalizedText(detailArea);
    detailArea.innerHTML = '';

    fetchAnisonTableWithFallback(query, function (srcTable, usedQuery) {
      if (!isCurrentSearch()) return;
      try {
        const table = srcTable.cloneNode(true);
        normalizeLinks(table);
        applyTableStyle(table);
        addDetailButtons(table, detailArea);

        clearLocalizedText(mainArea);
        mainArea.innerHTML = '';
        mainArea.appendChild(table);
        if (panelParts && panelParts.searchInput && usedQuery) {
          panelParts.searchInput.value = usedQuery;
        }
        setResultPanelSearching(panelParts, false);
        if (onSuccess) onSuccess();
      } catch (err) {
        if (!isCurrentSearch()) return;
        setResultPanelSearching(panelParts, false);
        setLocalizedText(mainArea, 'parseFailed');
      }
    }, function () {
      if (!isCurrentSearch()) return;
      if (onFailure) {
        onFailure();
        return;
      }
      setResultPanelSearching(panelParts, false);
      setLocalizedText(mainArea, 'noTableData');
    });
  }

  function performPanelSearch(panelParts, title, onSuccess, onFailure) {
    const query = cleanText(title);
    if (!panelParts || !panelParts.mainArea || !panelParts.detailArea) return;
    if (panelParts.panel) panelParts.panel.style.display = 'block';
    renderAnisonForTitle(query, panelParts.mainArea, panelParts.detailArea, onSuccess, panelParts, onFailure);
  }

  function createResultPanel(anchor, mode) {
    const panel = document.createElement('div');
    panel.className = mode === 'header' ? 'anison-result-panel anime-list-mode' : 'anison-result-panel';
    panel.style.cssText = [
      'margin:8px auto 0',
      'padding:6px',
      'color:#fff',
      'display:none',
      'overflow-x:auto',
      'max-width:95%'
    ].join(';');

    const searchForm = document.createElement('form');
    searchForm.className = 'anison-search-form';
    searchForm.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'margin:0 auto 8px',
      'max-width:736px'
    ].join(';');

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'anison-query-input';
    setLocalizedAttribute(searchInput, 'placeholder', 'searchPlaceholder');
    setLocalizedAttribute(searchInput, 'title', 'searchHint');
    searchInput.style.cssText = [
      'flex:1 1 auto',
      'min-width:0',
      'padding:4px 8px',
      'font-size:13px',
      'line-height:18px',
      'border:1px solid #555',
      'border-radius:3px',
      'background:#1e1e1e',
      'color:#fff',
      'outline:none'
    ].join(';');

    const searchBtn = document.createElement('button');
    searchBtn.type = 'submit';
    searchBtn.className = 'anison-search-btn';
    searchBtn.textContent = '⌕';
    setLocalizedAttribute(searchBtn, 'aria-label', 'search');
    setLocalizedAttribute(searchBtn, 'title', 'search');
    searchBtn.style.cssText = [
      'flex:0 0 28px',
      'width:28px',
      'height:28px',
      'padding:0',
      'font-size:17px',
      'line-height:26px',
      'border:1px solid #555',
      'border-radius:3px',
      'background:#1e1e1e',
      'color:#fff',
      'cursor:pointer'
    ].join(';');
    applyButtonFeedback(searchBtn);

    const languageSelect = document.createElement('select');
    languageSelect.className = 'anison-language-select';
    setLocalizedAttribute(languageSelect, 'aria-label', 'language');
    setLocalizedAttribute(languageSelect, 'title', 'languageHint');
    [
      { value: 'ja', label: '日本語' },
      { value: 'en', label: 'English' }
    ].forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      languageSelect.appendChild(option);
    });
    languageSelect.value = uiLanguage;
    languageSelect.style.cssText = [
      'flex:0 0 84px',
      'width:84px',
      'height:28px',
      'padding:0 5px',
      'font-size:11px',
      'line-height:26px',
      'border:1px solid #4a4d52',
      'border-radius:3px',
      'background:#24262a',
      'color:#cfd4dc',
      'cursor:pointer',
      'opacity:.86'
    ].join(';');
    languageSelect.addEventListener('change', function () {
      setUiLanguage(languageSelect.value);
    });

    const mainArea = document.createElement('div');
    mainArea.className = 'anison-main-area';
    const detailArea = document.createElement('div');
    detailArea.className = 'anison-detail-area';
    detailArea.style.marginTop = '10px';
    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchBtn);
    searchForm.appendChild(languageSelect);
    panel.appendChild(searchForm);
    panel.appendChild(mainArea);
    panel.appendChild(detailArea);

    const panelParts = {
      panel: panel,
      searchForm: searchForm,
      searchInput: searchInput,
      searchBtn: searchBtn,
      languageSelect: languageSelect,
      mainArea: mainArea,
      detailArea: detailArea
    };

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      performPanelSearch(panelParts, searchInput.value);
    });

    if (mode === 'header') {
      anchor.appendChild(panel);
    } else {
      anchor.insertAdjacentElement('afterend', panel);
    }

    return panelParts;
  }

  function getResultPanelParts(panel) {
    if (!panel) return null;
    return {
      panel: panel,
      searchForm: panel.querySelector('.anison-search-form'),
      searchInput: panel.querySelector('.anison-query-input'),
      searchBtn: panel.querySelector('.anison-search-btn'),
      languageSelect: panel.querySelector('.anison-language-select'),
      mainArea: panel.querySelector('.anison-main-area'),
      detailArea: panel.querySelector('.anison-detail-area')
    };
  }

  function setupSubjectOrWorkPage() {
    const titleWrap = document.querySelector('h1.nameSingle, h1.fw-bold.h2.mt-1');
    if (!titleWrap) return false;
    if (titleWrap.querySelector('.anison-jump-btn')) return true;

    const titleLink = titleWrap.querySelector('a[property="v:itemreviewed"]') || titleWrap.querySelector('a');
    if (!titleLink) return false;

    const titleText = cleanText(titleLink.textContent || '');
    if (!titleText) return false;

    titleWrap.style.display = 'flex';
    titleWrap.style.alignItems = 'center';
    titleWrap.style.gap = '8px';

    const spacer = document.createElement('span');
    spacer.style.flex = '1';

    const btn = document.createElement('a');
    btn.className = 'anison-jump-btn';
    btn.textContent = 'Anison';
    btn.href = '#';
    btn.style.cssText = [
      'display:inline-block',
      'padding:2px 8px',
      'font-size:12px',
      'line-height:18px',
      'border:1px solid #aaa',
      'border-radius:4px',
      'text-decoration:none',
      'color:#333',
      'background:#f5f5f5'
    ].join(';');
    btn.addEventListener('mouseenter', function () {
      btn.style.background = '#ececec';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.background = '#f5f5f5';
    });
    applyButtonFeedback(btn);

    titleWrap.appendChild(spacer);
    titleWrap.appendChild(btn);

    const panelParts = createResultPanel(titleWrap, 'after');
    let loaded = false;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      flashButtonText(btn, uiText(panelParts.panel.style.display === 'none' ? 'opening' : 'working'), 450);

      if (loaded) {
        panelParts.panel.style.display = panelParts.panel.style.display === 'none' ? 'block' : 'none';
        return;
      }

      performPanelSearch(panelParts, titleText, function () {
        loaded = true;
      });
    });

    return true;
  }

  function setupBangumiAnimeListPage() {
    const isAnimeList = location.hostname.indexOf('bangumi.tv') !== -1 && /^\/anime(?:\/|$)/.test(location.pathname);
    if (!isAnimeList) return false;

    const isUserAnimeListPage = /^\/anime\/list\/[^\/]+\/[^\/]+\/?$/.test(location.pathname);
    let panelAnchor = null;
    let panelMode = 'after';

    if (isUserAnimeListPage) {
      const wrapperNeue = document.querySelector('#wrapperNeue');
      const headerProfile = wrapperNeue ? wrapperNeue.querySelector('#headerProfile') : null;
      const headerNeue2 = wrapperNeue ? wrapperNeue.querySelector('#headerNeue2') : null;
      if (headerProfile) {
        panelAnchor = headerProfile;
        panelMode = 'after';
      } else if (headerNeue2) {
        panelAnchor = headerNeue2;
        panelMode = 'after';
      }
    }

    const header = document.querySelector('div#header');
    const browserTools = document.querySelector('#browserTools');
    const browserColumn = document.querySelector('#columnSubjectBrowserA');
    if (!panelAnchor) {
      panelAnchor = header || browserTools || browserColumn;
      panelMode = header ? 'header' : 'after';
    }
    if (!panelAnchor) return false;

    let panel = document.querySelector('.anison-result-panel.anime-list-mode');
    let panelParts;
    let mainArea;
    let detailArea;
    if (panel) {
      // Reposition existing panel when route/layout changes.
      if (panelMode === 'after' && panel.previousElementSibling !== panelAnchor) {
        panelAnchor.insertAdjacentElement('afterend', panel);
      } else if (panelMode === 'header' && panel.parentElement !== panelAnchor) {
        panelAnchor.appendChild(panel);
      }
      panelParts = getResultPanelParts(panel);
      mainArea = panelParts ? panelParts.mainArea : null;
      detailArea = panelParts ? panelParts.detailArea : null;
    } else {
      panelParts = createResultPanel(panelAnchor, panelMode);
      panel = panelParts.panel;
      panel.classList.add('anime-list-mode');
      mainArea = panelParts.mainArea;
      detailArea = panelParts.detailArea;
    }

    const items = document.querySelectorAll('li.item h3');
    items.forEach(function (h3) {
      if (h3.querySelector('.anison-item-btn')) return;

      const jpTitle = cleanText((h3.querySelector('small.grey') || {}).textContent || '');
      const mainTitle = cleanText((h3.querySelector('a.l') || h3.querySelector('a') || {}).textContent || '');
      const queryTitle = jpTitle || mainTitle;
      if (!queryTitle) return;

      const itemBtn = document.createElement('a');
      itemBtn.href = '#';
      itemBtn.className = 'anison-item-btn';
      itemBtn.textContent = 'A';
      itemBtn.style.cssText = [
        'display:inline-block',
        'margin:0 4px 0 0',
        'padding:0 4px',
        'font-size:11px',
        'line-height:14px',
        'border:1px solid #555',
        'border-radius:3px',
        'text-decoration:none',
        'background:#1e1e1e',
        'color:#fff',
        'cursor:pointer',
        'vertical-align:middle'
      ].join(';');
      applyButtonFeedback(itemBtn);

      itemBtn.addEventListener('click', function (e) {
        e.preventDefault();
        flashButtonText(itemBtn, uiText('loadingShort'), 550);
        performPanelSearch(panelParts, queryTitle);
      });

      const firstAnchor = h3.querySelector('a.l') || h3.querySelector('a');
      if (firstAnchor) {
        h3.insertBefore(itemBtn, firstAnchor);
      } else {
        h3.appendChild(itemBtn);
      }
    });

    return true;
  }

  function setupAnnictWorksListPage() {
    const isAnnict = location.hostname.indexOf('annict.com') !== -1;
    const path = location.pathname;
    const isWorksListPath = /^\/works(?:\/[^\/]+)?\/?$/.test(path) && !/^\/works\/\d+\/?$/.test(path);
    if (!isAnnict || !isWorksListPath) return false;

    const panelAnchor =
      document.querySelector('div.l-default__content .container > div.align-items-center.justify-content-between.row') ||
      document.querySelector('div.l-default__content div.align-items-center.justify-content-between.row') ||
      document.querySelector('body > div > div.l-default__main.d-flex.flex-column > div.l-default__content > div:nth-child(5) > div') ||
      document.querySelector('body > div > div.l-default__main.d-flex.flex-column > div.l-default__content > div:nth-child(5)');
    if (!panelAnchor) return false;

    let panel = document.querySelector('.anison-result-panel.annict-list-mode');
    let panelParts;
    let mainArea;
    let detailArea;
    if (panel) {
      panelParts = getResultPanelParts(panel);
      mainArea = panelParts ? panelParts.mainArea : null;
      detailArea = panelParts ? panelParts.detailArea : null;
    } else {
      panelParts = createResultPanel(panelAnchor, 'after');
      panel = panelParts.panel;
      panel.classList.add('annict-list-mode');
      mainArea = panelParts.mainArea;
      detailArea = panelParts.detailArea;
    }

    const titleAnchors = Array.from(document.querySelectorAll('a.text-body[href^="/works/"]')).filter(function (a) {
      const href = a.getAttribute('href') || '';
      if (!/^\/works\/\d+/.test(href)) return false;
      if (a.querySelector('.c-work-card__work-title')) return true;
      if (a.getAttribute('title')) return true;
      return cleanText(a.textContent || '').length > 0;
    });

    titleAnchors.forEach(function (anchor) {
      if (anchor.parentElement && anchor.parentElement.querySelector(':scope > .anison-item-btn-annict')) return;

      const titleNode = anchor.querySelector('.c-work-card__work-title');
      const queryTitle = cleanText(
        anchor.getAttribute('title') ||
        (titleNode ? titleNode.getAttribute('title') : '') ||
        (titleNode ? titleNode.textContent : '') ||
        anchor.textContent ||
        ''
      );
      if (!queryTitle) return;

      const itemBtn = document.createElement('a');
      itemBtn.href = '#';
      itemBtn.className = 'anison-item-btn-annict';
      itemBtn.textContent = 'A';
      itemBtn.style.cssText = [
        'display:inline-block',
        'margin:0 3px 0 0',
        'padding:0 4px',
        'font-size:11px',
        'line-height:14px',
        'border:1px solid #555',
        'border-radius:3px',
        'text-decoration:none',
        'background:#1e1e1e',
        'color:#fff',
        'cursor:pointer',
        'vertical-align:middle',
        'flex:0 0 auto'
      ].join(';');
      applyButtonFeedback(itemBtn);

      itemBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        flashButtonText(itemBtn, uiText('loadingShort'), 550);
        performPanelSearch(panelParts, queryTitle);
      });

      if (anchor.parentNode) {
        anchor.parentNode.insertBefore(itemBtn, anchor);

        const titleRow = anchor.parentElement;
        if (titleRow && !titleRow.classList.contains('anison-annict-title-row')) {
          titleRow.classList.add('anison-annict-title-row');
          titleRow.style.display = 'flex';
          titleRow.style.alignItems = 'flex-start';
          titleRow.style.gap = '3px';
        }
        anchor.style.flex = '1 1 auto';
        anchor.style.minWidth = '0';
      }
    });

    return true;
  }

  function isMyAnimeListHost() {
    const host = location.hostname;
    return host === 'myanimelist.net' || host.endsWith('.myanimelist.net');
  }

  function getMyAnimeListAnimeIdFromHref(href) {
    const match = String(href || '').match(
      /^(?:https?:\/\/(?:www\.)?myanimelist\.net)?\/anime\/(\d+)(?:[\/?#]|$)/i
    );
    return match ? match[1] : '';
  }

  function getMyAnimeListLabeledTitle(doc, label) {
    if (!doc || !doc.querySelectorAll) return '';
    const target = cleanText(label).replace(/:$/, '').toLowerCase();
    const labels = doc.querySelectorAll('.spaceit_pad .dark_text');

    for (const labelNode of labels) {
      const labelText = cleanText(labelNode.textContent || '');
      if (labelText.replace(/:$/, '').toLowerCase() !== target) continue;

      const container = labelNode.closest('.spaceit_pad') || labelNode.parentElement;
      const fullText = cleanText(container ? container.textContent : '');
      if (!fullText) return '';
      if (fullText.startsWith(labelText)) {
        return cleanText(fullText.slice(labelText.length));
      }
      return cleanText(fullText.replace(labelText, ''));
    }

    return '';
  }

  function getMyAnimeListTitleCandidatesFromDocument(doc, fallbackTitle) {
    const japaneseTitle = getMyAnimeListLabeledTitle(doc, 'Japanese');
    const englishTitle = getMyAnimeListLabeledTitle(doc, 'English');
    const primaryNode = doc && doc.querySelector
      ? doc.querySelector('h1.title-name, h1.title-name strong')
      : null;
    const primaryTitle = cleanText(primaryNode ? primaryNode.textContent : '');
    return Array.from(new Set(
      [japaneseTitle, englishTitle, primaryTitle, fallbackTitle]
        .map(cleanText)
        .filter(Boolean)
    ));
  }

  function loadMyAnimeListTitleCandidates(animeId, fallbackTitle, sourceDoc, onDone) {
    const directCandidates = getMyAnimeListTitleCandidatesFromDocument(sourceDoc, fallbackTitle);
    const hasPreferredDirectTitle =
      !!getMyAnimeListLabeledTitle(sourceDoc, 'Japanese') ||
      !!getMyAnimeListLabeledTitle(sourceDoc, 'English');

    if (hasPreferredDirectTitle) {
      myAnimeListTitleCache.set(animeId, directCandidates);
      onDone(directCandidates);
      return;
    }

    if (myAnimeListTitleCache.has(animeId)) {
      const cached = myAnimeListTitleCache.get(animeId) || [];
      onDone(Array.from(new Set(cached.concat(directCandidates))));
      return;
    }

    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://myanimelist.net/anime/${encodeURIComponent(animeId)}`,
      onload: function (resp) {
        let candidates = directCandidates;
        try {
          if (!resp.status || (resp.status >= 200 && resp.status < 400)) {
            const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
            candidates = getMyAnimeListTitleCandidatesFromDocument(doc, fallbackTitle);
          }
        } catch (e) {}
        myAnimeListTitleCache.set(animeId, candidates);
        onDone(candidates);
      },
      onerror: function () {
        onDone(directCandidates);
      }
    });
  }

  function performMyAnimeListPanelSearch(panelParts, candidates, onSuccess) {
    const queries = Array.from(new Set((candidates || []).map(cleanText).filter(Boolean)));
    let index = 0;

    function searchNext() {
      if (index >= queries.length) {
        setResultPanelSearching(panelParts, false);
        setLocalizedText(panelParts.mainArea, 'malTitleUnavailable');
        return;
      }

      const query = queries[index++];
      const hasFallback = index < queries.length;
      performPanelSearch(
        panelParts,
        query,
        onSuccess,
        hasFallback ? searchNext : null
      );
    }

    searchNext();
  }

  function prepareMyAnimeListSearch(panelParts) {
    panelParts.panel.style.display = 'block';
    panelParts.malRequestToken = (panelParts.malRequestToken || 0) + 1;
    setResultPanelSearching(panelParts, true);
    setLocalizedText(panelParts.mainArea, 'malTitleLoading');
    clearLocalizedText(panelParts.detailArea);
    panelParts.detailArea.innerHTML = '';
    return panelParts.malRequestToken;
  }

  function bindMyAnimeListSearchButton(btn, panelParts, sourceDoc, toggleAfterLoad) {
    let loaded = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (toggleAfterLoad && loaded) {
        panelParts.panel.style.display = panelParts.panel.style.display === 'none' ? 'block' : 'none';
        return;
      }

      flashButtonText(btn, uiText('loadingShort'), 550);
      const requestToken = prepareMyAnimeListSearch(panelParts);
      loadMyAnimeListTitleCandidates(
        btn.dataset.malAnimeId,
        btn.dataset.malAnimeTitle,
        sourceDoc,
        function (candidates) {
          if (panelParts.malRequestToken !== requestToken) return;
          performMyAnimeListPanelSearch(panelParts, candidates, function () {
            loaded = true;
          });
        }
      );
    });
  }

  function createMyAnimeListListButton(anchor, panelParts) {
    const animeId = getMyAnimeListAnimeIdFromHref(anchor.getAttribute('href') || '');
    const titleText = cleanText(anchor.textContent || anchor.getAttribute('title') || '');
    if (!animeId || !titleText) return null;

    const btn = document.createElement('a');
    btn.href = '#';
    btn.className = 'anison-item-btn-mal';
    btn.textContent = 'A';
    btn.title = `Anison: ${titleText}`;
    btn.setAttribute('aria-label', `Anison: ${titleText}`);
    btn.dataset.malAnimeId = animeId;
    btn.dataset.malAnimeTitle = titleText;
    btn.style.cssText = [
      'display:inline-block',
      'margin:0 4px 0 0',
      'padding:0 4px',
      'font-size:11px',
      'line-height:14px',
      'border:1px solid #555',
      'border-radius:3px',
      'text-decoration:none',
      'background:#1e1e1e',
      'color:#fff',
      'cursor:pointer',
      'vertical-align:middle',
      'flex:0 0 auto'
    ].join(';');
    applyButtonFeedback(btn);
    bindMyAnimeListSearchButton(btn, panelParts, null, false);
    return btn;
  }

  function createMyAnimeListDetailButton(animeId, titleText, panelParts) {
    const btn = document.createElement('a');
    btn.href = '#';
    btn.className = 'anison-jump-btn anison-mal-detail-btn';
    btn.textContent = 'Anison';
    btn.title = `Anison: ${titleText}`;
    btn.dataset.malAnimeId = animeId;
    btn.dataset.malAnimeTitle = titleText;
    btn.style.cssText = [
      'display:inline-block',
      'padding:2px 8px',
      'font-size:12px',
      'line-height:18px',
      'border:1px solid #aaa',
      'border-radius:4px',
      'text-decoration:none',
      'color:#333',
      'background:#f5f5f5',
      'cursor:pointer',
      'flex:0 0 auto',
      'margin-top:2px'
    ].join(';');
    btn.addEventListener('mouseenter', function () {
      btn.style.background = '#ececec';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.background = '#f5f5f5';
    });
    applyButtonFeedback(btn);
    bindMyAnimeListSearchButton(btn, panelParts, document, true);
    return btn;
  }

  function getMyAnimeListPanelAnchor(detailTitleRow) {
    if (detailTitleRow) return detailTitleRow;
    const wrapper = document.querySelector('#contentWrapper');
    if (wrapper) {
      return (
        wrapper.querySelector(':scope > .h1') ||
        wrapper.querySelector(':scope > div:first-child') ||
        wrapper.querySelector('h1')
      );
    }
    const heading = document.querySelector('h1.title-name, h1');
    return heading ? (heading.parentElement || heading) : null;
  }

  function getMyAnimeListPanelParts(anchor) {
    let panel = document.querySelector('.anison-result-panel.mal-page-mode');
    let panelParts;
    if (panel) {
      if (panel.previousElementSibling !== anchor) {
        anchor.insertAdjacentElement('afterend', panel);
      }
      panelParts = getResultPanelParts(panel);
    } else {
      panelParts = createResultPanel(anchor, 'after');
      panel = panelParts.panel;
      panel.classList.add('mal-page-mode');
      panel.style.background = '#2e3035';
      panel.style.borderRadius = '4px';
    }
    return panelParts;
  }

  function setupMyAnimeListPage() {
    if (!isMyAnimeListHost()) return false;

    let injected = false;
    const detailMatch = location.pathname.match(/^\/anime\/(\d+)(?:\/[^\/]+)?\/?$/);
    const detailTitleRow = detailMatch ? document.querySelector('div.h1.edit-info') : null;
    const panelAnchor = getMyAnimeListPanelAnchor(detailTitleRow);
    if (!panelAnchor) return false;
    const panelParts = getMyAnimeListPanelParts(panelAnchor);

    if (detailMatch) {
      const titleRow = detailTitleRow;
      const titleArea = titleRow ? titleRow.querySelector(':scope > .h1-title') : null;
      const titleNode = titleArea ? titleArea.querySelector('h1.title-name') : null;
      const titleText = cleanText(titleNode ? titleNode.textContent : '');
      if (
        titleRow &&
        titleArea &&
        titleText &&
        !titleRow.querySelector(':scope > .anison-mal-detail-btn')
      ) {
        titleRow.style.display = 'flex';
        titleRow.style.alignItems = 'flex-start';
        titleRow.style.gap = '8px';
        titleArea.style.flex = '1 1 auto';
        titleArea.style.minWidth = '0';

        const btn = createMyAnimeListDetailButton(detailMatch[1], titleText, panelParts);
        const headerRight = titleRow.querySelector(':scope > .header-right');
        titleRow.insertBefore(btn, headerRight || null);
        injected = true;
      }
    }

    const largeTitleAnchors = document.querySelectorAll(
      '.seasonal-anime .title-text h2.h2_anime_title > a.link-title[href*="/anime/"]'
    );
    largeTitleAnchors.forEach(function (anchor) {
      const titleRow = anchor.closest('.title-text');
      const heading = anchor.closest('h2.h2_anime_title');
      if (!titleRow || !heading || titleRow.querySelector(':scope > .anison-item-btn-mal')) return;

      const btn = createMyAnimeListListButton(anchor, panelParts);
      if (!btn) return;
      btn.style.marginTop = '2px';
      titleRow.style.display = 'flex';
      titleRow.style.alignItems = 'flex-start';
      titleRow.style.gap = '3px';
      heading.style.flex = '1 1 auto';
      heading.style.minWidth = '0';
      titleRow.insertBefore(btn, heading);
      injected = true;
    });

    const compactTitleAnchors = document.querySelectorAll(
      'a.hoverinfo_trigger.fw-b[href*="/anime/"]'
    );
    compactTitleAnchors.forEach(function (anchor) {
      const titleCell = anchor.parentElement;
      if (!titleCell || titleCell.querySelector(':scope > .anison-item-btn-mal')) return;

      const btn = createMyAnimeListListButton(anchor, panelParts);
      if (!btn) return;
      titleCell.insertBefore(btn, anchor);
      injected = true;
    });

    return injected;
  }

  function isSupportedEntryPointRoute() {
    const host = location.hostname;
    const path = location.pathname;
    if (host === 'myanimelist.net' || host.endsWith('.myanimelist.net')) {
      return /^\/anime(?:\.php|\/|$)/.test(path);
    }
    if (host === 'annict.com' || host.endsWith('.annict.com')) {
      return /^\/works(?:\/|$)/.test(path);
    }
    if (host === 'bangumi.tv' || host.endsWith('.bangumi.tv')) {
      return /^\/(?:subject|anime)(?:\/|$)/.test(path);
    }
    return false;
  }

  function initAllEntryPoints() {
    if (!isSupportedEntryPointRoute()) return;
    uiLanguage = getUiLanguage();
    previewMode = getPreviewMode();
    autoMoraInlineEnabled = getAutoMoraInlineEnabled();
    setupSubjectOrWorkPage();
    setupBangumiAnimeListPage();
    setupAnnictWorksListPage();
    setupMyAnimeListPage();
    refreshPreviewModeToggles();
    refreshAutoMoraInlineToggles();
  }

  let initTimer = null;
  function scheduleInit() {
    if (initTimer) clearTimeout(initTimer);
    initTimer = setTimeout(function () {
      initAllEntryPoints();
    }, 80);
  }


  initAllEntryPoints();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit, { once: true });
  }

  // Domain-wide @match rules let these listeners survive navigation from pages
  // outside the supported routes. Annict uses Turbo partial navigation.
  document.addEventListener('turbo:load', scheduleInit);
  document.addEventListener('turbo:render', scheduleInit);
  document.addEventListener('turbo:frame-load', scheduleInit);
  window.addEventListener('storage', function (e) {
    if (e.key === PREVIEW_MODE_KEY) {
      previewMode = getPreviewMode();
      refreshPreviewModeToggles();
    }
    if (e.key === AUTO_MORA_INLINE_KEY) {
      autoMoraInlineEnabled = getAutoMoraInlineEnabled();
      refreshAutoMoraInlineToggles();
    }
    if (e.key === UI_LANGUAGE_KEY) {
      uiLanguage = getUiLanguage();
      refreshLocalizedUi();
    }
  });

  const observerTarget = document.documentElement || document.body;
  if (observerTarget) {
    const observer = new MutationObserver(function () {
      if (isSupportedEntryPointRoute()) scheduleInit();
    });
    observer.observe(observerTarget, { childList: true, subtree: true });
  }
})();
