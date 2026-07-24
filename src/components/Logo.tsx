import { useId } from "react";

// "OV" mark: the O ring opens at the top right so the V's rising stroke can
// escape it — Osman Ventures' initials doubling as a growth arrow. Kept as
// strokes (no text) so it stays crisp from 16px favicons up to hero sizes.
// The same geometry lives in src/app/icon.svg; keep both in sync.
export default function Logo({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="12"
          y1="52"
          x2="52"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M51.05 21A22 22 0 1 1 35.82 10.33"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M20 26 32 47 49.5 11.5"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
