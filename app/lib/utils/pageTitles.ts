/**
 * ページパスからタイトルを取得するユーティリティ
 * 
 * 使い方:
 *   import { getPageTitle } from '@/lib/utils/pageTitles'
 *   const title = getPageTitle('/market') // 'マーケット（銘柄一覧）'
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
  // 例:
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

