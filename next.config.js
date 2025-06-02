/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // WebSocket support for real-time collaboration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
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
        ],
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