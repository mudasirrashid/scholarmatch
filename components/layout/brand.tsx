import { cn } from "@/lib/cn";

/**
 * ScholarMatch brand mark.
 *
 * The glyph is a rising path resolving into a single node: many candidate
 * opportunities converging on the one that fits. It is drawn on a rounded
 * plate so it holds its shape at favicon sizes.
 *
 * `idPrefix` namespaces the gradient definition so the mark can be rendered
 * more than once per document without producing duplicate SVG ids — which
 * would also keep this a server component.
 */
export function BrandMark({
  className,
  idPrefix,
}: {
  className?: string;
  idPrefix: string;
}) {
  const gradientId = `${idPrefix}-brand-gradient`;

  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="ScholarMatch"
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="26" x2="27" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="52%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      {/* Plate */}
      <rect x="1" y="1" width="30" height="30" rx="9.5" fill={`url(#${gradientId})`} opacity="0.12" />
      <rect
        x="1.4"
        y="1.4"
        width="29.2"
        height="29.2"
        rx="9.1"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />

      {/* Converging path */}
      <path
        d="M8.6 22.2 L14 15.1 L18.1 18.4 L23.4 10.4"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Matched node */}
      <circle cx="23.4" cy="10.4" r="2.5" fill={`url(#${gradientId})`} />
    </svg>
  );
}

/** Brand lockup: mark plus wordmark. */
export function Brand({
  idPrefix,
  className,
  showWordmark = true,
}: {
  idPrefix: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark idPrefix={idPrefix} />
      {showWordmark ? (
        <span className="text-[0.9375rem] font-medium tracking-[-0.015em] text-mist-50">
          ScholarMatch
        </span>
      ) : null}
    </span>
  );
}