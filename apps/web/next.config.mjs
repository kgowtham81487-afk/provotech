/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ees/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/evolve/learning', destination: '/evolve?tab=learning', permanent: false },
      { source: '/evolve/fitness', destination: '/evolve?tab=fitness', permanent: false },
      { source: '/evolve/projects', destination: '/evolve?tab=projects', permanent: false },
      { source: '/engage/feed', destination: '/engage?tab=for-you', permanent: false },
      { source: '/engage/communities', destination: '/engage?tab=communities', permanent: false },
      { source: '/engage/showcase', destination: '/engage?tab=showcase', permanent: false },
      { source: '/scale/opportunities', destination: '/scale', permanent: false },
    ];
  },
};

export default nextConfig;
