export default function Logo({ size = 40, withName = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#2F5D62" />
        <path d="M14 46 L32 14 L50 46 Z" fill="#fff" />
        <path d="M24 46 L32 32 L40 46 Z" fill="#C79A4B" />
      </svg>
      {withName && <span className="text-xl font-bold tracking-wide text-ink">ANVYRA</span>}
    </span>
  );
}
