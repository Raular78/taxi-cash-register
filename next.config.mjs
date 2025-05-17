/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desactivar el modo estricto para evitar dobles renderizados
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
