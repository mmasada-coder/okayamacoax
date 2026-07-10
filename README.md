# おかやまCoAX ポータルサイト

岡山の管理者・経営者向け、無料AI活用実践コミュニティ「おかやまCoAX」のポータルサイト（フェーズ1）。
コンセプトは **「共に、次へ」**。運営：合同会社リバース。

ビルド不要の静的サイト（HTML + CSS + バニラJS）です。コンテンツはすべて `data/` 以下のJSONに分離してあり、
**JSONに追記 → デプロイ** のシンプルな運用で更新できます。

---

## 📁 構成

```
okayamacoax/
├─ index.html          # 1. トップページ
├─ prompts.html        # 2. プロンプトライブラリ（カテゴリ一覧）
├─ category.html       # 3. カテゴリ別ページ（?cat=management など）
├─ columns.html        # 4. コラム・イベントレポート一覧
├─ column.html         # 5. 記事詳細（?id=col-001 など）
├─ assets/
│  ├─ css/style.css
│  └─ js/  (main.js ＋ 各ページ用)
└─ data/               # ← 更新はここだけ触ればOK
   ├─ config.json          # サイト設定・カテゴリ定義・LINEフォームURL
   ├─ events.json          # 次回開催予定
   ├─ columns.json         # コラム／イベントレポート記事
   └─ prompts/
      ├─ management.json    # マネジメント
      ├─ documents.json     # 書類作成
      ├─ sales.json         # 営業・マーケティング（現在Coming soon）
      ├─ analysis.json      # 経営判断・分析（現在Coming soon）
      └─ hr.json            # 採用・人事（現在Coming soon）
```

---

## 🚀 ローカルで確認する

JSONを `fetch` で読み込むため、HTMLファイルを直接ダブルクリックして開くと表示されません。
**簡易サーバー経由**で開いてください（どちらか一方）。

**Python がある場合**
```bash
cd okayamacoax
python -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

**Node.js がある場合**
```bash
cd okayamacoax
npx serve
```

---

## 🔧 管理画面（`admin.html`）＝いちばんラクな更新方法（推奨）

JSONを直接いじらなくても、**ブラウザの管理画面**でコラム・開催予定・プロンプト・サイト設定を
編集できます。フォーム感覚で編集 → ファイルを書き出し → GitHubに差し替え、という流れです。

**使い方:**
1. `https://okayamacoax.re-birth-llc.co.jp/admin.html` を開く（運営専用。合言葉で保護）
2. **合言葉**（プロンプト集と同じもの）で解錠
3. タブ（コラム／開催予定／プロンプト／サイト設定）で編集
   - 「＋追加」で新規、「削除」で除去
   - プロンプトはカテゴリを選んで編集（**書き出し時に自動で暗号化**されます）
4. 各タブ下部の「**◯◯を書き出す**」ボタンでファイルをダウンロード
5. GitHubのリポジトリで、そのファイルを**同じ場所に差し替えてコミット**
   - 例：`columns.json` は `data/` に、`sales.enc.json` は `data/prompts/` に
   - GitHub画面での差し替え方：対象フォルダを開く →「Add file → Upload files」→
     ダウンロードしたファイルをドロップ →「Commit changes」（同名ファイルは上書きされます）
6. 1〜2分で公開サイトに反映

> 変更した**タブのファイルだけ**書き出せばOKです（プロンプトは編集した**カテゴリごと**に書き出し）。
> 書き出すまではファイルに反映されないので、操作を間違えても安心です。
> ※ 管理画面は https:// か localhost でのみ動作します（暗号機能の制約）。

下記の「手作業でJSONを編集する方法」は、管理画面を使わない場合の代替手段です。

---

## ✍️ 週次更新の手順（手作業でJSONを編集する場合）

### 1. コラム・イベントレポートを追加する
`data/columns.json` の配列の先頭に、1件ぶんのブロックを追記します。

```json
{
  "id": "col-002",
  "title": "記事のタイトル",
  "date": "2026-07-16",
  "category": "イベントレポート",
  "excerpt": "一覧に表示される2〜3行の抜粋文。",
  "body": [
    { "type": "p",  "text": "本文の段落。" },
    { "type": "h2", "text": "見出し" },
    { "type": "p",  "text": "続きの段落。改行は \\n で入れられます。" }
  ]
}
```
- `id` は他と重複しない値にする（例：`col-002`, `col-003`…）
- `date` は `YYYY-MM-DD` 形式。新着順は日付で自動ソートされます
- `body` は段落 `p` と見出し `h2` を並べるだけ。文字列1本で書いてもOK

### 2. プロンプトを追加する（🔒 合言葉で暗号化）

プロンプト本文は**合言葉で暗号化**して公開しています。公開領域（`data/prompts/`）には
**暗号化ファイル `◯◯.enc.json` だけ**を置き、平文は置きません。編集の流れは次のとおりです。

**編集用の平文ソースはこちら（Git管理外・非公開）:**

