# マーケット画面 UI/UX 改善 完全ガイド

## 📋 目次
1. [新しい構成図](#新しい構成図)
2. [実装したコンポーネント一覧](#実装したコンポーネント一覧)
3. [各コンポーネントの詳細説明](#各コンポーネントの詳細説明)
4. [実装手順（初心者向け）](#実装手順初心者向け)
5. [モックデータの定義](#モックデータの定義)
6. [実データに接続する方法](#実データに接続する方法)
7. [拡張案とアドバイス](#拡張案とアドバイス)

---

## 新しい構成図

```
MarketPage (app/market/page.tsx)
│
├── MarketHeader
│   └── タイトル・説明
│
├── MarketFilters
│   └── 市場ボタン（ALL, US, JP, EU, ASIA）
│
├── SortButtons ← 【改善1】並び替えボタン（強調表示）
│   ├── activeSort state で管理
│   ├── アクティブ時: 青背景 + 下線 + ↑↓アイコン
│   └── 非アクティブ時: グレー背景
│
├── SearchBar
│   └── 検索バー
│
├── StockTable ← 【改善2】銘柄テーブル（Sparkline付き）
│   ├── StockTableHeader
│   ├── StockTableRow
│   │   ├── StockSparkline ← 【改善2】ミニチャート
│   │   │   └── Recharts LineChart (120px × 40px)
│   │   ├── StockInfo
│   │   └── onClick → 詳細表示
│   └── StockTableFooter
│
└── StockDetailModal ← 【改善3】パターンB: モーダル
    └── StockDetailPanel ← 【改善3】パターンA: 右側パネル
        ├── StockDetailHeader
        ├── StockDetailChart
        ├── StockDetailMetrics
        └── StockDetailNews
```

---

## 実装したコンポーネント一覧

| コンポーネント | ファイル | 機能 |
|--------------|---------|------|
| `SortButtons` | `app/components/market/SortButtons.tsx` | 並び替えボタン（強調表示） |
| `StockSparkline` | `app/components/market/StockSparkline.tsx` | ミニチャート（5日間） |
| `StockTable` | `app/components/market/StockTable.tsx` | 銘柄テーブル |
| `StockDetailModal` | `app/components/market/StockDetailModal.tsx` | 銘柄詳細モーダル（パターンB） |
| `StockDetailPanel` | `app/components/market/StockDetailPanel.tsx` | 銘柄詳細パネル（パターンA） |

---

## 各コンポーネントの詳細説明

### 1. SortButtons（並び替えボタン - 強調表示）

**ファイル**: `app/components/market/SortButtons.tsx`

**機能**:
- ✅ アクティブなソート条件を強調表示
- ✅ ボタンの色変更（青背景）
- ✅ 下線表示（border-b-2）
- ✅ ↑↓アイコンで方向表示
- ✅ クリックで昇順/降順を切り替え

**State管理**:
```typescript
// MarketPage で管理
const [activeSort, setActiveSort] = useState<{
  type: SortType
  direction: 'asc' | 'desc'
}>({ type: 'gainers', direction: 'desc' })
```

**スタイル**:
- アクティブ: `bg-blue-600 text-white border-b-2 border-blue-400 shadow-lg`
- 非アクティブ: `bg-gray-700 text-gray-300 hover:bg-gray-600`

**使い方**:
```tsx
<SortButtons
  activeSort={activeSort}
  onSortChange={(type, direction) => setActiveSort({ type, direction })}
/>
```

### 2. StockSparkline（ミニチャート）

**ファイル**: `app/components/market/StockSparkline.tsx`

**機能**:
- ✅ 5日間の価格推移を表示
- ✅ Recharts LineChart を使用
- ✅ サイズ: 120px × 40px
- ✅ 上昇/下降で色分け（緑/赤）

**特徴**:
- データがない場合は自動でモックデータを生成
- アニメーション無効（パフォーマンス向上）
- ドット表示なし（シンプルな線のみ）

**使い方**:
```tsx
<StockSparkline
  symbol={stock.symbol}
  currentPrice={stock.price}
  data={priceHistoryData} // オプション: 実データを渡す
/>
```

### 3. StockTable（銘柄テーブル）

**ファイル**: `app/components/market/StockTable.tsx`

**機能**:
- ✅ 銘柄情報をテーブル形式で表示
- ✅ 各行にSparklineを表示
- ✅ 行クリックで詳細表示
- ✅ ホバー効果

**改善点**:
- 行の高さを適切に設定（`py-4`）
- 余白を確保（`px-4`）
- ホバー時の色変更（`hover:bg-gray-700/30`）

**使い方**:
```tsx
<StockTable
  stocks={filteredStocks}
  onRowClick={(symbol) => handleSelectSymbol(symbol)}
/>
```

### 4. StockDetailModal（銘柄詳細モーダル - パターンB）

**ファイル**: `app/components/market/StockDetailModal.tsx`

**機能**:
- ✅ 中央にモーダル表示
- ✅ 現在価格・前日比
- ✅ 基本指標（時価総額、PER、出来高）
- ✅ チャートエリア（プレースホルダー）
- ✅ 関連ニュース一覧

**特徴**:
- モーダル背景クリックで閉じる
- ローディング状態の表示

**使い方**:
```tsx
<StockDetailModal
  symbol={selectedSymbol}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

### 5. StockDetailPanel（銘柄詳細パネル - パターンA）

**ファイル**: `app/components/market/StockDetailPanel.tsx`

**機能**:
- ✅ 画面右側にスライド表示
- ✅ モーダルと同じ内容
- ✅ スムーズなアニメーション

**特徴**:
- `translate-x-full` で非表示時は右側に隠れる
- `translate-x-0` で表示時はスライドイン
- オーバーレイで背景を暗くする

**使い方**:
```tsx
<StockDetailPanel
  symbol={selectedSymbol}
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
/>
```

---

## 実装手順（初心者向け）

### ステップ1: コンポーネントファイルの作成

以下のファイルを作成しました：

1. ✅ `app/components/market/SortButtons.tsx`
2. ✅ `app/components/market/StockSparkline.tsx`
3. ✅ `app/components/market/StockTable.tsx`
4. ✅ `app/components/market/StockDetailModal.tsx`
5. ✅ `app/components/market/StockDetailPanel.tsx`

### ステップ2: MarketPage の更新

`app/market/page.tsx` を更新：

#### 2-1. インポートを追加

```typescript
import SortButtons from '../components/market/SortButtons'
import StockTable from '../components/market/StockTable'
import StockDetailModal from '../components/market/StockDetailModal'
import StockDetailPanel from '../components/market/StockDetailPanel' // パターンAを使う場合
```

#### 2-2. Stateを追加

```typescript
// ソート状態
const [activeSort, setActiveSort] = useState<{
  type: SortType
  direction: 'asc' | 'desc'
}>({
  type: 'gainers',
  direction: 'desc',
})

// 選択中の銘柄（モーダル用）
const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
const [isModalOpen, setIsModalOpen] = useState(false)

// 選択中の銘柄（パネル用 - パターンAを使う場合）
const [isPanelOpen, setIsPanelOpen] = useState(false)
```

#### 2-3. ハンドラーを追加

```typescript
// 銘柄選択時の処理
const handleSelectSymbol = (symbol: string) => {
  setSelectedSymbol(symbol)
  setIsModalOpen(true) // モーダルを開く
  // または
  // setIsPanelOpen(true) // パネルを開く
}

// モーダル/パネルを閉じる
const handleCloseModal = () => {
  setIsModalOpen(false)
  setSelectedSymbol(null)
}
```

#### 2-4. JSXを更新

```tsx
{/* 並び替えボタン */}
<SortButtons
  activeSort={activeSort}
  onSortChange={(type, direction) => setActiveSort({ type, direction })}
/>

{/* テーブル */}
<StockTable stocks={filteredStocks} onRowClick={handleSelectSymbol} />

{/* モーダル（パターンB） */}
<StockDetailModal
  symbol={selectedSymbol}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
/>

{/* パネル（パターンA） */}
<StockDetailPanel
  symbol={selectedSymbol}
  isOpen={isPanelOpen}
  onClose={handleCloseModal}
/>
```

### ステップ3: 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/market` にアクセスして確認：

1. ✅ 並び替えボタンが強調表示される
2. ✅ 各銘柄行にミニチャートが表示される
3. ✅ 行をクリックするとモーダル/パネルが表示される

---

## モックデータの定義

### Sparkline用の価格履歴データ

```typescript
// StockSparkline.tsx 内で自動生成
interface PriceData {
  date: string
  price: number
}

function generateSparklineData(basePrice: number, days: number = 5): PriceData[] {
  const data: PriceData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // ランダムな変動（±5%）
    const variation = (Math.random() - 0.5) * 0.1
    const price = basePrice * (1 + variation)
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Number(price.toFixed(2)),
    })
  }
  
  return data
}
```

### 銘柄詳細のモックデータ

```typescript
// StockDetailModal.tsx / StockDetailPanel.tsx 内で生成
interface StockDetail {
  symbol: string
  name: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  marketCap?: number
  pe?: number
  volume: number
}

function generateMockStockDetail(symbol: string): StockDetail {
  const basePrice = 100 + Math.random() * 200
  const change = (Math.random() - 0.5) * 10
  const changePercent = (change / basePrice) * 100
  
  return {
    symbol,
    name: `${symbol} Corporation`,
    currentPrice: basePrice,
    previousClose: basePrice - change,
    change,
    changePercent,
    marketCap: basePrice * 1000000,
    pe: 15 + Math.random() * 20,
    volume: Math.floor(Math.random() * 10000000),
  }
}
```

### ニュースのモックデータ

```typescript
interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url: string
}

function generateMockNews(symbol: string): NewsItem[] {
  return [
    {
      id: '1',
      title: `${symbol}が業績予想を上方修正、株価が上昇`,
      source: '日本経済新聞',
      publishedAt: new Date().toISOString(),
      url: '#',
    },
    {
      id: '2',
      title: `${symbol}の新製品発表が市場で好評`,
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      url: '#',
    },
    {
      id: '3',
      title: `${symbol}、四半期決算で増益を達成`,
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      url: '#',
    },
  ]
}
```

---

## 実データに接続する方法

### Sparklineを実データに接続

```typescript
// StockSparkline.tsx を修正

interface StockSparklineProps {
  symbol: string
  currentPrice: number
  data?: PriceData[] // 実データを渡す
}

// MarketPage または StockTable で実データを取得
useEffect(() => {
  const fetchSparklineData = async (symbol: string) => {
    try {
      const response = await fetch(`/api/stocks/${symbol}/chart?range=5d`)
      const data = await response.json()
      // data を StockSparkline に渡す
      setSparklineData(data.prices)
    } catch (error) {
      console.error('Error fetching sparkline data:', error)
    }
  }
  
  // 各銘柄のデータを取得
  stocks.forEach(stock => {
    fetchSparklineData(stock.symbol)
  })
}, [stocks])
```

### 銘柄詳細を実データに接続

```typescript
// StockDetailModal.tsx または StockDetailPanel.tsx を修正

useEffect(() => {
  if (isOpen && symbol) {
    setLoading(true)
    
    // 実データを取得
    Promise.all([
      fetch(`/api/stocks/${symbol}/overview`).then(r => r.json()),
      fetch(`/api/stocks/${symbol}/news?limit=5`).then(r => r.json()),
      fetch(`/api/stocks/${symbol}/chart?range=1y`).then(r => r.json()),
    ]).then(([overview, news, chart]) => {
      setStockDetail(overview)
      setNews(news.articles)
      setChartData(chart.data)
      setLoading(false)
    }).catch(error => {
      console.error('Error fetching stock detail:', error)
      setLoading(false)
    })
  }
}, [isOpen, symbol])
```

---

## 拡張案とアドバイス

### 短期改善

1. **ソート方向の視覚的表示**
   - 現在は↑↓アイコンで表示
   - より分かりやすいアイコンに変更可能

2. **チャート期間の切り替え**
   - Sparklineで5日/1ヶ月/3ヶ月を切り替え可能に

3. **モーダル/パネルのアニメーション**
   - フェードイン/スライドイン効果を追加

### 中期拡張

1. **複数ソート**
   - 複数の条件でソート（例: 値上がり率 → 出来高）

2. **フィルタリング機能**
   - セクター、時価総額範囲などでフィルタ

3. **カスタムビュー**
   - ユーザーが表示する列を選択可能に

### 長期拡張

1. **リアルタイム更新**
   - WebSocketで価格をリアルタイム更新
   - Sparklineも自動更新

2. **エクスポート機能**
   - CSV/Excelでエクスポート

3. **比較機能**
   - 複数の銘柄を同時に比較

### パフォーマンス最適化のアドバイス

1. **Sparklineの最適化**
   - 大量の銘柄がある場合は、表示されている行だけSparklineを描画
   - 仮想スクロールを導入

2. **データのキャッシュ**
   - 一度取得したデータはキャッシュして再利用

3. **遅延読み込み**
   - モーダル/パネルを開いたときだけ詳細データを取得

---

## CSS/スタイリングのポイント

### テーブルの見やすさ

```css
/* 行の高さ */
.py-4 /* 上下の余白 */

/* セルの余白 */
.px-4 /* 左右の余白 */

/* ホバー効果 */
.hover:bg-gray-700/30 /* ホバー時の背景色 */

/* 行の区切り */
.border-b.border-gray-700/50 /* 行の下線 */
```

### ソートボタンの強調表示

```css
/* アクティブ時 */
.bg-blue-600 /* 青背景 */
.text-white /* 白文字 */
.border-b-2.border-blue-400 /* 下線 */
.shadow-lg /* 影 */

/* 非アクティブ時 */
.bg-gray-700 /* グレー背景 */
.text-gray-300 /* グレー文字 */
.hover:bg-gray-600 /* ホバー時の色 */
```

### Sparklineのサイズ

```css
/* 固定サイズ */
.w-[120px] /* 幅120px */
.h-[40px] /* 高さ40px */
```

### 右側パネルのアニメーション

```css
/* 非表示時 */
.transform.translate-x-full /* 右側に隠れる */

/* 表示時 */
.transform.translate-x-0 /* スライドイン */

/* トランジション */
.transition-transform.duration-300.ease-in-out
```

---

## まとめ

この実装により：

- ✅ ソート中の項目が一目で分かる（強調表示）
- ✅ 各銘柄行にミニチャートが表示される
- ✅ 行クリックで詳細が表示される（モーダル or パネル）
- ✅ テーブルの見やすさが向上（適切な余白・行の高さ）
- ✅ ダークテーマに統一

**パターンA（右側パネル）とパターンB（モーダル）の両方を実装済み**なので、用途に応じて選択できます。

質問があれば、お気軽にお聞きください！

