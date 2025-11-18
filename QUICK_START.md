# クイックスタートガイド

## 🎯 他の人に共有する最も簡単な方法

### オプション1: GitHub + Vercel（5分で完了）

1. **GitHubにアップロード**
   ```bash
   git init
   git add .
   git commit -m "Stock Portfolio Manager"
   # GitHubでリポジトリを作成後:
   git remote add origin https://github.com/your-username/stock-portfolio-manager.git
   git push -u origin main
   ```

2. **Vercelでデプロイ**
   - https://vercel.com にアクセス
   - GitHubでログイン
   - 「New Project」→ リポジトリを選択 → 「Deploy」
   - 完了！URLが生成されます

### オプション2: ZIPファイルで共有

1. プロジェクトフォルダをZIP化（`node_modules`は除外）
2. 受け取った人は以下を実行:
   ```bash
   unzip stock-portfolio-manager.zip
   cd stock-portfolio-manager
   npm install
   npm run dev
   ```

## 📋 必要なもの

- Node.js 18以上
- npm または yarn
- インターネット接続（初回インストール時）

## ⚡ すぐに始める

```bash
# 1. 依存関係をインストール
npm install

# 2. 開発サーバーを起動
npm run dev

# 3. ブラウザで開く
# http://localhost:3000
```

## 🔗 共有URLの例

Vercelでデプロイした場合:
- `https://stock-portfolio-manager.vercel.app`
- このURLを共有するだけで、誰でもアクセス可能

## 💡 ヒント

- **無料で使える**: Vercelの無料プランで十分
- **自動更新**: GitHubにプッシュすると自動で再デプロイ
- **カスタムドメイン**: 独自ドメインも設定可能

詳細は `README.md` と `DEPLOYMENT.md` を参照してください。

