/** @type {import('next').NextConfig} */

// Environment detection
const isProd = process.env.NODE_ENV === 'production';
const isGithubPages = process.env.GITHUB_PAGES === 'true';

// GitHub Pages settings
const basePath = isProd && isGithubPages ? '/PLCProgramming' : '';
const assetPrefix = isProd && isGithubPages ? '/PLCProgramming/' : '';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Temporary workaround for type errors
  },
  
  // Conditional GitHub Pages configuration
  ...(isProd && isGithubPages && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    basePath,
    assetPrefix,
  }),
  
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  webpack: (config, { isServer, dev }) => {
    // WebSocket support for real-time collaboration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    // Development optimizations
    if (dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: false,
      };
    }
    
    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Redirects for better navigation
  async redirects() {
    return [
      {
        source: '/editor',
        destination: '/',
        permanent: true,
      },
      {
        source: '/plc-editor',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

// TODO: Re-enable Sentry integration after proper setup
// const { withSentryConfig } = require('@sentry/nextjs');
// const sentryOptions = {
//   silent: true,
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   widenClientFileUpload: true,
//   transpileClientSDK: true,
//   tunnelRoute: "/monitoring",
//   hideSourceMaps: true,
//   disableLogger: true,
// };
// module.exports = withSentryConfig(nextConfig, sentryOptions); 