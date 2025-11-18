# ページタイトル自動切り替えの実装ガイド

## 📋 目次
1. [問題の原因](#問題の原因)
2. [解決方法](#解決方法)
3. [ページパス → タイトル のマッピング方法](#ページパス--タイトル-のマッピング方法)
4. [実装コード](#実装コード)
5. [実装手順（初心者向け）](#実装手順初心者向け)
6. [将来ページを追加するときのやり方](#将来ページを追加するときのやり方)

---

## 問題の原因

現在、`AppLayout.tsx`の`getPageTitle`関数でタイトルを判定していますが、以下の問題があります：

1. **パスのマッチングが不正確**: `/market`で始まるパスがすべて`/market`として扱われている
2. **デフォルト値の問題**: マッチしない場合に「ダッシュボード」が返される
3. **拡張性が低い**: 新しいページを追加するたびにif文を追加する必要がある

---

## 解決方法

**ページパスとタイトルのマッピングオブジェクトを作成**して、より柔軟で拡張しやすい設計にします。

---

## ページパス → タイトル のマッピング方法

### マッピングオブジェクトの構造

```typescript
const PAGE_TITLES: Record<string, string> = {
  '/': 'ダッシュボード',
  '/dashboard': 'ダッシュボード',
  '/market': 'マーケット（銘柄一覧）',
  '/markets': '世界の市場指数',
  '/news': 'ニュース & 分析',
  '/watchlist': 'ウォッチリスト',
  '/orders': '注文履歴',
  '/settings': '設定',
}

// 動的パス用のパターンマッチング
const DYNAMIC_PATHS: Array<{ pattern: RegExp; title: (match: RegExpMatchArray) => string }> = [
  {
    pattern: /^\/stocks\/([^/]+)$/,
    title: (match) => `${match[1]} - 銘柄詳細`
  }
]
```

### メリット

- ✅ 新しいページを追加するのが簡単（マッピングに追加するだけ）
- ✅ コードが読みやすい
- ✅ 動的パスにも対応可能
- ✅ 一箇所で管理できる

---

## 実装コード

### 1. タイトルマッピングユーティリティの作成

```typescript
// app/lib/utils/pageTitles.ts
/**
 * ページパスからタイトルを取得するユーティリティ
 */

// 静的パスのタイトルマッピング
const PAGE_TITLES: Record<string, string> = {
  '/': 'ダッシュボード',
  '/dashboard': 'ダッシュボード',
  '/market': 'マーケット（銘柄一覧）',
  '/markets': '世界の市場指数',
  '/news': 'ニュース & 分析',
  '/watchlist': 'ウォッチリスト',
  '/orders': '注文履歴',
  '/settings': '設定',
}

// 動的パス用のパターンマッチング
interface DynamicPathPattern {
  pattern: RegExp
  title: (match: RegExpMatchArray) => string
}

const DYNAMIC_PATHS: DynamicPathPattern[] = [
  {
    pattern: /^\/stocks\/([^/]+)$/,
    title: (match) => `${match[1]} - 銘柄詳細`
  },
  // 将来的に他の動的パスを追加する場合はここに追加
  // {
  //   pattern: /^\/users\/([^/]+)$/,
  //   title: (match) => `${match[1]} - ユーザー詳細`
  // }
]

/**
 * パス名からページタイトルを取得
 * @param pathname - 現在のパス名（例: '/market', '/stocks/AAPL'）
 * @returns ページタイトル
 */
export function getPageTitle(pathname: string): string {
  // パス名を正規化（クエリパラメータやハッシュを除去）
  const normalizedPath = pathname.split('?')[0].split('#')[0]

  // 1. 静的パスをチェック
  if (PAGE_TITLES[normalizedPath]) {
    return PAGE_TITLES[normalizedPath]
  }

  // 2. 動的パスをチェック
  for (const { pattern, title } of DYNAMIC_PATHS) {
    const match = normalizedPath.match(pattern)
    if (match) {
      return title(match)
    }
  }

  // 3. デフォルトタイトル（マッチしない場合）
  return 'ダッシュボード'
}

/**
 * 新しいページタイトルを追加するヘルパー関数（開発用）
 * @param path - ページパス
 * @param title - ページタイトル
 */
export function addPageTitle(path: string, title: string): void {
  PAGE_TITLES[path] = title
}
```

### 2. AppLayout.tsx の修正

```typescript
// app/components/layout/AppLayout.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '../dashboard/Sidebar'
import Header from '../dashboard/Header'
import { getPageTitle } from '../../lib/utils/pageTitles' // ← 追加

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Get active page from pathname
  const getActivePage = (): string => {
    if (pathname?.startsWith('/stocks/')) return 'stock-detail'
    if (pathname === '/watchlist' || pathname?.startsWith('/watchlist')) return 'watchlist'
    if (pathname === '/market' || pathname?.startsWith('/market')) return 'market'
    if (pathname === '/markets' || pathname?.startsWith('/markets')) return 'markets'
    if (pathname === '/news' || pathname?.startsWith('/news')) return 'news'
    if (pathname === '/orders' || pathname?.startsWith('/orders')) return 'orders'
    if (pathname === '/settings' || pathname?.startsWith('/settings')) return 'settings'
    return 'dashboard'
  }

  const activePage = getActivePage()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const effectiveSidebarOpen = !isMobile || sidebarOpen

  const handleNavigate = (page: string) => {
    setSidebarOpen(false)
  }

  // パス名からタイトルを取得（自動判定）
  const pageTitle = getPageTitle(pathname || '/') // ← 変更

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar 
        activePage={activePage} 
        onChangePage={handleNavigate}
        isOpen={effectiveSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <Header 
          pageTitle={pageTitle} // ← 変更
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  )
}

// getPageTitle関数を削除（utils/pageTitles.tsに移動）
```

---

## 実装手順（初心者向け）

### ステップ1: ユーティリティファイルの作成

1. `app/lib/utils/` フォルダが存在するか確認
   - 存在しない場合は作成: `mkdir -p app/lib/utils`

2. `app/lib/utils/pageTitles.ts` ファイルを作成
   - 上記のコードをコピー＆ペースト

### ステップ2: AppLayout.tsx の修正

1. `app/components/layout/AppLayout.tsx` を開く
2. ファイルの先頭に以下を追加:
   ```typescript
   import { getPageTitle } from '../../lib/utils/pageTitles'
   ```
3. `getPageTitle`関数を削除（70-82行目あたり）
4. `const pageTitle = getPageTitle(pathname || '/')` を追加
5. `Header`コンポーネントの`pageTitle`プロップに`pageTitle`を渡す

### ステップ3: 動作確認

1. 開発サーバーを起動: `npm run dev`
2. 各ページにアクセスしてタイトルが正しく表示されるか確認:
   - `/` → 「ダッシュボード」
   - `/market` → 「マーケット（銘柄一覧）」
   - `/markets` → 「世界の市場指数」
   - `/news` → 「ニュース & 分析」
   - `/stocks/AAPL` → 「AAPL - 銘柄詳細」

---

## 将来ページを追加するときのやり方

### 静的パスの場合

`app/lib/utils/pageTitles.ts` の `PAGE_TITLES` オブジェクトに追加するだけ：

```typescript
const PAGE_TITLES: Record<string, string> = {
  '/': 'ダッシュボード',
  '/dashboard': 'ダッシュボード',
  '/market': 'マーケット（銘柄一覧）',
  '/markets': '世界の市場指数',
  '/news': 'ニュース & 分析',
  '/watchlist': 'ウォッチリスト',
  '/orders': '注文履歴',
  '/settings': '設定',
  '/portfolio': 'ポートフォリオ', // ← 新しいページを追加
  '/analytics': '分析レポート',   // ← 新しいページを追加
}
```

### 動的パスの場合

`DYNAMIC_PATHS` 配列にパターンを追加：

```typescript
const DYNAMIC_PATHS: DynamicPathPattern[] = [
  {
    pattern: /^\/stocks\/([^/]+)$/,
    title: (match) => `${match[1]} - 銘柄詳細`
  },
  // 新しい動的パスを追加
  {
    pattern: /^\/users\/([^/]+)$/,
    title: (match) => `${match[1]} - ユーザープロフィール`
  },
  {
    pattern: /^\/reports\/([^/]+)\/([^/]+)$/,
    title: (match) => `${match[1]} - ${match[2]}レポート`
  }
]
```

### 例: `/portfolio` ページを追加する場合

1. **ページファイルを作成**: `app/portfolio/page.tsx`
2. **タイトルを追加**: `app/lib/utils/pageTitles.ts` の `PAGE_TITLES` に追加
   ```typescript
   '/portfolio': 'ポートフォリオ',
   ```
3. **サイドバーにリンクを追加**（オプション）: `app/components/dashboard/Sidebar.tsx`
   ```typescript
   { id: 'portfolio', label: 'ポートフォリオ', icon: '💼', path: '/portfolio' },
   ```

これだけで完了！タイトルは自動で表示されます。

---

## トラブルシューティング

### タイトルが「ダッシュボード」のまま表示される

1. **パス名が正しいか確認**
   - ブラウザの開発者ツールで `pathname` を確認
   - `console.log(pathname)` でログ出力

2. **マッピングが正しいか確認**
   - `PAGE_TITLES` に該当するパスが存在するか
   - パスの前後にスラッシュがないか

3. **インポートが正しいか確認**
   - `import { getPageTitle } from '../../lib/utils/pageTitles'` が正しいか
   - ファイルパスが正しいか

### 動的パスがマッチしない

1. **正規表現が正しいか確認**
   - パターンが実際のパスと一致するか
   - テスト: `pattern.test(pathname)`

2. **マッチ結果を確認**
   - `console.log(match)` でマッチ結果を確認

---

## まとめ

この実装により：

- ✅ すべてのページで適切なタイトルが自動表示される
- ✅ 新しいページを追加するのが簡単
- ✅ コードが読みやすく、保守しやすい
- ✅ 動的パスにも対応可能

質問があれば、お気軽にお聞きください！

