/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hosts allowed for next/image optimization. Admins can paste arbitrary
    // image URLs, so `components/SafeImage/SafeImage.js` renders anything
    // outside this list `unoptimized` instead of failing at runtime.
    // Keep its OPTIMIZED_HOSTS set in sync with this list.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
