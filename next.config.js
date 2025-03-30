/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({})
  : (config) => config

const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Disable static optimization to prevent hydration errors with useSearchParams()
  reactStrictMode: false,
  swcMinify: true
}

module.exports = withBundleAnalyzer(nextConfig)
