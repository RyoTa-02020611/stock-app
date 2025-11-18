'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '../dashboard/Sidebar'
import Header from '../dashboard/Header'
import ErrorBoundary from '../common/ErrorBoundary'
import { getPageTitle } from '../../lib/utils/pageTitles'

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
    // Navigation will be handled by Next.js Link components in Sidebar
    setSidebarOpen(false)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Sidebar 
          activePage={activePage} 
          onChangePage={handleNavigate}
          isOpen={effectiveSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="lg:ml-64">
          <Header 
            pageTitle={getPageTitle(pathname || '/')}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="pt-16 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

