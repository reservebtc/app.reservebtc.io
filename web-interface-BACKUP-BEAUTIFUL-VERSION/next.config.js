/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty');
    return config;
  },
  transpilePackages: ['framer-motion'],
}

module.exports = nextConfig