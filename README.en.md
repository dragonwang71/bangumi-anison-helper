# Bangumi Anison Helper

[日本語](README.md) | [English](README.en.md)

A userscript for quickly checking anime opening and ending theme information from Bangumi, Annict, and MyAnimeList pages. Copy song and artist names, open Mora previews or product pages, and search for tracks on YouTube.

![Bangumi Anison Helper shown in Japanese, the default language](docs/screenshot.png)

## Supported sites

- Bangumi: work and anime list pages
- Annict: work and works list pages
- MyAnimeList: anime pages, seasonal lists, and search or genre lists

## Installation

1. Add a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) to your browser.
2. Open [Bangumi Anison Helper on Greasy Fork](https://greasyfork.org/scripts/588327-bangumi-anison-helper) and choose “Install this script.”
3. Open a supported Bangumi, Annict, or MyAnimeList page.

## Features

- Search [Anison Generation](https://anison.info/) for anime opening and ending themes
- Show OP/ED type, song title, and artist in a compact table with copy actions
- Show Mora matches and preview pages
- Search YouTube with song and artist names
- Search individual works directly from list pages
- Try safe title variants for punctuation and season naming differences
- Japanese, English, and Chinese controls, with Japanese as the default

## Usage

On a work page, select “Anison” beside the title. On a list page, use the “A” button for a work. On MyAnimeList lists, the helper loads title candidates from that work’s page when clicked. The theme-song list opens on the same page, with Mora and YouTube actions on each row and copy buttons beside song and artist names.

Automatic Mora search can be turned on or off from the table header. You can also choose whether links reuse a small preview window or open in a new tab.

Use the language menu beside the search field to choose 日本語, English, or 中文. The selection is saved in the browser.

## Privacy

This script does not collect usage data or personal information. It sends the requests needed for searches to MyAnimeList, Anison Generation, and Mora.

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
