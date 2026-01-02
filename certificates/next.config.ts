import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gerar build standalone para Docker
  output: "standalone",

  // Excluir pacotes nativos do bundle (necessário para @napi-rs/canvas)
  serverExternalPackages: ["@napi-rs/canvas"],

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
