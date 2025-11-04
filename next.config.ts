import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack
  experimental: {
    // Server Actions configuration
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Turbopack is enabled by default in development with 'next dev --turbo'
  // No need to configure it in next.config.ts
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Allow local images with query parameters
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Configure local image patterns
    unoptimized: true, // Disable optimization to allow query parameters
    // Add local image domains
    domains: ['localhost'],
    // Allow any path for local images
    path: '/_next/image',
    // Configure local patterns to allow query parameters
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  
  // Configure page extensions to include API routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'api.ts'],

  // Enable React Strict Mode
  reactStrictMode: true,

  // Configure headers for API routes
  async headers() {
    return [
      {
        // Match all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { 
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://your-production-domain.com' 
              : 'http://localhost:3000'
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
        ],
      },
    ];
  },
};

// Log configuration for debugging
console.log('Next.js config loaded with NODE_ENV:', process.env.NODE_ENV);
  
export default nextConfig;
