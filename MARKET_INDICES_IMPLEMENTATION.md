# 世界の市場指数とニュース機能の実装ガイド

## 📋 目次
1. [必要APIと代替案](#必要apiと代替案)
2. [アプリの構成図](#アプリの構成図)
3. [ディレクトリ構成](#ディレクトリ構成)
4. [React（フロント）最小サンプルコード](#reactフロント最小サンプルコード)
5. [Node.js（バックエンド）最小サンプルコード](#nodejsバックエンド最小サンプルコード)
6. [APIキーの安全な扱い方](#apiキーの安全な扱い方)
7. [実装手順（初心者向け）](#実装手順初心者向け)
8. [改善案・拡張案](#改善案拡張案)

---

## 1. 必要APIと代替案

### 市場指数データ取得

#### 推奨API（優先順位順）

1. **Yahoo Finance API（無料・推奨）**
   - ✅ 無料
   - ✅ 多くの指数に対応
   - ✅ リアルタイムデータ
   - ⚠️ 非公式API（仕様変更の可能性あり）
   - エンドポイント例: `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC` (S&P500)

2. **Alpha Vantage（無料・有料プランあり）**
   - ✅ 公式API
   - ✅ 安定している
   - ⚠️ 無料プランは1日500リクエストまで
   - エンドポイント: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=YOUR_KEY`

3. **Polygon.io（有料・無料トライアルあり）**
   - ✅ 高品質データ
   - ✅ リアルタイム対応
   - ⚠️ 有料（月額$29〜）
   - エンドポイント: `https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apikey=YOUR_KEY`

4. **Finnhub（無料・有料プランあり）**
   - ✅ 無料プランあり（1分60リクエスト）
   - ✅ グローバル市場対応
   - エンドポイント: `https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY`

#### 代替案（フォールバック）

- **12Data API**: 無料プランあり
- **IEX Cloud**: 無料プランあり
- **MarketStack**: 無料プランあり

### ニュース取得

1. **NewsAPI（無料・有料プランあり）**
   - ✅ 無料プランあり（1日100リクエスト）
   - ✅ カテゴリ別取得可能
   - ✅ 多言語対応
   - エンドポイント: `https://newsapi.org/v2/everything?q=stock&language=ja&apiKey=YOUR_KEY`

2. **Alpha Vantage News Sentiment**
   - ✅ センチメント分析付き
   - ⚠️ 無料プランは制限あり

3. **Finnhub News**
   - ✅ 金融ニュース特化
   - ✅ 無料プランあり

4. **Yahoo Finance RSS**
   - ✅ 完全無料
   - ⚠️ RSS形式（パースが必要）

### AI要約（OpenAI API）

- **OpenAI GPT-4 / GPT-3.5-turbo**
  - ✅ 高品質な要約
  - ⚠️ 有料（$0.002/1Kトークン程度）
  - エンドポイント: `https://api.openai.com/v1/chat/completions`

---

## 2. アプリの構成図

```
┌─────────────────────────────────────────────────────────┐
│                    ユーザー（ブラウザ）                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js フロントエンド（React）              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 市場指数ページ │  │ ニュースページ │  │ お気に入り   │ │
│  │              │  │              │  │ ニュース     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ APIリクエスト
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Next.js API Routes（バックエンド）             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ /api/indices │  │ /api/news    │  │ /api/ai      │ │
│  │              │  │              │  │ /summarize   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 外部API呼び出し
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   外部APIサービス                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │Yahoo Finance │  │  NewsAPI     │  │  OpenAI API  │ │
│  │Alpha Vantage │  │  Finnhub     │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### データフロー

1. **市場指数データ取得**
   - ユーザーが市場指数ページを開く
   - フロントエンドが `/api/indices` にリクエスト
   - バックエンドがYahoo Finance APIからデータ取得
   - データを整形してフロントエンドに返す
   - カード型UIで表示

2. **ニュース取得・要約**
   - ユーザーがニュースページを開く
   - フロントエンドが `/api/news?category=finance` にリクエスト
   - バックエンドがNewsAPIからニュース取得
   - 必要に応じてOpenAI APIで要約生成
   - カード型UIで表示

3. **お気に入り銘柄のニュース**
   - ユーザーがお気に入り銘柄を設定
   - フロントエンドが `/api/news/favorites` にリクエスト
   - バックエンドが各銘柄のニュースを取得・統合
   - 時系列で表示

---

## 3. ディレクトリ構成

```
app/
├── app/
│   ├── api/
│   │   ├── indices/
│   │   │   └── route.ts              # 市場指数API
│   │   ├── news/
│   │   │   ├── route.ts              # ニュース一覧API
│   │   │   ├── categories/
│   │   │   │   └── [category]/
│   │   │   │       └── route.ts     # カテゴリ別ニュースAPI
│   │   │   └── favorites/
│   │   │       └── route.ts          # お気に入り銘柄ニュースAPI
│   │   └── ai/
│   │       └── summarize/
│   │           └── route.ts          # AI要約API
│   │
│   ├── components/
│   │   ├── markets/
│   │   │   ├── MarketIndexCard.tsx   # 市場指数カード
│   │   │   ├── MarketIndicesGrid.tsx # 市場指数グリッド
│   │   │   └── MarketHeatmap.tsx     # 市場ヒートマップ（オプション）
│   │   │
│   │   ├── news/
│   │   │   ├── NewsCard.tsx          # ニュースカード
│   │   │   ├── NewsGrid.tsx          # ニュースグリッド
│   │   │   ├── NewsCategoryTabs.tsx  # カテゴリタブ
│   │   │   ├── NewsSummary.tsx       # AI要約表示
│   │   │   └── FavoriteNewsFeed.tsx  # お気に入りニュースフィード
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx   # ローディング
│   │       └── ErrorMessage.tsx      # エラー表示
│   │
│   ├── markets/
│   │   └── page.tsx                  # 市場指数ページ
│   │
│   ├── news/
│   │   ├── page.tsx                  # ニュース一覧ページ
│   │   └── [category]/
│   │       └── page.tsx              # カテゴリ別ニュースページ
│   │
│   ├── favorites/
│   │   └── news/
│   │       └── page.tsx              # お気に入りニュースページ
│   │
│   └── lib/
│       ├── api/
│       │   ├── indicesClient.ts     # 市場指数APIクライアント
│       │   ├── newsClient.ts        # ニュースAPIクライアント（既存を拡張）
│       │   └── aiClient.ts          # OpenAI APIクライアント
│       │
│       └── types/
│           ├── indices.ts           # 市場指数の型定義
│           └── news.ts              # ニュースの型定義（既存を拡張）
│
├── .env.local                        # 環境変数（APIキー）
├── .env.example                      # 環境変数テンプレート
└── package.json
```

---

## 4. React（フロント）最小サンプルコード

### 市場指数カードコンポーネント

```typescript
// app/components/markets/MarketIndexCard.tsx
'use client'

import { useEffect, useState } from 'react'

interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  region: string
  lastUpdate: string
}

interface MarketIndexCardProps {
  index: MarketIndex
}

export default function MarketIndexCard({ index }: MarketIndexCardProps) {
  const isPositive = index.change >= 0

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{index.name}</h3>
          <p className="text-gray-400 text-sm">{index.symbol}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isPositive 
            ? 'bg-green-900/30 text-green-400 border border-green-700' 
            : 'bg-red-900/30 text-red-400 border border-red-700'
        }`}>
          {index.region}
        </div>
      </div>

      {/* 価格 */}
      <div className="mb-4">
        <p className="text-white text-3xl font-bold mb-1">
          {index.price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(index.change).toFixed(2)}
          </span>
          <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* フッター */}
      <div className="text-xs text-gray-500">
        最終更新: {new Date(index.lastUpdate).toLocaleTimeString('ja-JP')}
      </div>
    </div>
  )
}
```

### 市場指数グリッドコンポーネント

```typescript
// app/components/markets/MarketIndicesGrid.tsx
'use client'

import { useEffect, useState } from 'react'
import MarketIndexCard from './MarketIndexCard'

interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  region: string
  lastUpdate: string
}

export default function MarketIndicesGrid() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/indices')
        if (!response.ok) throw new Error('データの取得に失敗しました')
        
        const data = await response.json()
        setIndices(data.indices || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchIndices()
    // 30秒ごとに更新
    const interval = setInterval(fetchIndices, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {indices.map((index) => (
        <MarketIndexCard key={index.symbol} index={index} />
      ))}
    </div>
  )
}
```

### ニュースカードコンポーネント

```typescript
// app/components/news/NewsCard.tsx
'use client'

import { useState } from 'react'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  language: 'ja' | 'en'
  sentiment?: 'positive' | 'negative' | 'neutral'
  summary?: string
}

interface NewsCardProps {
  article: NewsArticle
  onSummarize?: (articleId: string) => void
}

export default function NewsCard({ article, onSummarize }: NewsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const handleSummarize = async () => {
    if (!onSummarize || article.summary) return
    
    setIsSummarizing(true)
    try {
      await onSummarize(article.id)
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl">
      {/* カテゴリバッジ */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-semibold">
          {article.category}
        </span>
        {article.sentiment && (
          <span className={`px-2 py-1 rounded text-xs ${
            article.sentiment === 'positive' 
              ? 'bg-green-900/30 text-green-400' 
              : article.sentiment === 'negative'
              ? 'bg-red-900/30 text-red-400'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {article.sentiment === 'positive' ? '好材料' : article.sentiment === 'negative' ? '懸念材料' : '中立'}
          </span>
        )}
        <span className="text-xs text-gray-500">{article.language === 'ja' ? '🇯🇵' : '🇺🇸'}</span>
      </div>

      {/* タイトル */}
      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* 説明 */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
        {article.description}
      </p>

      {/* AI要約 */}
      {article.summary && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
          <p className="text-blue-300 text-sm font-semibold mb-2">🤖 AI要約</p>
          <p className="text-gray-300 text-sm">{article.summary}</p>
        </div>
      )}

      {/* アクション */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span>{article.source}</span>
          <span className="mx-2">•</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('ja-JP')}</span>
        </div>
        <div className="flex gap-2">
          {!article.summary && (
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50"
            >
              {isSummarizing ? '要約中...' : '要約'}
            </button>
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium"
          >
            読む →
          </a>
        </div>
      </div>
    </div>
  )
}
```

### ニュースページ

```typescript
// app/news/page.tsx
'use client'

import { useEffect, useState } from 'react'
import NewsCard from '../components/news/NewsCard'
import NewsCategoryTabs from '../components/news/NewsCategoryTabs'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  language: 'ja' | 'en'
  sentiment?: 'positive' | 'negative' | 'neutral'
  summary?: string
}

const CATEGORIES = [
  { id: 'all', label: 'すべて', icon: '📰' },
  { id: 'finance', label: '株式/金融', icon: '💹' },
  { id: 'tech', label: 'テック', icon: '💻' },
  { id: 'macro', label: 'マクロ経済', icon: '🌍' },
  { id: 'company', label: '企業ニュース', icon: '🏢' },
  { id: 'global', label: '国際情勢', icon: '🌐' },
]

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const url = selectedCategory === 'all'
          ? '/api/news'
          : `/api/news/categories/${selectedCategory}`
        
        const response = await fetch(url)
        if (!response.ok) throw new Error('ニュースの取得に失敗しました')
        
        const data = await response.json()
        setArticles(data.articles || [])
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [selectedCategory])

  const handleSummarize = async (articleId: string) => {
    try {
      const response = await fetch(`/api/ai/summarize?articleId=${articleId}`)
      if (!response.ok) throw new Error('要約の生成に失敗しました')
      
      const data = await response.json()
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, summary: data.summary }
          : article
      ))
    } catch (error) {
      console.error('Error summarizing article:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">世界のニュース</h1>
        
        <NewsCategoryTabs
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-20 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onSummarize={handleSummarize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 5. Node.js（バックエンド）最小サンプルコード

### 市場指数API

```typescript
// app/api/indices/route.ts
import { NextResponse } from 'next/server'

interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  region: string
  lastUpdate: string
}

// 主要市場指数のシンボル定義
const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', region: '🇺🇸 米国' },
  { symbol: '^IXIC', name: 'NASDAQ', region: '🇺🇸 米国' },
  { symbol: '^DJI', name: 'ダウ平均', region: '🇺🇸 米国' },
  { symbol: '^N225', name: '日経225', region: '🇯🇵 日本' },
  { symbol: '^FTSE', name: 'FTSE 100', region: '🇬🇧 英国' },
  { symbol: '^GDAXI', name: 'DAX', region: '🇩🇪 ドイツ' },
  { symbol: '000001.SS', name: '上海総合', region: '🇨🇳 中国' },
  { symbol: '^HSI', name: 'ハンセン指数', region: '🇭🇰 香港' },
  { symbol: '^KS11', name: 'KOSPI', region: '🇰🇷 韓国' },
]

/**
 * Yahoo Financeから市場指数データを取得
 */
async function fetchIndexFromYahoo(symbol: string): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 10 }, // 10秒キャッシュ
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol}`)
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || price
    const change = price - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    const indexInfo = INDICES.find(i => i.symbol === symbol)
    
    return {
      symbol,
      name: indexInfo?.name || symbol,
      price,
      change,
      changePercent,
      region: indexInfo?.region || 'Unknown',
      lastUpdate: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return null
  }
}

export async function GET() {
  try {
    // すべての指数を並列取得
    const promises = INDICES.map(index => fetchIndexFromYahoo(index.symbol))
    const results = await Promise.all(promises)
    
    // nullを除外
    const indices = results.filter((index): index is MarketIndex => index !== null)

    return NextResponse.json({
      success: true,
      indices,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Indices API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '市場指数の取得に失敗しました',
        indices: [],
      },
      { status: 500 }
    )
  }
}
```

### ニュースAPI（カテゴリ別）

```typescript
// app/api/news/categories/[category]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  language: 'ja' | 'en'
  sentiment?: 'positive' | 'negative' | 'neutral'
}

const NEWS_API_KEY = process.env.NEWS_API_KEY

/**
 * NewsAPIからニュースを取得
 */
async function fetchNewsFromNewsAPI(
  category: string,
  language: 'ja' | 'en' = 'ja'
): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY is not set, using fallback')
    return []
  }

  try {
    // カテゴリに応じたクエリを設定
    const queries: Record<string, string> = {
      finance: 'stock market OR finance OR investment',
      tech: 'technology OR tech OR AI OR software',
      macro: 'economy OR economic OR GDP OR inflation',
      company: 'company OR earnings OR corporate',
      global: 'international OR global OR world news',
    }

    const query = queries[category] || 'news'
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 300 }, // 5分キャッシュ
    })

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return (data.articles || []).map((article: any, index: number) => ({
      id: `newsapi_${index}_${Date.now()}`,
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt || new Date().toISOString(),
      category,
      language,
      sentiment: analyzeSentiment(article.title + ' ' + (article.description || '')),
    }))
  } catch (error) {
    console.error('NewsAPI error:', error)
    return []
  }
}