| カテゴリ | 編集するファイル | → 公開される暗号ファイル |
| :-- | :-- | :-- |
| マネジメント | `prompts-source/management.json` | `data/prompts/management.enc.json` |
| 書類作成 | `prompts-source/documents.json` | `data/prompts/documents.enc.json` |
| 営業・マーケティング | `prompts-source/sales.json` | `data/prompts/sales.enc.json` |
| 経営判断・分析 | `prompts-source/analysis.json` | `data/prompts/analysis.enc.json` |
| 採用・人事 | `prompts-source/hr.json` | `data/prompts/hr.enc.json` |

**手順:**
1. `prompts-source/◯◯.json` を開いて、配列にプロンプトを追記（形式は下記）
   ```json
   { "id": "sales-06", "title": "タイトル", "description": "短い説明（任意）", "body": "本文。改行は \\n" }
   ```
2. 暗号化ツール **`tools/encryptor.html`** をブラウザで開く（`serve.ps1` 起動中に
   `http://localhost:8000/tools/encryptor.html`、または直接ダブルクリックでもOK）
3. 合言葉とカテゴリを選び、`prompts-source/◯◯.json` の中身を貼り付け → 「暗号化してダウンロード」
4. できた `◯◯.enc.json` を `data/prompts/` に上書き保存 → GitHubへ反映（コミット/プッシュ）

> ⚠️ **合言葉について**
> - 合言葉は運営が別途管理します（**セキュリティのため、このファイルには記載しません**）。
> - 変更する場合は、**5カテゴリすべて**を新しい合言葉で暗号化し直します。
> - 合言葉は、参加登録の自動返信メール／LINEオープンチャットで参加者に配布する運用を想定。
> - この機能は **https:// または localhost でのみ動作**します（ブラウザの暗号APIの制約）。
>   公開サイトでは GitHub Pages の「Enforce HTTPS」を有効にしてください。
> - 平文の `prompts-source/` は `.gitignore` 済み。バックアップは各自で保管を（万一失っても、
>   `tools/encryptor.html` の「復号して確認」タブで暗号ファイルから元に戻せます）。

### 3. 開催予定を更新する
`data/events.json` を編集。過ぎた予定はトップページから自動で消えます。

```json
{
  "id": "evt-2026-08-01",
  "title": "イベント名",
  "date": "2026-08-01T19:30:00+09:00",
  "type": "オンライン",
  "note": "補足メモ（任意）"
}
```
`type` は `オンライン` か `オフライン`。

### 4. カテゴリを「準備中」から「公開」にする
`data/prompts/xxx.json` にプロンプトを1件以上入れると、自動で「公開中」表示に変わります。
（`config.json` の `status` を `available` にしておくと確実です）

### 5. 反映
編集したJSONを保存し、ホスティング先に**デプロイ（アップロード）**すれば反映されます。

---

## ⚙️ 公開前に必ず設定すること

`data/config.json` の **`lineFormUrl`** を、実際のGoogleフォームのURLに差し替えてください。

```json
"lineFormUrl": "https://forms.gle/REPLACE_WITH_YOUR_GOOGLE_FORM_ID"
```

サイト内の「LINEで参加する」ボタンは、すべてこのURLを参照します（1か所直すだけで全ページに反映）。

### OGP（SNS/LINEでシェアしたときのプレビュー画像）

各HTMLの `<head>` にOGPタグを設定済みです。画像は `assets/img/ogp.png`（1200×630）。
公開ドメインは **`okayamacoax.re-birth-llc.co.jp`** に設定済みで、`og:image` / `og:url` もこのドメインを指しています。
（別ドメインに変える場合は、全HTMLの `okayamacoax.re-birth-llc.co.jp` を置換してください）

※ シェア済みURLはキャッシュされるため、更新後は各SNSのデバッガー（例：Facebook Sharing Debugger）で再取得すると反映が早いです。

### GitHub Pages / 独自サブドメイン
- リポジトリ直下の `CNAME`（内容：`okayamacoax.re-birth-llc.co.jp`）でカスタムドメインを指定
- `re-birth-llc.co.jp` のDNSに次のCNAMEレコードを追加：
  `okayamacoax  CNAME  <GitHubユーザー名>.github.io`
- `.nojekyll` を置いているため、GitHub PagesはJekyll処理をせず、ファイルをそのまま配信します

---

## 🌐 デプロイ

`okayamacoax/` フォルダをそのままアップロードするだけで動きます（ビルド不要）。

- **Netlify / Vercel / Cloudflare Pages**：フォルダをドラッグ＆ドロップ、またはGitHub連携で自動デプロイ
- **GitHub Pages**：リポジトリを公開し Pages を有効化
- **レンタルサーバー**：FTPでファイル一式をアップロード

---

## 🔮 フェーズ2（管理画面）に向けて

コンテンツは `data/` 配下のJSONに完全分離済みです。フェーズ2では、この同じJSON構造の上に
CRUD（作成・編集・削除）のUIを被せる形で、コードを大きく変えずに拡張できます。
