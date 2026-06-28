# 企画提案プランナー

企画提案プレゼンを考えるための4ペイン編集ツール。

**スタック:** Next.js + Tailwind CSS + shadcn/ui + Supabase  
**ホスティング:** [Vercel](https://vercel.com)

## 開発

```bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase の URL / anon key を設定
npm run dev
```

ブラウザで http://127.0.0.1:3000 を開く。

## Supabase セットアップ

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **Project Settings → API** から URL と `anon` key を取得
3. **SQL Editor** で `supabase/schema.sql` を実行（`projects` テーブル + Storage バケット `project-images`）
4. **Authentication → Providers** で Email を有効化  
   - 個人利用のみなら **Confirm email** をオフにするとすぐログインできます
5. **Authentication → URL Configuration** で本番 URL を登録（Vercel デプロイ後）
   - **Site URL:** `https://<your-project>.vercel.app`
   - **Redirect URLs:** `https://<your-project>.vercel.app/**`

## Vercel へのデプロイ

### 方法 A: Git 連携（推奨）

1. リポジトリを GitHub / GitLab / Bitbucket に push
2. [Vercel Dashboard](https://vercel.com/new) でリポジトリをインポート
3. **Environment Variables** に以下を追加（Production / Preview 両方）

   | 名前 | 値 |
   |------|-----|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

4. Deploy — `main` への push で自動デプロイされます

### 方法 B: CLI

```bash
npm install
npx vercel login          # 初回のみ
npx vercel link           # プロジェクトと紐付け（初回のみ）
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run deploy            # 本番 (--prod)
# npm run deploy:preview  # プレビュー
```

CLI で環境変数を入れずにデプロイする場合は、Vercel Dashboard 側で設定してください。

### Surge（サブ・静的ホスト）

本番の正は Vercel です。従来どおり Surge にも出す場合:

```bash
# ビルド時に NEXT_PUBLIC_SUPABASE_* が必要（.env.local または export）
npm run deploy:surge
```

`out/` を `presentation-planner-hiroe.surge.sh` に公開します。ドメインを変える場合は `package.json` の `deploy:surge` を編集してください。

### ビルド設定

`vercel.json` で Next.js フレームワークとビルドコマンドを指定しています。  
リージョンは `hnd1`（東京）をデフォルトにしています。

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ○ | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ○ | Supabase anon（公開）キー |

ローカルは `.env.local`、Vercel は Dashboard または `vercel env` で設定します。

## 実装フェーズ

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1 | 認証・DB永続化 | 実装済 |
| 2 | スライドテンプレート・画像（Storage 永続化） | 実装済 |
| 3 | タイマー・リハーサルモード | 実装済 |
| 4 | PDF / PowerPoint 出力 | 未 |
