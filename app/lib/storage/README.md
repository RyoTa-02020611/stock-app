# データストレージ設計

このディレクトリには、Stock Libraryアプリケーションのデータストレージ実装が含まれています。

## スキーマ設計

### Trades (取引履歴)
- 取引の詳細情報を保存
- 買い/売り、注文タイプ、執行状況などを記録
- ブローカー連携用の外部IDも保持可能

### Positions (保有ポジション)
- 現在の保有株数を管理
- 平均取得価格、現在価格、評価損益を計算
- 実現損益も追跡

### Notes (メモ・ノート)
- 銘柄や取引に関するメモを保存
- マークダウン形式のコンテンツに対応
- タグや優先度で分類可能

### Attachments (添付ファイル)
- 画像、PDF、ドキュメントなどの添付ファイル情報を管理
- ローカルストレージ、クラウド、外部URLに対応
- 画像のサムネイルも保存可能

## 使用方法

```typescript
import { getStorageAdapter } from '@/lib/storage/localStorageAdapter'

const storage = getStorageAdapter()

// 取引を保存
const trade = await storage.saveTrade({
  symbol: 'AAPL',
  side: 'BUY',
  type: 'MARKET',
  status: 'FILLED',
  quantity: 10,
  price: 150.00,
  timeInForce: 'DAY',
  // ... その他のフィールド
})

// ポジションを取得
const positions = await storage.getPositions()

// メモを検索
const notes = await storage.getNotes('AAPL')

// データをエクスポート
const jsonData = await storage.exportData()
```

## 将来のDB移行

現在は`LocalStorageAdapter`を使用していますが、`StorageAdapter`インターフェースを実装することで、簡単にデータベースに移行できます。

例：
- `PostgreSQLAdapter`
- `MongoDBAdapter`
- `SupabaseAdapter`
- `FirebaseAdapter`

## データ構造の詳細

詳細は `../schema.ts` を参照してください。

