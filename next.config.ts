import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  webpack: (config) => {
    // 禁用 canvas 以避免 PDF.js 在服务端渲染时出错
    config.resolve.alias.canvas = false;
    
    // 配置 PDF.js worker 文件
    config.resolve.alias['pdfjs-dist'] = require.resolve('pdfjs-dist');
    
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
