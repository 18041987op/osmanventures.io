import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt =
  "Osman — Full-Stack Developer & Business Owner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 55%, #14102a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#818cf8",
            fontFamily: "monospace",
          }}
        >
          <span>~/portfolio</span>
          <span style={{ color: "#475569" }}>$</span>
          <span style={{ color: "#34d399" }}>whoami</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 150,
            fontWeight: 800,
            marginTop: 16,
            color: "#a5b4fc",
            letterSpacing: "-4px",
          }}
        >
          Osman
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 48,
            color: "#cbd5e1",
            marginTop: 8,
          }}
        >
          Full-Stack Developer&nbsp;
          <span style={{ color: "#818cf8" }}>&amp;</span>
          &nbsp;Business Owner
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            fontSize: 30,
            color: "#64748b",
          }}
        >
          <span>{siteConfig.domain}</span>
          <span>{siteConfig.location}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
