export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="novuBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f7dfa" />
          <stop offset="1" stopColor="#155fe0" />
        </linearGradient>
      </defs>
      {/* left stroke of the N */}
      <polygon points="12,20 38,20 38,58 12,58" fill="#1657d6" />
      <polygon points="12,20 38,20 38,32 24,20" fill="url(#novuBlue)" />
      {/* diagonal */}
      <polygon points="38,20 62,20 62,58 38,58" fill="url(#novuBlue)" />
      {/* right stroke */}
      <polygon points="62,42 88,42 88,80 62,80" fill="#22c3ea" />
      <polygon points="38,58 62,58 88,80 62,80" fill="#1657d6" />
    </svg>
  );
}

export default function Logo({ size = 28, showWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display font-semibold leading-none" style={{ fontSize: size * 0.62 }}>
          <span className="text-ink">Novu</span> <span className="text-[#1657d6]">Lab</span>
        </span>
      )}
    </div>
  );
}
