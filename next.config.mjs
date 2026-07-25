/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || '127.0.0.1:8000';
    const backendUrl = rawBackend.startsWith('http') ? rawBackend : `http://${rawBackend}`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
