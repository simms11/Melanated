import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { securityHeaders } from './src/lib/securityHeaders'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const withPayloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

/**
 * Payload adds colour-scheme client hints (Accept-CH, Critical-CH, Vary) to every path so the
 * admin can match the system theme without a flash. Critical-CH makes Chrome retry the first
 * request to a page, and Vary splits the CDN cache, which public pages don't need. Keep them
 * on the admin only.
 */
const config: NextConfig = {
  ...withPayloadConfig,
  async headers() {
    const rules = (await withPayloadConfig.headers?.()) ?? []
    return rules.map((rule) =>
      rule.source === '/:path*' && rule.headers.some((h) => h.key === 'Critical-CH')
        ? { ...rule, source: '/admin/:path*' }
        : rule,
    )
  },
}

export default config
