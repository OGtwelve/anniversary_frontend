/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 部署放开
  output: 'export',
  experimental: {
    // 允许从这些来源访问 dev 的 /_next/* 资源
    allowedDevOrigins: [
      'http://192.168.3.38:3000',
      'http://192.168.3.38',        // 如果不用端口也加上
      'http://10.101.88.143:3000',  // 服务器IP:端口（按需）
      'http://10.101.88.143',
      'http://localhost:3000',       // 本机
      'https://dxjh.zhejianglab.org'
    ],
  },
}

export default nextConfig