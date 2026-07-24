/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 15 top-level serverExternalPackages option
  serverExternalPackages: [],

  // Disable default unoptimized images warning if using direct R2/SVG
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
