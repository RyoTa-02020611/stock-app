'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  activePage: string
  onChangePage: (page: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ activePage, onChangePage, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: '📊', path: '/' },
    { id: 'watchlist', label: 'ウォッチリスト', icon: '⭐', path: '/watchlist' },
    { id: 'market', label: 'マーケット', icon: '📈', path: '/market' },
    { id: 'markets', label: '市場指数', icon: '🌍', path: '/markets' },
    { id: 'news', label: 'ニュース', icon: '📰', path: '/news' },
    { id: 'orders', label: '注文履歴', icon: '📋', path: '/orders' },
    { id: 'analytics', label: '運用分析', icon: '📊', path: '/analytics' },
    { id: 'logs', label: 'ログ', icon: '📝', path: '/logs' },
    { id: 'settings', label: '設定', icon: '⚙️', path: '/settings' },
  ]

  const isActive = (itemPath: string): boolean => {
    if (itemPath === '/') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname?.startsWith(itemPath) || false
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform lg:translate-x-0 shadow-sm ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo and App Name */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066cc] rounded-lg flex items-center justify-center text-white relative overflow-hidden">
              {/* Stock Chart Logo - Rising Trend */}
              <svg
                viewBox="0 0 40 40"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background */}
                <rect width="40" height="40" rx="8" fill="#0066cc" />
                {/* Stock chart line - rising trend */}
                <path
                  d="M 6 28 L 12 24 L 18 20 L 24 16 L 30 12 L 34 8"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Upward arrow at the end */}
                <path
                  d="M 30 12 L 34 8 L 34 12 L 30 12"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Small data points */}
                <circle cx="12" cy="24" r="1.5" fill="white" />
                <circle cx="18" cy="20" r="1.5" fill="white" />
                <circle cx="24" cy="16" r="1.5" fill="white" />
                <circle cx="30" cy="12" r="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-lg">Stock Library</h1>
              <p className="text-gray-500 text-xs">取引プラットフォーム</p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.path)
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    onClick={() => {
                      onChangePage(item.id)
                      onClose?.()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      active
                        ? 'bg-[#0066cc] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2024 Stock Library
          </div>
        </div>
      </aside>
    </>
  )
}
