import { useId } from "react";

// Terminal-window robot face: the prompt chevron rotated into a "v" (one
// happy eye, and a nod to Ventures) next to the cursor dash (the other eye,
// winking via .logo-wink). Kept as strokes so it stays crisp from 16px
// favicons up to hero sizes. The same geometry lives in src/app/icon.svg
// (static, since favicons don't animate); keep both in sync.
export default function Logo({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      width={32}
      height={32}
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
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="14"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
      />
      <path
        d="M16 27 24.5 35.5 33 27"
        stroke="#06b6d4"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39.5 31.5H49"
        stroke="#06b6d4"
        strokeWidth="5"
        strokeLinecap="round"
        className="logo-wink"
      />
    </svg>
  );
}
