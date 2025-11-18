# ダッシュボード「今日のまとめページ」実装ガイド

## 📋 目次
1. [コンポーネント構成](#コンポーネント構成)
2. [実装したコンポーネント](#実装したコンポーネント)
3. [ダミーデータ（モック）の定義](#ダミーデータモックの定義)
4. [実装手順（初心者向け）](#実装手順初心者向け)
5. [実データに接続する方法](#実データに接続する方法)

---

## コンポーネント構成

```
DashboardPage (app/dashboard/page.tsx)
├── TodayHighlights (今日見るべき3つだけ)
│   ├── WorstPerformerCard (損失最大銘柄)
│   ├── TopNewsCard (重要ニュース)
│   └── NearestAlertCard (アラート接近銘柄)
├── PortfolioSummary (ポートフォリオサマリー)
├── DailyPerformance (今日の全体騰落率)
├── SectorPerformanceChart (セクター別パフォーマンス)
├── Watchlist (ウォッチリスト)
├── TodaysMovers (本日の値動き)
└── PortfolioPurposeSection (目的別ポートフォリオ)
```

---

## 実装したコンポーネント

### 1. TodayHighlights（今日見るべき3つだけ）

**ファイル**: `app/components/dashboard/TodayHighlights.tsx`

**機能**:
- 横に3枚のカードを表示（スマホでは縦並び）
- 「今日の損失が最も大きい銘柄 TOP1」
- 「重要ニュース 1本」
- 「アラートに近づいている銘柄 1つ」

**特徴**:
- カード型デザイン（moomoo風）
- クリックで詳細ページに遷移
- カラーコードで視覚的に区別

### 2. DailyPerformance（今日の全体騰落率）

**ファイル**: `app/components/dashboard/DailyPerformance.tsx`

**機能**:
- ポートフォリオ評価額を表示
- 本日の騰落率（評価額ベース）を大きく表示
- 前日終値との比較

**特徴**:
- プラス/マイナスで色分け（緑/赤）
- 大きな数字で見やすく表示

### 3. SectorPerformanceChart（セクター別パフォーマンス）

**ファイル**: `app/components/dashboard/SectorPerformanceChart.tsx`

**機能**:
- セクター別の本日の騰落率を横棒グラフで表示
- Rechartsライブラリを使用

**特徴**:
- セクターごとに色分け
- ツールチップで詳細表示
- ソート機能（高い順）

---

## ダミーデータ（モック）の定義

### TodayHighlights のモックデータ

```typescript
// 損失銘柄データ
const mockPositions: MockPosition[] = [
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    lossAmount: -1250.50,
    lossPercent: -3.2,
    currentPrice: 245.30,
  },
  // ... 他の銘柄
]

// ニュースデータ
const mockNews: MockNews[] = [
  {
    id: '1',
    title: '日銀が政策金利を維持、市場は慎重に反応',
    source: '日本経済新聞',
    publishedAt: '2024-01-15T09:30:00Z',
    url: '#',
  },
  // ... 他のニュース
]

// アラートデータ
const mockAlerts: MockAlert[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 178.50,
    alertPrice: 180.00,
    distancePercent: 0.84,
    alertType: 'PRICE_ABOVE',
  },
  // ... 他のアラート
]
```

### DailyPerformance のモックデータ

```typescript
const mockPortfolioData = {
  totalValue: 125430.50,      // ポートフォリオ評価額
  previousValue: 123200.00,   // 前日終値
  dailyChange: 2230.50,       // 本日の変動額
  dailyChangePercent: 1.81,   // 本日の変動率
}
```

### SectorPerformanceChart のモックデータ

```typescript
const mockSectorData = [
  { name: 'テクノロジー', changePercent: 2.3, color: '#3B82F6' },
  { name: '金融', changePercent: -0.8, color: '#EF4444' },
  { name: 'ヘルスケア', changePercent: 1.5, color: '#10B981' },
  // ... 他のセクター
]
```

---

## 実装手順（初心者向け）

### ステップ1: コンポーネントファイルの作成

以下の3つのファイルを作成しました：

1. ✅ `app/components/dashboard/TodayHighlights.tsx`
2. ✅ `app/components/dashboard/DailyPerformance.tsx`
3. ✅ `app/components/dashboard/SectorPerformanceChart.tsx`

### ステップ2: ダッシュボードページの更新

`app/dashboard/page.tsx` を更新して、新しいコンポーネントを追加しました。

### ステップ3: 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして確認してください。

---

## 実データに接続する方法

### TodayHighlights を実データに接続

```typescript
// TodayHighlights.tsx を修正

import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'
import { Position, Alert } from '../../lib/schema'

export default function TodayHighlights() {
  const [worstPerformer, setWorstPerformer] = useState<Position | null>(null)
  const [topNews, setTopNews] = useState<NewsArticle | null>(null)
  const [nearestAlert, setNearestAlert] = useState<Alert | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const storage = getStorageAdapter()
      
      // 1. 損失が最も大きい銘柄を取得
      const positions = await storage.getPositions()
      const today = new Date().toISOString().split('T')[0]
      
      // 本日の損益を計算
      const positionsWithDailyPL = positions.map(pos => {
        // 前日の価格を取得（実際の実装では、価格履歴から取得）
        const previousPrice = pos.currentPrice * 0.98 // 仮の計算
        const dailyChange = (pos.currentPrice - previousPrice) * pos.quantity
        const dailyChangePercent = ((pos.currentPrice - previousPrice) / previousPrice) * 100
        
        return {
          ...pos,
          dailyChange,
          dailyChangePercent,
        }
      })
      
      // 損失が最も大きいものを取得
      const worst = positionsWithDailyPL
        .filter(p => p.dailyChange < 0)
        .sort((a, b) => a.dailyChange - b.dailyChange)[0]
      
      setWorstPerformer(worst)
      
      // 2. 重要ニュースを取得
      const newsResponse = await fetch('/api/news?limit=1')
      const newsData = await newsResponse.json()
      setTopNews(newsData.articles[0])
      
      // 3. アラートに近づいている銘柄を取得
      const alerts = await storage.getAlerts({ status: 'ACTIVE' })
      // 現在価格を取得して、アラート価格との距離を計算
      // ...
    }
    
    loadData()
  }, [])
  
  // ... 残りのコード
}
```

### DailyPerformance を実データに接続

```typescript
// DailyPerformance.tsx を修正

import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'

export default function DailyPerformance() {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    previousValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      const storage = getStorageAdapter()
      const positions = await storage.getPositions()
      
      // 現在の評価額を計算
      const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
      
      // 前日の評価額を計算（実際の実装では、価格履歴から取得）
      const previousValue = positions.reduce((sum, pos) => {
        const previousPrice = pos.currentPrice * 0.98 // 仮の計算
        return sum + (previousPrice * pos.quantity)
      }, 0)
      
      const dailyChange = totalValue - previousValue
      const dailyChangePercent = previousValue > 0 
        ? (dailyChange / previousValue) * 100 
        : 0
      
      setPortfolioData({
        totalValue,
        previousValue,
        dailyChange,
        dailyChangePercent,
      })
    }
    
    loadData()
  }, [])
  
  // ... 残りのコード
}
```

### SectorPerformanceChart を実データに接続

```typescript
// SectorPerformanceChart.tsx を修正

import { getStorageAdapter } from '../../lib/storage/localStorageAdapter'

export default function SectorPerformanceChart() {
  const [sectorData, setSectorData] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const storage = getStorageAdapter()
      const positions = await storage.getPositions()
      
      // セクターごとにグループ化
      const sectorMap = new Map<string, { positions: Position[], totalValue: number }>()
      
      positions.forEach(pos => {
        // セクター情報を取得（実際の実装では、銘柄情報から取得）
        const sector = getSectorFromSymbol(pos.symbol) // 仮の関数
        
        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, { positions: [], totalValue: 0 })
        }
        
        const sectorData = sectorMap.get(sector)!
        sectorData.positions.push(pos)
        sectorData.totalValue += pos.marketValue
      })
      
      // セクターごとの騰落率を計算
      const sectorPerformance = Array.from(sectorMap.entries()).map(([sector, data]) => {
        // 前日の評価額を計算
        const previousValue = data.positions.reduce((sum, pos) => {
          const previousPrice = pos.currentPrice * 0.98 // 仮の計算
          return sum + (previousPrice * pos.quantity)
        }, 0)
        
        const change = data.totalValue - previousValue
        const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0
        
        return {
          name: sector,
          changePercent,
          color: getSectorColor(sector), // セクターごとの色を取得
        }
      })
      
      setSectorData(sectorPerformance)
    }
    
    loadData()
  }, [])
  
  // ... 残りのコード
}
```

---

## レイアウト構成

```
┌─────────────────────────────────────────────────┐
│  今日見るべき3つだけ（横3カード）                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 損失最大 │ │ 重要ニュース │ │ アラート │          │
│  └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  ポートフォリオサマリー                            │
└─────────────────────────────────────────────────┘
┌──────────────────────┐ ┌──────────────────────┐
│  今日の全体騰落率     │ │  セクター別パフォーマンス │
│                      │ │  （横棒グラフ）       │
└──────────────────────┘ └──────────────────────┘
┌──────────────────────┐ ┌──────────────────────┐
│  ウォッチリスト        │ │  本日の値動き        │
└──────────────────────┘ └──────────────────────┘
┌─────────────────────────────────────────────────┐
│  目的別ポートフォリオ                             │
└─────────────────────────────────────────────────┘
```

---

## デザインの特徴

- ✅ **ダークテーマ**: グレー系の背景色
- ✅ **カード型**: 各セクションがカードで区切られている
- ✅ **余白**: `gap-6`, `p-6` などで適切な余白を確保
- ✅ **グラデーション**: カードにグラデーション背景を適用
- ✅ **ホバー効果**: カードにホバー時のエフェクトを追加
- ✅ **レスポンシブ**: スマホでは縦並び、PCでは横並び

---

## 次のステップ

1. **実データに接続**: 上記の「実データに接続する方法」を参考に実装
2. **リアルタイム更新**: WebSocketやポーリングで価格を更新
3. **フィルタリング**: セクターや銘柄でフィルタリング機能を追加
4. **詳細表示**: カードをクリックしたときの詳細モーダル

---

## まとめ

この実装により、ダッシュボードが「今日のまとめページ」として機能します：

- ✅ 今日見るべき3つだけが一目で分かる
- ✅ ポートフォリオの全体像が把握できる
- ✅ セクター別のパフォーマンスが視覚的に分かる
- ✅ カード型で見やすく、余白をしっかり確保

質問があれば、お気軽にお聞きください！

