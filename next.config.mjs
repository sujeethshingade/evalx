/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
    proxyClientMaxBodySize: "512mb",
  },
};

export default nextConfig;
