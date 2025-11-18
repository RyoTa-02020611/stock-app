import type { Metadata } from 'next'
import './globals.css'
import AppLayout from './components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'Stock Library - 株式取引プラットフォーム',
  description: '情報豊富な株式取引・分析プラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
