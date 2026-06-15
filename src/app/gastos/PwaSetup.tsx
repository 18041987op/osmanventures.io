"use client";
import { useEffect } from "react";

// Registra el service worker para que la app sea instalable y abra sin señal.
export default function PwaSetup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/gastos-sw.js", { scope: "/gastos" })
        .catch(() => { /* sin SW la app sigue funcionando */ });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
