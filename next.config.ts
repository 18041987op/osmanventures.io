import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // La app "duplex" vive como sitio estático en public/duplex/index.html.
      // Servimos /duplex y /duplex/ desde ese archivo sin exponer el index.html.
      { source: "/duplex", destination: "/duplex/index.html" },
      { source: "/duplex/", destination: "/duplex/index.html" },
    ];
  },
  async redirects() {
    return [
      // Si mueves el subdominio a este proyecto, las visitas viejas van a la app nueva.
      {
        source: "/:path*",
        has: [{ type: "host", value: "gastos.osmanventures.io" }],
        destination: "https://osmanventures.io/gastos/",
        permanent: false,
      },
      // Espejo para duplex: el host viejo cae al apex /duplex/.
      {
        source: "/:path*",
        has: [{ type: "host", value: "duplex.osmanventures.io" }],
        destination: "https://osmanventures.io/duplex/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
