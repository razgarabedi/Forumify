
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       { // Add Vercel Avatars domain
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
      // Add other common image hosting domains if needed for rich media embedding
      // For example:
      // {
      //   protocol: 'https',
      //   hostname: 'i.imgur.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'img.youtube.com', // For YouTube thumbnails
      //   port: '',
      //   pathname: '/**',
      // }
    ],
  },
  // Enable experimental server actions
   experimental: {
    serverActions: {}, // Changed from true to {} to satisfy "Expected object" error
  },
  turbopack: {
    resolveAlias: {
      'refractor/core': 'refractor/lib/core.js',
    },
  },
  webpack: (config) => {
    // Ensure refractor subpath imports resolve correctly in bundler
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'refractor/core': require.resolve('refractor/lib/core.js'),
    };
    return config;
  },
};

export default nextConfig;
