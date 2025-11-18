# 実トレード機能のセットアップ

このアプリケーションは、ペーパートレードモードと本番トレードモードの両方をサポートしています。

## 環境変数の設定

### `.env.local` ファイルを作成

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の環境変数を設定してください。

### ペーパートレードモード（デフォルト）

```env
# 取引モード: "paper" または "live"
TRADING_MODE=paper
```

ペーパートレードモードでは、実際の取引は行われません。練習やテストに使用できます。

### 本番トレードモード

```env
# 取引モード
TRADING_MODE=live

# ブローカーAPI設定
BROKER_API_BASE_URL=https://api.broker.com/v1
BROKER_API_KEY=your_api_key_here
BROKER_API_SECRET=your_api_secret_here

# リスク管理設定（オプション）
MAX_ORDER_QTY=1000
ALLOWED_SYMBOLS=AAPL,TSLA,MSFT,GOOGL,AMZN
TRADING_ENABLED=true
```

### 環境変数の説明

- `TRADING_MODE`: `"paper"` または `"live"` を設定
- `BROKER_API_BASE_URL`: ブローカーAPIのベースURL
- `BROKER_API_KEY`: ブローカーAPIのキー
- `BROKER_API_SECRET`: ブローカーAPIのシークレット
- `MAX_ORDER_QTY`: 1回の注文の最大数量（デフォルト: 1000）
- `ALLOWED_SYMBOLS`: 取引可能な銘柄のリスト（カンマ区切り、未設定の場合はすべて許可）
- `TRADING_ENABLED`: 取引を有効にするかどうか（`"false"` で取引を停止）

## ブローカーAPIの統合

`lib/brokerClient.ts` の `LiveBrokerClient` クラスを、使用するブローカーのAPI仕様に合わせてカスタマイズしてください。

### 主なカスタマイズポイント

1. **認証方法**: ブローカーの認証方式（Basic、Bearer、カスタムヘッダーなど）に合わせて `request` メソッドを修正
2. **APIエンドポイント**: ブローカーの実際のエンドポイントに合わせて修正
3. **レスポンス形式**: ブローカーのレスポンス形式に合わせて `placeOrder`、`getOrders` などのメソッドを修正

### 例: Alpaca API の場合

```typescript
// lib/brokerClient.ts の LiveBrokerClient クラス内

private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `https://api.alpaca.markets/v2${endpoint}`
  
  const headers: HeadersInit = {
    'APCA-API-KEY-ID': this.apiKey,
    'APCA-API-SECRET-KEY': this.apiSecret,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // ... エラーハンドリング
}
```

## セキュリティに関する注意事項

⚠️ **重要**: 

1. **APIキーとシークレットは絶対にクライアント側に公開しないでください**
   - すべてのAPI呼び出しはサーバー側（Next.js API Routes）で実行されます
   - 環境変数は `.env.local` に保存し、`.gitignore` に追加してください

2. **本番環境では必ずHTTPSを使用してください**
   - HTTPではAPIキーが盗まれる可能性があります

3. **本番モードを使用する前に、必ずペーパートレードモードで十分にテストしてください**

4. **リスク管理設定を適切に設定してください**
   - `MAX_ORDER_QTY` で最大注文数量を制限
   - `ALLOWED_SYMBOLS` で取引可能な銘柄を制限

## 使用方法

1. **ペーパートレードモードで開始**
   ```env
   TRADING_MODE=paper
   ```
   アプリを起動し、注文機能をテストします。

2. **本番モードに切り替え**
   - 設定画面から「本番トレードモード」に切り替えることができます
   - または、環境変数で `TRADING_MODE=live` を設定

3. **注文の送信**
   - 注文パネルで注文を入力
   - 確認ダイアログで内容を確認
   - 本番モードの場合は警告が表示されます

## トラブルシューティング

### ブローカーAPIエラーが発生する場合

1. 環境変数が正しく設定されているか確認
2. ブローカーAPIの認証情報が有効か確認
3. ネットワーク接続を確認
4. サーバーログを確認（エラーの詳細が記録されます）

### 注文が送信されない場合

1. `TRADING_ENABLED` が `true` に設定されているか確認
2. `MAX_ORDER_QTY` や `ALLOWED_SYMBOLS` の制限を確認
3. ブラウザのコンソールとサーバーログを確認

## 免責事項

本アプリケーションを使用する際は、以下の点にご注意ください：

- 投資にはリスクが伴います。損失が発生する可能性があります
- 表示される情報は参考情報であり、投資の推奨や保証を意味するものではありません
- 投資決定は自己責任で行ってください
- 本番モードを使用する前に、必ずペーパートレードモードで十分にテストしてください

