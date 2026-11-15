/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, distDir: process.platform === 'win32' ? '.next-build' : '.next' };
export default nextConfig;
