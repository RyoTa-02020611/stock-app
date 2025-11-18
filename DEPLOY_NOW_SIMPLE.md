# 🚀 今すぐデプロイする手順（簡単版）

## ステップ1: ログイン

PowerShellで実行：
```powershell
vercel login
```

ブラウザが自動で開くので、GitHubアカウントでログインしてください。

## ステップ2: デプロイ

プロジェクトフォルダ（`C:\app`）で実行：
```powershell
cd C:\app
vercel
```

初回の質問：
- **Set up and deploy?** → `Y` を入力してEnter
- **Which scope?** → 自分のアカウントを選択してEnter
- **Link to existing project?** → `N` を入力してEnter
- **Project name?** → Enter（デフォルト名でOK）または好きな名前を入力
- **Directory?** → `./` を入力してEnter（そのままEnterでもOK）

## ステップ3: 本番環境にデプロイ

```powershell
vercel --prod
```

## ステップ4: URLをコピー

デプロイが完了すると、以下のような**実際のURL**が表示されます：
```
✅ Production: https://stock-portfolio-xxxxx.vercel.app
```

このURLをコピーしてください！

## ステップ5: メールで共有

コピーしたURLを `EMAIL_TEMPLATE.txt` の `https://your-project-name.vercel.app` の部分に貼り付けて、メールで送信してください。

---

## ⚠️ エラーが出た場合

### DNS_HOSTNAME_NOT_FOUND エラー

これは、まだデプロイされていないか、間違ったURLを使用している場合に発生します。

**解決方法：**
1. 上記の手順で実際にデプロイを実行してください
2. デプロイが完了したら、表示される**実際のURL**を使用してください
3. テンプレートの `your-project-name` は実際のURLに置き換える必要があります

### デプロイが失敗する場合

```powershell
# ローカルでビルドをテスト
npm run build
```

エラーがあれば修正してから再デプロイしてください。

---

## 📧 メールテンプレートの使い方

1. `EMAIL_TEMPLATE.txt` を開く
2. `https://your-project-name.vercel.app` を実際のURLに置き換える
3. メールで送信

---

**デプロイが完了したら、表示される実際のURLを使用してください！**

