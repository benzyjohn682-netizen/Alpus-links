/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '192.168.138.120', 'alpuslinks.net'],
  },
  // Remove deprecated allowedDevOrigins - this was causing the chunk loading error
  // The cross-origin issue should be handled by proper CORS configuration instead
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
    
    // Improve dynamic import handling
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          reactQuill: {
            test: /[\\/]node_modules[\\/]react-quill[\\/]/,
            name: 'react-quill',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
}

module.exports = nextConfig
