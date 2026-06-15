"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallCard() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    const mql = window.matchMedia("(display-mode: standalone)");
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
    setStandalone(mql.matches || navStandalone === true);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) return null; // ya está instalada / abierta como app

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
  }

  return (
    <div className="gx-panel">
      <h3 className="gx-h">📲 Instalar en tu celular</h3>
      {installed ? (
        <p className="muted" style={{ fontSize: ".88rem" }}>¡Listo! Búscala en tu pantalla de inicio como “Gastos”.</p>
      ) : deferred ? (
        <>
          <p className="muted" style={{ fontSize: ".88rem", marginBottom: 10 }}>Agrégala a tu pantalla de inicio y ábrela como una app, a pantalla completa.</p>
          <button className="gx-btn" onClick={install}>Instalar app</button>
        </>
      ) : isIOS ? (
        <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.5 }}>
          En iPhone/iPad: toca el botón <b>Compartir</b> <span style={{ fontSize: "1.05rem" }}>􀈂</span> (cuadro con flecha) en Safari y luego
          <b> “Agregar a inicio”</b>. Quedará como app a pantalla completa.
        </p>
      ) : (
        <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.5 }}>
          Abre este sitio en <b>Chrome</b> en tu teléfono y usa el menú <b>⋮ → “Instalar app”</b> (o “Agregar a pantalla de inicio”).
          Si no aparece aún, recarga la página una vez.
        </p>
      )}
    </div>
  );
}
