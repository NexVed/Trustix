import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  devIndicators: { position: "bottom-right" },
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
};

export default nextConfig;
