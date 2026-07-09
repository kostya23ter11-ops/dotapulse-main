/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 120,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        port: '',
        pathname: '/apps/dota2/images/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.akamai.steamstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.steampowered.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.akamai.steamstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.stratz.com',
        port: '',
        pathname: '/images/dota2/**',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'clan.cloudflare.steamstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
