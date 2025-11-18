# 📧 メールでアプリを共有する方法

## 現在の状態

このアプリは**既に登録なしで使える**状態です！

- ✅ ユーザー登録不要
- ✅ ログイン不要
- ✅ アカウント作成不要
- ✅ データは各ユーザーのブラウザに保存（プライベート）

## 🚀 デプロイしてURLを取得する

### 方法1: Vercel CLIでデプロイ（推奨・5分）

#### ステップ1: Vercel CLIをインストール

PowerShellで実行：
```powershell
npm install -g vercel
```

#### ステップ2: ログイン

```powershell
vercel login
```

ブラウザが開くので、GitHubアカウントでログインしてください。

#### ステップ3: デプロイ

```powershell
cd C:\app
vercel
```

質問に答える：
- **Set up and deploy?** → `Y`
- **Which scope?** → 自分のアカウントを選択
- **Link to existing project?** → `N`
- **Project name?** → Enter（デフォルト名でOK）
- **Directory?** → `./` または Enter

#### ステップ4: 本番環境にデプロイ

```powershell
vercel --prod
```

#### ステップ5: URLをコピー

デプロイが完了すると、以下のようなURLが表示されます：
```
✅ Production: https://your-project-name.vercel.app
```

このURLをコピーしてください。

---

### 方法2: GitHub経由でデプロイ（自動更新）

#### ステップ1: GitHubにプッシュ

```powershell
git init
git add .
git commit -m "Stock Portfolio Manager"
git remote add origin https://github.com/your-username/stock-portfolio-manager.git
git branch -M main
git push -u origin main
```

#### ステップ2: Vercelでインポート

1. https://vercel.com にアクセス
2. 「Sign Up」→ GitHubでログイン
3. 「Add New...」→ 「Project」
4. GitHubリポジトリを選択
5. 「Import」→ 「Deploy」

#### ステップ3: URLをコピー

デプロイ完了後、Vercelダッシュボードに表示されるURLをコピー：
```
https://your-project-name.vercel.app
```

---

## 📧 メールで共有する

### メールテンプレート

以下のようなメールを送信してください：

```
件名: 投資ポートフォリオ管理アプリをご紹介します

こんにちは、

個人投資家向けのポートフォリオ管理アプリを作成しました。
ぜひ使ってみてください！

【アプリのURL】
https://your-project-name.vercel.app

【特徴】
✅ 登録不要・ログイン不要
✅ すぐに使い始められます
✅ データはあなたのブラウザに保存されます（プライベート）

【主な機能】
- ポートフォリオ管理
- 投資仮説トラッカー
- 目的別ポートフォリオ（留学資金、老後など）
- 銘柄分析とチャート
- 投資日記
- 今日見るべき3つだけ

【使い方】
1. 上記のURLをクリック
2. すぐに使い始められます
3. データは自動でブラウザに保存されます

【注意事項】
- データは各ユーザーのブラウザに個別に保存されます
- ブラウザをクリアするとデータが消える可能性があります
- デバイス間でデータは共有されません

何か質問があれば、お気軽にお聞きください。

よろしくお願いします。
```

---

## 🔗 共有用の短縮URL（オプション）

長いURLを短縮したい場合：

1. **bit.ly** を使用
   - https://bit.ly にアクセス
   - VercelのURLを入力
   - 短縮URLを生成

2. **QRコードを生成**
   - https://qr-code-generator.com など
   - URLからQRコードを生成
   - メールに添付

---

## 📱 モバイルでも使える

デプロイされたアプリは：
- ✅ スマートフォンからもアクセス可能
- ✅ タブレットからもアクセス可能
- ✅ レスポンシブデザイン対応

メールに「スマートフォンからもアクセスできます」と追加してください。

---

## 🎯 カスタムドメイン（オプション）

より覚えやすいURLにしたい場合：

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→ 「Domains」
3. ドメイン名を入力（例: `my-stock-app.com`）
4. DNS設定を追加（Vercelが案内してくれます）

これで、`https://my-stock-app.com` のようなURLでアクセスできます。

---

## ✅ チェックリスト

デプロイ前に確認：

- [ ] `npm run build` が成功する
- [ ] ローカルで `npm run dev` で動作確認
- [ ] 機密情報がコードに含まれていない
- [ ] `.gitignore` に `node_modules` が含まれている

デプロイ後に確認：

- [ ] URLにアクセスできる
- [ ] アプリが正常に表示される
- [ ] 主要な機能が動作する
- [ ] モバイルでも表示される

---

## 🆘 トラブルシューティング

### URLにアクセスできない場合

1. Vercelダッシュボードでデプロイの状態を確認
2. ログを確認（「Functions」タブ）
3. ブラウザのキャッシュをクリア

### メールが届かない場合

- URLを直接コピー＆ペーストして送信
- 短縮URLサービスを使用

### アプリが表示されない場合

- デプロイが完了しているか確認（2-3分かかります）
- ブラウザのコンソールでエラーを確認

---

**これで完了です！メールでURLを共有するだけで、誰でも登録なしでアプリを使えます！** 🎉

