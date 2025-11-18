# 🚀 登録なしで使える静的サイトとしてデプロイ

このアプリを**完全に静的サイト**としてビルドして、GitHub PagesやNetlify Dropなど、どこでもホスティングできるようにします。

## 📦 方法1: GitHub Pages（無料・簡単）

### ステップ1: 静的エクスポートを有効化

`next.config.js` の `output: 'export'` のコメントを外します：

```javascript
const nextConfig = {
  output: 'export',  // この行のコメントを外す
  images: {
    unoptimized: true,
  },
}
```

### ステップ2: ビルド

```powershell
npm run build
```

これで `out` フォルダに静的ファイルが生成されます。

### ステップ3: GitHub Pagesにデプロイ

1. GitHubでリポジトリを作成
2. `out` フォルダの内容をプッシュ
3. リポジトリの Settings → Pages でソースを `main` ブランチの `/out` に設定

**URL例:** `https://your-username.github.io/stock-portfolio-manager/`

---

## 📦 方法2: Netlify Drop（最も簡単・ドラッグ&ドロップ）

### ステップ1: 静的エクスポートを有効化

`next.config.js` で `output: 'export'` を有効化

### ステップ2: ビルド

```powershell
npm run build
```

### ステップ3: Netlify Dropにデプロイ

1. https://app.netlify.com/drop にアクセス
2. `out` フォルダをドラッグ&ドロップ
3. 完了！URLが自動生成されます

**メリット:**
- ✅ 登録不要（初回のみ）
- ✅ ドラッグ&ドロップだけで完了
- ✅ 自動でHTTPS対応
- ✅ カスタムドメインも設定可能

---

## 📦 方法3: Vercel（現在の方法・推奨）

現在の方法のまま、Vercelにデプロイすれば、既に登録なしで使えます。

```powershell
vercel login
vercel --prod
```

**メリット:**
- ✅ APIルートが使える（静的エクスポート不要）
- ✅ 自動デプロイ
- ✅ 無料

---

## ⚠️ 静的エクスポートの注意点

### APIルートが使えなくなる

静的エクスポート（`output: 'export'`）を使うと、`app/api/` のAPIルートが使えなくなります。

**解決方法：**
1. APIルートをクライアントサイドの関数に変換
2. 外部APIを直接呼び出す
3. または、Vercelを使う（APIルートが使える）

---

## 🎯 推奨: Vercelを使う（現在の方法）

**理由：**
- ✅ 既に登録なしで使える
- ✅ APIルートが使える
- ✅ 自動デプロイ
- ✅ 無料

**手順：**
```powershell
vercel login
vercel --prod
```

表示されたURLをメールで共有するだけです！

---

## 📧 メールで共有

デプロイが完了したら、URLをメールで共有：

```
件名: 投資ポートフォリオ管理アプリ

こんにちは、

投資ポートフォリオ管理アプリを作成しました。
登録不要で、すぐに使えます！

【アプリのURL】
https://your-app-url.vercel.app
（または GitHub Pages / Netlify のURL）

【特徴】
✅ 登録不要・ログイン不要
✅ URLをクリックするだけで使えます
✅ データはブラウザに保存（プライベート）

ぜひ使ってみてください！
```

---

**最も簡単な方法は、Vercelにデプロイすることです。既に登録なしで使えます！**

