# 投資ポートフォリオ管理アプリ

個人投資家向けの包括的なポートフォリオ管理・分析アプリケーションです。

## 主な機能

### 📊 ポートフォリオ管理
- リアルタイムのポートフォリオサマリー
- 取引履歴の記録と分析
- ポジション管理

### 💡 投資思考の管理
- **投資仮説トラッカー**: 仮説を立て、決算ごとに検証
- **投資日記**: 投資判断の記録と振り返り
- **AI要約・仮説チェック**: メモとニュースを分析して矛盾点を指摘

### 🎯 目的別ポートフォリオ
- 留学資金、老後、趣味など目的別に資金を管理
- 進捗バーと時間軸シミュレーション
- 目標金額に対する達成率の可視化

### 📈 銘柄分析
- リアルタイム株価チャート
- 財務データの表示
- ニュースフィード
- カスタム指標ビュー
- アラート設定

### 🔔 今日見るべき3つだけ
- 目標株価に接近した銘柄
- 仮説が崩れそうな銘柄
- アラート設定中の銘柄

### 📝 その他
- メモ・投資理由・リスクの記録
- ファイル・リンクの保管
- チャートへの売買ポイントピン留め
- 取引ミス分析

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **チャート**: Recharts
- **データ保存**: LocalStorage (将来的にDB移行可能)

## セットアップ手順

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

1. リポジトリをクローンまたはダウンロード
```bash
git clone <repository-url>
cd stock-portfolio-manager
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

4. ブラウザで `http://localhost:3000` を開く

### ビルド（本番用）

```bash
npm run build
npm start
```

## 他の人に共有する方法

### 方法1: GitHubで共有（推奨）

1. **GitHubリポジトリを作成**
   - GitHubにログイン
   - 新しいリポジトリを作成（例: `stock-portfolio-manager`）
   - リポジトリをプライベートまたはパブリックに設定

2. **コードをプッシュ**
```bash
# 既存のGitリポジトリがない場合
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/your-username/stock-portfolio-manager.git
git branch -M main
git push -u origin main
```

3. **共有方法**
   - **パブリックリポジトリ**: URLを共有するだけで誰でもアクセス可能
   - **プライベートリポジトリ**: GitHubでコラボレーターを招待

4. **他の人が使う場合**
```bash
git clone https://github.com/your-username/stock-portfolio-manager.git
cd stock-portfolio-manager
npm install
npm run dev
```

### 方法2: Vercelにデプロイ（無料ホスティング）

1. **Vercelアカウントを作成**
   - https://vercel.com にアクセス
   - GitHubアカウントでサインアップ

2. **プロジェクトをインポート**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - 自動的に設定が検出される（Next.js）
   - 「Deploy」をクリック

3. **デプロイ完了**
   - 数分でデプロイが完了
   - `https://your-project.vercel.app` のようなURLが生成される
   - このURLを共有すれば、誰でもアクセス可能

4. **環境変数（必要に応じて）**
   - 設定 > Environment Variables で環境変数を追加可能

### 方法3: その他のホスティングサービス

- **Netlify**: Vercelと同様の手順
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io

### 方法4: ローカルで共有（開発中）

1. **ZIPファイルとして共有**
   - プロジェクトフォルダをZIP化
   - 共有したい人に送付
   - 受け取った人は上記の「セットアップ手順」に従ってインストール

2. **注意事項**
   - `node_modules` フォルダは除外（`.gitignore`に含まれている）
   - 受け取った人は `npm install` を実行する必要がある

## データの保存について

現在、データはブラウザのLocalStorageに保存されます。つまり：
- **各ユーザーのブラウザに個別に保存される**
- **ブラウザをクリアするとデータが消える**
- **デバイス間でデータは共有されない**

将来的にデータベース（PostgreSQL、MongoDBなど）に移行する場合は、`app/lib/storage/` のアダプターを変更するだけで対応可能です。

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# 別のポートで起動
npm run dev -- -p 3001
```

### ビルドエラーが発生する場合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### TypeScriptエラーが発生する場合

```bash
# 型定義を再インストール
npm install --save-dev @types/node @types/react @types/react-dom
```

## ライセンス

このプロジェクトは個人利用を想定しています。商用利用の場合は適切なライセンスを設定してください。

## 貢献

バグ報告や機能要望は、GitHubのIssuesでお願いします。

## 今後の拡張予定

- [ ] データベース統合（PostgreSQL/MongoDB）
- [ ] ユーザー認証
- [ ] 複数ポートフォリオの管理
- [ ] より詳細なAI分析機能
- [ ] モバイルアプリ対応
- [ ] リアルタイム株価更新（WebSocket）

