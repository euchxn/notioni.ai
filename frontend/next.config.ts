/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 타입 에러 무시
  },
  eslint: {
    ignoreDuringBuilds: true, // 린트 에러 무시
  },
};

export default nextConfig;