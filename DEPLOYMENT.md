# デプロイメントガイド

このアプリを他の人に共有・公開するための詳細な手順です。

## 🚀 最も簡単な方法: Vercel（推奨）

VercelはNext.jsの開発元が提供するホスティングサービスで、無料で利用できます。

### ステップ1: GitHubにプッシュ

1. GitHubアカウントを作成（まだの場合）
2. 新しいリポジトリを作成
   - https://github.com/new にアクセス
   - リポジトリ名を入力（例: `stock-portfolio-manager`）
   - パブリックまたはプライベートを選択
   - 「Create repository」をクリック

3. ローカルでGitを初期化してプッシュ
```bash
# プロジェクトディレクトリで実行
git init
git add .
git commit -m "Initial commit: Stock Portfolio Manager"

# GitHubのリポジトリURLを使用（実際のURLに置き換えてください）
git remote add origin https://github.com/your-username/stock-portfolio-manager.git
git branch -M main
git push -u origin main
```

### ステップ2: Vercelにデプロイ

1. Vercelにサインアップ
   - https://vercel.com にアクセス
   - 「Sign Up」をクリック
   - GitHubアカウントでログイン

2. プロジェクトをインポート
   - ダッシュボードで「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック

3. 設定を確認
   - Framework Preset: Next.js（自動検出される）
   - Root Directory: `./`（そのまま）
   - Build Command: `npm run build`（自動）
   - Output Directory: `.next`（自動）

4. デプロイ
   - 「Deploy」をクリック
   - 2-3分待つと完了

5. アクセス
   - `https://your-project-name.vercel.app` のようなURLが生成される
   - このURLを共有すれば、誰でもアクセス可能

### カスタムドメイン（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Domains」を選択
3. ドメイン名を入力して追加

## 📦 方法2: Netlify

1. Netlifyアカウントを作成: https://www.netlify.com
2. GitHubリポジトリを接続
3. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 「Deploy site」をクリック

## 🐳 方法3: Docker（上級者向け）

### Dockerfileの作成

プロジェクトルートに `Dockerfile` を作成:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### next.config.jsの更新

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

### ビルドと実行

```bash
docker build -t stock-portfolio-manager .
docker run -p 3000:3000 stock-portfolio-manager
```

## 🔒 セキュリティに関する注意事項

### 環境変数

外部APIキーを使用している場合、環境変数として設定してください:

1. Vercelの場合:
   - プロジェクト設定 → Environment Variables
   - 変数名と値を追加

2. ローカル開発の場合:
   - `.env.local` ファイルを作成（`.gitignore`に含まれている）
   - 例: `API_KEY=your-api-key`

### データのプライバシー

- 現在、データはブラウザのLocalStorageに保存されます
- サーバー側ではデータを保存していません
- 将来的にデータベースを追加する場合は、適切な認証と暗号化を実装してください

## 📱 モバイル対応

このアプリはレスポンシブデザインになっていますが、モバイルでの最適化が必要な場合:

1. PWA（Progressive Web App）化を検討
2. モバイル専用のUI調整
3. タッチ操作の最適化

## 🔄 継続的なデプロイ

### GitHub Actions（CI/CD）

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
```

Vercelは自動的にGitHubの変更を検知して再デプロイします。

## 🆘 トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドをテスト
npm run build

# エラーがあれば修正してからデプロイ
```

### 環境変数の問題

- Vercelの環境変数が正しく設定されているか確認
- 本番環境と開発環境で異なる値が必要な場合がある

### パフォーマンス

- Vercelの無料プランには制限があります
- 大量のトラフィックがある場合は、有料プランを検討

## 📞 サポート

問題が発生した場合:
1. GitHubのIssuesで報告
2. ログを確認（Vercelダッシュボードの「Functions」タブ）
3. ブラウザのコンソールでエラーを確認

