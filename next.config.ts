import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly configure Turbopack
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Configure Turbopack with empty config to use webpack
  // This prevents the build error while keeping webpack as the default bundler
  turbopack: {
    // Empty config to use webpack instead
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'trekkingb2b.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'trekkingmiles-generated-itinerary.s3.eu-north-1.amazonaws.com',
      },
    ],
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
