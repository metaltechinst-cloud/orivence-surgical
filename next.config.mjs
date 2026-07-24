/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For easy offline loading of generated assets
  },
};

export default nextConfig;
