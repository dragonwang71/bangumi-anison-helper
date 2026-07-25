# Bangumi Anison Helper

[日本語](README.md) | [English](README.en.md)

Bangumi・Annict・MyAnimeList の作品ページから、アニメの OP・ED 情報をすぐに確認できるユーザースクリプトです。曲名と歌手名をコピーし、Mora の試聴・商品ページや YouTube の検索結果へ移動できます。

![Bangumi Anison Helper の表示例](docs/screenshot.png)

## 対応サイト

- Bangumi：作品ページ・アニメ一覧ページ
- Annict：作品ページ・作品一覧ページ
- MyAnimeList：アニメ作品ページ・季節一覧・検索／ジャンル一覧ページ

## インストール

1. [Tampermonkey](https://www.tampermonkey.net/) などのユーザースクリプトマネージャーをブラウザに追加します。
2. [Greasy Fork から Bangumi Anison Helper をインストール](https://greasyfork.org/scripts/588327-bangumi-anison-helper) を開き、「スクリプトをインストール」を選びます。
3. Bangumi、Annict、MyAnimeList の対応ページを開きます。

## 主な機能

- 作品タイトルから [Anison Generation](https://anison.info/) の OP・ED 情報を検索
- OP・ED、曲名、歌手名を表で表示し、ワンクリックでコピー
- Mora の候補と試聴ページを表示
- 曲名と歌手名で YouTube を検索
- 一覧ページから作品ごとに検索
- 表記揺れやシーズン表記を考慮したタイトル候補
- 日本語・英語・中国語の操作表示（初期設定は日本語）

## 使い方

作品ページではタイトル付近の「Anison」、一覧ページでは作品ごとの「A」を押すと、主題歌一覧が開きます。MyAnimeList の一覧では、クリック時にその作品ページからタイトル候補を取得します。各曲の行から Mora と YouTube を利用でき、列の内容はクリックでコピーできます。

Mora の自動検索は表のヘッダーでオン・オフを切り替えられます。リンクを再利用する小さなウィンドウで開くか、新しいタブで開くかも選択できます。

検索欄の右側にある言語メニューから、日本語、English、中文を選択できます。選択内容はブラウザに保存されます。

## プライバシー

このスクリプトは利用状況や個人情報を収集しません。検索時に MyAnimeList、Anison Generation、Mora へ必要なリクエストを送ります。

## 制限事項

- 外部サイトのデータやページ構造が変わると、検索や試聴が動作しない場合があります。
- 楽曲情報の正確性と網羅性は外部データソースに依存します。
- Mora の配信・試聴可否は作品や地域によって異なります。

## 開発

Node.js で構文チェックとテストを実行できます。追加パッケージは不要です。

```bash
npm test
```

## License

[MIT License](LICENSE)
