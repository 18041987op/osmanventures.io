import type { Metadata, Viewport } from "next";
import PwaSetup from "./PwaSetup";

export const metadata: Metadata = {
  title: "Control de Gastos",
  description: "Tus gastos, presupuesto y cuentas en un solo lugar.",
  manifest: "/gastos-app.webmanifest",
  applicationName: "Control de Gastos",
  appleWebApp: {
    capable: true,
    title: "Gastos",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/gastos-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/gastos-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/gastos-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#5C6BC0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function GastosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaSetup />
      {children}
    </>
  );
}
