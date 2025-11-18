/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートを有効化（APIルートは使えなくなる）
  // output: 'export',
  
  // 画像最適化を無効化（静的エクスポート時）
  images: {
    unoptimized: true,
  },
  
  // トライルングスラッシュを有効化（オプション）
  trailingSlash: true,
}

module.exports = nextConfig

