# マーケット画面 UI/UX 改善 実装ガイド

## 📋 目次
1. [新しい構成図](#新しい構成図)
2. [実装したコンポーネント](#実装したコンポーネント)
3. [実装手順（初心者向け）](#実装手順初心者向け)
4. [モックデータ](#モックデータ)
5. [実データに接続する方法](#実データに接続する方法)
6. [拡張案](#拡張案)

---

## 新しい構成図

```
MarketPage (app/market/page.tsx)
│
├── MarketHeader (タイトル・説明)
│
├── MarketFilters (市場フィルタ)
│   └── 市場ボタン（ALL, US, JP, EU, ASIA）
│
├── SortButtons (並び替えボタン) ← 新規
│   ├── activeSort state で管理
│   ├── アクティブ時: 青背景 + 下線 + ↑↓アイコン
│   └── 非アクティブ時: グレー背景
│
├── SearchBar (検索バー)
│
├── StockTable (銘柄テーブル) ← 新規
│   ├── StockTableHeader (テーブルヘッダー)
│   ├── StockTableRow (銘柄行)
│   │   ├── StockSparkline (ミニチャート) ← 新規
│   │   │   └── Recharts LineChart (120px × 40px)
│   │   ├── StockInfo (銘柄情報)
│   │   └── onClick → 詳細表示
│   └── StockTableFooter (件数表示)
│
└── StockDetailModal (銘柄詳細モーダル) ← 新規
    ├── StockDetailHeader (銘柄名・価格)
    ├── StockDetailChart (1D〜1Yチャート - プレースホルダー)
    ├── StockDetailMetrics (基本指標)
    └── StockDetailNews (関連ニュース)
```

---

## 実装したコンポーネント

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
const [activeSort, setActiveSort] = useState<{
  type: SortType
  direction: 'asc' | 'desc'
}>({ type: 'gainers', direction: 'desc' })
```

**スタイル**:
- アクティブ: `bg-blue-600 text-white border-b-2 border-blue-400`
- 非アクティブ: `bg-gray-700 text-gray-300 hover:bg-gray-600`

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

### 4. StockDetailModal（銘柄詳細モーダル）

**ファイル**: `app/components/market/StockDetailModal.tsx`

**機能**:
- ✅ 行クリックでモーダル表示
- ✅ 現在価格・前日比を表示
- ✅ 基本指標（時価総額、PER、出来高）
- ✅ チャートエリア（プレースホルダー）
- ✅ 関連ニュース一覧

**特徴**:
- モーダル背景クリックで閉じる
- ESCキーで閉じる（将来実装可能）
- ローディング状態の表示

---

## 実装手順（初心者向け）

### ステップ1: コンポーネントファイルの作成

以下の3つのファイルを作成しました：

1. ✅ `app/components/market/SortButtons.tsx`
2. ✅ `app/components/market/StockSparkline.tsx`
3. ✅ `app/components/market/StockTable.tsx`
4. ✅ `app/components/market/StockDetailModal.tsx`

### ステップ2: MarketPage の更新

`app/market/page.tsx` を更新：

1. **インポートを追加**:
   ```typescript
   import SortButtons from '../components/market/SortButtons'
   import StockTable from '../components/market/StockTable'
   import StockDetailModal from '../components/market/StockDetailModal'
   ```

2. **Stateを追加**:
   ```typescript
   const [activeSort, setActiveSort] = useState<{ type: SortType; direction: 'asc' | 'desc' }>({
     type: 'gainers',
     direction: 'desc',
   })
   const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
   const [isModalOpen, setIsModalOpen] = useState(false)
   ```

3. **ハンドラーを追加**:
   ```typescript
   const handleSelectSymbol = (symbol: string) => {
     setSelectedSymbol(symbol)
     setIsModalOpen(true)
   }
   ```

4. **コンポーネントを置き換え**:
   - 並び替えボタンを `<SortButtons />` に置き換え
   - テーブルを `<StockTable />` に置き換え
   - モーダルを `<StockDetailModal />` に追加

### ステップ3: 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/market` にアクセスして確認：

1. ✅ 並び替えボタンが強調表示される
2. ✅ 各銘柄行にミニチャートが表示される
3. ✅ 行をクリックするとモーダルが表示される

---

## モックデータ

### Sparkline用の価格履歴データ

```typescript
// StockSparkline.tsx 内で自動生成
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
// StockDetailModal.tsx 内で生成
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
function generateMockNews(symbol: string): NewsItem[] {
  return [
    {
      id: '1',
      title: `${symbol}が業績予想を上方修正、株価が上昇`,
      source: '日本経済新聞',
      publishedAt: new Date().toISOString(),
      url: '#',
    },
    // ... 他のニュース
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
    const response = await fetch(`/api/stocks/${symbol}/chart?range=5d`)
    const data = await response.json()
    // data を StockSparkline に渡す
  }
}, [])
```

### 銘柄詳細を実データに接続

```typescript
// StockDetailModal.tsx を修正

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
    })
  }
}, [isOpen, symbol])
```

---

## 拡張案

### 短期改善

1. **ソート方向の視覚的表示**
   - 現在は↑↓アイコンで表示
   - より分かりやすいアイコンに変更可能

2. **チャート期間の切り替え**
   - Sparklineで5日/1ヶ月/3ヶ月を切り替え可能に

3. **モーダルのアニメーション**
   - フェードイン/スライドイン効果を追加

### 中期拡張

1. **右側パネル表示（パターンA）**
   - モーダルではなく、右側にスライドで表示
   - より多くの情報を表示可能

2. **複数ソート**
   - 複数の条件でソート（例: 値上がり率 → 出来高）

3. **フィルタリング機能**
   - セクター、時価総額範囲などでフィルタ

### 長期拡張

1. **リアルタイム更新**
   - WebSocketで価格をリアルタイム更新
   - Sparklineも自動更新

2. **カスタムビュー**
   - ユーザーが表示する列を選択可能に

3. **エクスポート機能**
   - CSV/Excelでエクスポート

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

---

## まとめ

この実装により：

- ✅ ソート中の項目が一目で分かる（強調表示）
- ✅ 各銘柄行にミニチャートが表示される
- ✅ 行クリックで詳細が表示される（モーダル）
- ✅ テーブルの見やすさが向上（適切な余白・行の高さ）
- ✅ ダークテーマに統一

質問があれば、お気軽にお聞きください！

