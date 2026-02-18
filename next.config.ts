import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'),
      new URL('https://i.imgur.com/**'),
      new URL('https://i.ibb.co/**'),
    ],
  },
};

export default nextConfig;
