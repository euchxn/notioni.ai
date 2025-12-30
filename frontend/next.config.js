/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 빌드할 때 타입 에러가 나도 무시하고 배포합니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드할 때 린트 에러가 나도 무시하고 배포합니다.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;