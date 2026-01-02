import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gerar build standalone para Docker
  output: "standalone",

  // Configurações de imagem (opcional)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
