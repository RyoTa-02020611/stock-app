# 🚀 URLをクリックするだけで起動できるようにする手順

## 最も簡単な方法（5分で完了）

### ステップ1: Vercel CLIをインストール

PowerShellまたはコマンドプロンプトで実行：

```powershell
npm install -g vercel
```

### ステップ2: ログイン

```powershell
vercel login
```

ブラウザが自動で開くので、GitHubアカウントでログインしてください。

### ステップ3: デプロイ

プロジェクトのフォルダ（`C:\app`）で実行：

```powershell
cd C:\app
vercel
```

初回は質問されます：
- **Set up and deploy?** → `Y` を入力してEnter
- **Which scope?** → 自分のアカウントを選択してEnter
- **Link to existing project?** → `N` を入力してEnter（新規プロジェクト）
- **Project name?** → Enter（デフォルト名）または好きな名前を入力
- **Directory?** → `./` を入力してEnter（そのままEnterでもOK）

### ステップ4: 完了！

デプロイが完了すると、以下のようなURLが表示されます：

```
✅ Production: https://your-project-name.vercel.app
```

**このURLをクリックするだけで、アプリが起動します！**

### 本番環境にデプロイ（オプション）

```powershell
vercel --prod
```

これで本番環境にデプロイされ、URLが安定します。

---

## 方法2: GitHub経由でデプロイ（推奨・自動更新）

### ステップ1: GitHubにプッシュ

```powershell
# Gitが初期化されていない場合
git init
git add .
git commit -m "Initial commit"

# GitHubでリポジトリを作成後（https://github.com/new）
git remote add origin https://github.com/your-username/stock-portfolio-manager.git
git branch -M main
git push -u origin main
```

### ステップ2: Vercelでインポート

1. https://vercel.com にアクセス
2. 「Sign Up」→ GitHubでログイン
3. 「Add New...」→ 「Project」
4. GitHubリポジトリを選択
5. 「Import」をクリック
6. 設定を確認（自動検出される）:
   - Framework: Next.js
   - Root Directory: `./`
7. 「Deploy」をクリック

### ステップ3: 完了！

2-3分でデプロイが完了し、URLが生成されます。

**メリット:**
- GitHubにプッシュするたびに自動で再デプロイ
- コードの履歴が残る
- チーム開発に便利

---

## 📱 デプロイ後の使い方

### URLを共有

デプロイが完了すると、以下のようなURLが生成されます：
```
https://your-project-name.vercel.app
```

このURLを：
- ✅ メールで送る
- ✅ メッセージで送る
- ✅ ブックマークする
- ✅ SNSでシェアする

**誰でもこのURLをクリックするだけで、アプリが起動します！**

### 更新方法

変更を加えた後：

```powershell
# Vercel CLIの場合
vercel --prod

# GitHub経由の場合
git add .
git commit -m "Update"
git push
```

自動で再デプロイされます！

---

## ⚠️ 注意事項

1. **無料プランで十分**
   - 月間100GBの帯域幅
   - 無制限のデプロイ
   - 個人利用には十分

2. **データの保存**
   - 現在、データはブラウザのLocalStorageに保存されます
   - サーバー側ではデータを保存していません
   - 各ユーザーのブラウザに個別に保存されます

3. **環境変数**
   - 外部APIキーを使用している場合、Vercelの設定で環境変数を追加してください

---

## 🆘 トラブルシューティング

### デプロイが失敗する場合

```powershell
# ローカルでビルドをテスト
npm run build
```

### URLにアクセスできない場合

- Vercelダッシュボードでデプロイの状態を確認
- ログを確認（「Functions」タブ）

---

**これで完了です！URLをクリックするだけで、どこからでもアプリにアクセスできます！** 🎉

