# Bangumi Anison Helper

[日本語](README.md) | [English](README.en.md)

A userscript for quickly checking anime opening and ending theme information from Bangumi, Annict, and MyAnimeList pages. Copy song and artist names, open Mora previews or product pages, and search for tracks on YouTube.

![Bangumi Anison Helper shown in Japanese, the default language](docs/screenshot.png)

## Installation

1. Add a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) to your browser.
2. Open [Bangumi Anison Helper on Greasy Fork](https://greasyfork.org/scripts/588327-bangumi-anison-helper) and choose “Install this script.”
3. Open a supported Bangumi, Annict, or MyAnimeList page.

Supported pages:

- Bangumi work pages
- Bangumi anime list pages
- Annict work and works list pages
- MyAnimeList anime pages, seasonal lists, and search or genre lists

## Features

- Search [Anison Generation](https://anison.info/) theme-song data from a work title
- Show OP/ED type, song title, and artist in a compact table
- Copy song and artist names with one click
- Show Mora matches in the table and open preview or product pages
- Search YouTube with the song and artist names
- Choose Japanese or English controls, with Japanese as the default
- Try multiple title variants that account for seasons, punctuation, and spelling differences
- Search individual works directly from Bangumi and Annict list pages
- Try MyAnimeList Japanese, English, and default titles in that order
- On MyAnimeList lists, load title candidates from the selected anime page only after you click its button
- Show buttons immediately after navigating from the Annict home page, without a reload

## Usage

On a work page, select “Anison” beside the title. On a list page, use the “A” button for a work. On MyAnimeList lists, the helper loads title candidates from that work’s page when clicked. The theme-song list opens on the same page, with Mora and YouTube actions on each row and copy buttons beside song and artist names.

Automatic Mora search can be turned on or off from the table header. You can also choose whether links reuse a small preview window or open in a new tab.

The helper UI defaults to Japanese. Use the compact language menu at the right of the search bar to switch to English; your choice is saved in the browser. Only controls, status text, and helper messages are localized. Work titles, song titles, artist names, and other fetched data keep their original text.

## Search behavior

Work titles vary across sites, and season numbers, punctuation, or subtitles can prevent an exact match. The script starts with the original title, then gradually tries safe alternatives. It checks that returned rows are relevant before showing them.

Mora searches primarily use the song and artist names. When a character and voice actor are credited together, the voice actor can also be used as a search candidate. If a direct match is unavailable, the regular search page opens instead.

## Privacy

This script does not collect usage data or personal information. It sends requests to MyAnimeList, Anison Generation, and Mora when searching for works or tracks. The extra MyAnimeList request is sent only for the work whose “A” button you select on a list page. Display settings, including the selected language, are stored in the browser’s `localStorage`.

## Limitations

- Search and preview features may stop working if an external site changes its data or page structure.
- Accuracy and coverage depend on the external data source.
- Mora availability and previews vary by title and region.

## Development

Run the syntax check and tests with Node.js. No additional packages are required.

```bash
npm test
```

## License

[MIT License](LICENSE)
