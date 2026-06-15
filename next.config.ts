import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Si mueves el subdominio a este proyecto, las visitas viejas van a la app nueva.
      {
        source: "/:path*",
        has: [{ type: "host", value: "gastos.osmanventures.io" }],
        destination: "https://osmanventures.io/gastos/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