/**
 * 簡易センチメント分析
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase()
  const positiveKeywords = ['growth', 'profit', 'gain', 'rise', 'up', '成長', '増益', '上昇']
  const negativeKeywords = ['loss', 'decline', 'fall', 'down', 'risk', '減益', '下落', '懸念']

  let positiveCount = 0
  let negativeCount = 0

  positiveKeywords.forEach(kw => {
    if (lowerText.includes(kw)) positiveCount++
  })
  negativeKeywords.forEach(kw => {
    if (lowerText.includes(kw)) negativeCount++
  })

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = params.category
    const searchParams = request.nextUrl.searchParams
    const language = (searchParams.get('language') || 'ja') as 'ja' | 'en'

    // 日本語と英語のニュースを両方取得
    const [jaNews, enNews] = await Promise.all([
      fetchNewsFromNewsAPI(category, 'ja'),
      language === 'en' ? fetchNewsFromNewsAPI(category, 'en') : [],
    ])

    // 統合して時系列でソート
    const allNews = [...jaNews, ...enNews].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    return NextResponse.json({
      success: true,
      articles: allNews,
      count: allNews.length,
    })
  } catch (error: any) {
    console.error('News category API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'ニュースの取得に失敗しました',
        articles: [],
      },
      { status: 500 }
    )
  }
}
```

### AI要約API

```typescript
// app/api/ai/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const articleId = searchParams.get('articleId')
    const articleText = searchParams.get('text') // ニュース本文

    if (!articleId || !articleText) {
      return NextResponse.json(
        { error: 'articleId and text are required' },
        { status: 400 }
      )
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // OpenAI APIで要約生成
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは金融ニュースの要約専門家です。ニュース記事を簡潔に要約してください。',
          },
          {
            role: 'user',
            content: `以下のニュース記事を3-5文で要約してください：\n\n${articleText}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('AI summarize error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '要約の生成に失敗しました',
      },
      { status: 500 }
    )
  }
}
```

---

## 6. APIキーの安全な扱い方

### 環境変数の設定

1. **`.env.local` ファイルを作成**（Gitにコミットしない）

```bash
# .env.local
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
```

2. **`.env.example` ファイルを作成**（テンプレート）

```bash
# .env.example
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
```

3. **`.gitignore` に追加**

```gitignore
# .gitignore
.env.local
.env*.local
```

### バックエンドでの使用

```typescript
// ✅ 正しい方法（サーバーサイドのみ）
const apiKey = process.env.NEWS_API_KEY

// ❌ 間違った方法（クライアントサイドに公開される）
const apiKey = 'hardcoded_key' // 絶対にしない！
```

### Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 変数名と値を追加
5. 環境（Production, Preview, Development）を選択

---

## 7. 実装手順（初心者向け）

### ステップ1: 環境変数の設定

```bash
# プロジェクトルートで .env.local を作成
touch .env.local

# エディタで開いて、APIキーを追加
# NEWS_API_KEY=...
# OPENAI_API_KEY=...
```

### ステップ2: 型定義の作成

```bash
# ディレクトリを作成
mkdir -p app/lib/types

# 型定義ファイルを作成
touch app/lib/types/indices.ts
touch app/lib/types/news.ts
```

### ステップ3: APIルートの実装

1. `app/api/indices/route.ts` を作成（上記コードをコピー）
2. `app/api/news/categories/[category]/route.ts` を作成
3. `app/api/ai/summarize/route.ts` を作成

### ステップ4: コンポーネントの実装

1. `app/components/markets/MarketIndexCard.tsx` を作成
2. `app/components/markets/MarketIndicesGrid.tsx` を作成
3. `app/components/news/NewsCard.tsx` を作成
4. `app/components/news/NewsCategoryTabs.tsx` を作成

### ステップ5: ページの作成

1. `app/markets/page.tsx` を作成
2. `app/news/page.tsx` を作成（既存を更新）

### ステップ6: テスト

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで確認
# http://localhost:3000/markets
# http://localhost:3000/news
```

---

## 8. 改善案・拡張案

### 短期改善

1. **キャッシュの最適化**
   - RedisやVercel KVでキャッシュ
   - レスポンス時間の短縮

2. **エラーハンドリングの強化**
   - フォールバックAPIの実装
   - ユーザーフレンドリーなエラーメッセージ

3. **パフォーマンス最適化**
   - 画像の最適化
   - 無限スクロールの実装

### 中期拡張

1. **リアルタイム更新**
   - WebSocketでリアルタイム価格更新
   - Server-Sent Events (SSE) の実装

2. **高度な分析機能**
   - 市場相関分析
   - テクニカル指標の表示

3. **パーソナライゼーション**
   - ユーザーごとのカスタムダッシュボード
   - 通知設定

### 長期拡張

1. **AI機能の強化**
   - ニュースの自動分類
   - 投資判断のサポート

2. **ソーシャル機能**
   - ニュースのシェア
   - コメント機能

3. **モバイルアプリ**
   - React Nativeでのモバイルアプリ開発
   - プッシュ通知

---

## 📝 まとめ

この実装ガイドに従って、段階的に機能を追加していけば、moomooのような見やすいカード型デザインの統合株式アプリが完成します。

まずは市場指数の表示から始めて、徐々にニュース機能を追加していくことをおすすめします。

質問があれば、お気軽にお聞きください！

