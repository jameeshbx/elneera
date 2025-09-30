import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'images.unsplash.com', 
      'res.cloudinary.com', 
      'lh3.googleusercontent.com', 
      's.gravatar.com', 
      'localhost', 
      'trekkingb2b.vercel.app',
      'flagcdn.com'
    ],
  },
  
   // Experimental features
   experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure page extensions to include API routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'api.ts'],

  // Enable React Strict Mode
  reactStrictMode: true,

  // Configure webpack
  webpack: (config, { isServer }) => {
    return config;
  },

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

  // Configure cookies
  cookies: {
    // Add any custom cookie configuration here
  },
};

// Log configuration for debugging
console.log('Next.js config loaded with NODE_ENV:', process.env.NODE_ENV);
  
export default nextConfig;
