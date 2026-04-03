# 運用・管理ガイド

本プロジェクト（ore-news）の運用方法と、環境設定の手順をまとめます。将来的にURLの変更や再ビルドを行う際にご活用ください。

## 1. 環境変数の設定

### ローカル環境 (`.env`)
プロジェクトのルートに `.env` ファイルを作成して設定します。
```text
SOURCE_URL=https://asahi.5ch.io/newsplus/subject.txt
```
※ Astroのビルド時にこのURLが読み込まれます。

### GitHub環境 (Secrets)
GitHub Pagesに自動デプロイする場合、リポジトリの設定で以下のSecretを登録してください。
- **場所**: `Settings` > `Secrets and variables` > `Actions`
- **変数名**: `SOURCE_URL`
- **内容**: 取得したい `subject.txt` のURL

---

## 2. GitHub Actions による自動更新
`.github/workflows/deploy.yml` により、以下のタイミングで自動的にビルドとデプロイが行われます。

1.  **mainブランチへのPush**: コードを修正した時に実行されます。
2.  **定期実行（Schedule）**: **毎時3分**に、最新のランキングを取得して再ビルドします。
3.  **手動実行（Workflow Dispatch）**: GitHubのリポジトリ画面（`Actions` タブ）から「Run workflow」ボタンを押すことで、いつでも即時更新が可能です。

---

## 3. UIの仕様変更
現在のUIは **800x480** の解像度を想定し、1行で最大限の情報（勢い＋タイトル＋日時）を詰め込む「超シンプル（データ特化）」設計です。

- **1行表示**: 左右に要素を分割し、不要なアイコンや投稿者名を排除しています。
- **背景/文字色**: 白背景に黒文字のハイコントラスト構成です。
- **デザイン修正**: `src/pages/index.astro` の `<style>` セクションを編集することで変更可能です。

---

## 4. ローカルでの開発・検証
作業を再開する場合や、表示を事前に確認する場合は以下のコマンドを使用します。

```bash
# 依存関係のインストール (最初の一回)
npm install

# 開発用サーバーの起動 (リアルタイムで編集を確認)
npm run dev

# ビルド（本番用HTMLの生成）
npm run build

# ビルド結果のプレビュー
npx serve dist -p 4321
```

## 5. データ取得のテクニカル仕様
詳細なデータ加工ロジックや勢いの計算式については、同一フォルダ内の [data_fetching_specs.md](./data_fetching_specs.md) を参照してください。
