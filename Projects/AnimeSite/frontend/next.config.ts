import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shikimori.one',
      },
      {
        protocol: 'https',
        hostname: 'shikimori.io',
      },
      {
        protocol: 'https',
        hostname: 'shikimori.me',
      },
      {
        protocol: 'https',
        hostname: '*.shikimori.one',
      },
      {
        protocol: 'https',
        hostname: '*.shikimori.io',
      },
      {
        protocol: 'https',
        hostname: '*.shikimori.me',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'animego.org',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
    ],
  },
};

export default nextConfig;
