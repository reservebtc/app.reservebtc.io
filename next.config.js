/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    
    // Ignore backend and contracts directories during webpack compilation
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
  // Increase build timeout for static generation
  staticPageGenerationTimeout: 120,
  // Improve build performance
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig