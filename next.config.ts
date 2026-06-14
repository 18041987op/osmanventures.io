import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // La app de Control de Gastos vive en el proyecto gastos.osmanventures.io
      // Exponerla en el dominio principal bajo /gastos/<usuario>.
      { source: "/gastos", destination: "https://gastos.osmanventures.io/gastos" },
      { source: "/gastos/:path*", destination: "https://gastos.osmanventures.io/gastos/:path*" },
    ];
  },
};

export default nextConfig;
