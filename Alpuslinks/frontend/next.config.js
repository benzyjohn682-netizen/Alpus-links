/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '192.168.138.120', 'alpuslinks.net'],
  },
  experimental: {
    allowedDevOrigins: ['http://alpuslinks.net', 'http://192.168.138.120:3000', 'http://localhost:3000'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Disable webpack caching to prevent file locking issues on Windows
      config.cache = false;
      // Disable persistent caching to prevent EBUSY errors
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
        buildDependencies: {
          hash: true,
          timestamp: true,
        },
        module: {
          timestamp: true,
          hash: true,
        },
        resolve: {
          timestamp: true,
          hash: true,
        },
        resolveBuildDependencies: {
          hash: true,
          timestamp: true,
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
