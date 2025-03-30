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
    // Disable static optimization
    disableOptimizedLoading: true,
  },
  // Disable static optimization to prevent hydration errors with useSearchParams()
  reactStrictMode: false,
  swcMinify: true,
  // Force dynamic rendering for all pages
  trailingSlash: false,
  // Force all pages to be dynamically rendered
  staticPageGenerationTimeout: 300,
  // Ensure dynamic rendering is enforced
  env: {
    NEXT_PUBLIC_FORCE_DYNAMIC: 'true',
    NEXT_FORCE_DYNAMIC: 'true',
  }
}

module.exports = withBundleAnalyzer(nextConfig)
