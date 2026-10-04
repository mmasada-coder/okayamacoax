# おかやまCoAX ポータルサイト

岡山の管理者・経営者のための無料AI活用実践コミュニティ。運営：合同会社リバース。コンセプトは「共に、次へ。」。
ビルド不要のHTML・CSS・JavaScriptで、正本はこのGitHubリポジトリです。

## 1回の依頼から更新一式を準備する

ChatGPTにイベントの概要や活動記録を渡し、サイト用JSON・LINE告知・LINEノート・LINEイベント説明をまとめて作成させます。
運営資料・原稿・確認記録はGoogle Drive「おかやまCoAX」に保存し、公開するデータだけGitHubに反映します。
Driveの旧JSONからサイトを更新しないでください。

1. [更新手順](docs/update-workflow.md)をChatGPTに読ませ、GitHub mainの最新版を基準に更新パックを作成。
2. `tools/update-preparer.html` をサイトまたはローカルサーバーで開き、更新パックを貼り付ける。
3. サイトJSONとLINE原稿をまとめて確認。正田真澄の承認後、必要な変更だけGitHubへ反映。
4. 公開サイトの表示・参加登録リンクを確認。LINEへの投稿は運営者が行う。

GitHubへの書き込み連携が使える場合はChatGPTが変更ブランチ・PRまで作成できるため、手作業のJSONアップロードを省けます。
承認前にmainへ反映しないでください。読み取り連携のみの場合は準備画面からJSONをダウンロードできます。
準備画面はプロンプトの合言葉やGitHubトークンを必要としません。貼り付けた入力はメモリ内で処理し、保存しません。

## ファイル構成

- `index.html`：トップと次回開催予定
- `prompts.html` / `category.html`：暗号化プロンプト集
- `columns.html` / `column.html`：コラム一覧・記事詳細
- `admin.html`：従来の管理画面（プロンプト編集も含む）
- `tools/update-preparer.html`：更新パックからサイトJSON・LINE原稿を一括準備
- `data/config.json`：サイト名・参加登録フォーム・カテゴリ
- `data/columns.json`：コラム・イベントレポート
- `data/events.json`：開催予定と開催状況
- `data/prompts/*.enc.json`：暗号化プロンプト（5カテゴリ）
- `assets/js/content-tools.js`：データ検証・更新パック・予定表示の共通処理
- `tools/prepare-update.mjs`：Node.jsからの一括準備
- `work/`：一時的な非公開入力・確認用出力（Git管理対象外。保存先の正本はDrive）

## 開催予定

`date` は空文字（日程調整中）または `YYYY-MM-DDTHH:MM:00+09:00`。
`type` は「オンライン」「オフライン」。
`status` は `planned`（予定）、`completed`（開催済み）、`postponed`（延期）、`cancelled`（中止）。
従来データとの互換性のため、status省略時は予定扱いです。
開催済み・延期・中止は次回予定に表示しません。日時は閲覧端末の時差にかかわらず日本時間で表示します。
開始後12時間を過ぎた予定も非表示にします。

## 検証

Node.js 22以上、追加パッケージ不要。

```sh
node tools/validate-content.mjs
node --test tests/content-tools.test.cjs
```

PRとmainの更新時にGitHub Actionsでも検証します。
JSON構文・必須項目・記事IDの重複・日付・種別・本文ブロックを検証します。
新規更新パックでは記事の連番、600〜900字、指定の書き出しと締め、禁止表現も検証します。
事実関係、本人の掲載許可、文体、個人情報の扱いは運営者の確認が必要です。

## ローカル確認と公開

JSONを読み込むためHTTPサーバー経由で確認してください。

```sh
python -m http.server 8000
```

`http://localhost:8000/` または `http://localhost:8000/tools/update-preparer.html` を開きます。
公開は既存のGitHub Pagesを利用します。`CNAME` と `.nojekyll` を維持してください。
mainに反映した後、公開サイトで実際の表示を確認し、承認済みJSONと照合してください。

## プロンプト集の更新

明示的な更新指示がある場合だけ行います。暗号化済みファイルだけを公開し、平文・合言葉はGitHubや原稿に保存しません。
従来の `admin.html` または `tools/encryptor.html` をHTTPS／localhostで使って暗号化します。
`prompts-source/` はGit管理対象外です。合言葉の変更時は5カテゴリを再暗号化する必要があります。
