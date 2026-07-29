export function PageHeader({ eyebrow, title, icon, action }) {
  return (
    <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
      <div className="flex items-center gap-3.5">
        {icon && (
          <span className="w-11 h-11 rounded-xl bg-signal/12 border border-signal/25 text-signal flex items-center justify-center text-lg shrink-0">
            <i className={icon}></i>
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-mono mb-1.5">
              {eyebrow}
            </p>
          )}
          <h2 className="font-outfit text-2xl font-extrabold tracking-tight" style={{ color: "#0EA5C7" }}>{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`glass-card bg-panel border border-line rounded-xl ${className}`}>
      {children}
    </div>
  );
}

const STATUS_STYLES = {
  PENDING: "bg-amber/15 text-amber border-amber/30",
  IN_PROGRESS: "bg-signal/15 text-signal border-signal/30",
  COMPLETED: "bg-mint/15 text-mint border-mint/30",
  PENDING_REVIEW: "bg-amber/15 text-amber border-amber/30",
  REVIEWED: "bg-mint/15 text-mint border-mint/30",
  PRESENT: "bg-mint/15 text-mint border-mint/30",
  ABSENT: "bg-rose/15 text-rose border-rose/30",
  LATE: "bg-amber/15 text-amber border-amber/30",
  HALF_DAY: "bg-signal/15 text-signal border-signal/30",
  APPROVED: "bg-mint/15 text-mint border-mint/30",
  REJECTED: "bg-rose/15 text-rose border-rose/30",
};

const STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "Started",
  COMPLETED: "Complete",
  PENDING_REVIEW: "Awaiting review",
  REVIEWED: "Reviewed",
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half day",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
        STATUS_STYLES[status] || "bg-panel2 text-muted border-line"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const AVATAR_STYLES = [
  "bg-signal/15 text-signal",
  "bg-mint/15 text-mint",
  "bg-amber/15 text-amber",
  "bg-rose/15 text-rose",
  "bg-purple/15 text-purple",
];

function avatarStyle(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_STYLES[Math.abs(h) % AVATAR_STYLES.length];
}

export function Avatar({ name = "", size = "sm" }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const sizeClass = size === "md" ? "w-9 h-9 text-sm" : "w-8 h-8 text-xs";
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} rounded-full font-bold shrink-0 border border-line ${avatarStyle(name)}`}
    >
      {initials}
    </span>
  );
}

export function EmptyState({ title, hint, icon = "fa-solid fa-inbox" }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-panel2 border border-line flex items-center justify-center text-muted text-xl">
        <i className={icon}></i>
      </div>
      <p className="text-ink font-medium mb-1">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted text-sm">
      <i className="fa-solid fa-circle-notch fa-spin text-2xl text-signal"></i>
      Loading…
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex items-start gap-2.5 text-sm text-rose bg-rose/10 border border-rose/20 rounded-lg px-3.5 py-2.5">
      <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex items-start gap-2.5 text-sm text-mint bg-mint/10 border border-mint/20 rounded-lg px-3.5 py-2.5">
      <i className="fa-solid fa-circle-check mt-0.5 shrink-0"></i>
      <span>{message}</span>
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.97]";
  const variants = {
    primary: "bg-signal hover:bg-signal/90 text-ink shadow-sm hover:shadow-md hover:shadow-signal/20",
    ghost: "bg-panel2 hover:bg-line text-ink border border-line",
    danger: "bg-rose/10 hover:bg-rose/20 text-rose border border-rose/30",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

const PAGE_SIZE = 10;

export function Pagination({ page, count, hasNext, hasPrevious, onPageChange }) {
  if (count <= PAGE_SIZE) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, count);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-muted font-mono">
        {start}–{end} of {count}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="!px-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-chevron-left text-xs"></i>
        </Button>
        <span className="text-xs text-muted font-mono">
          Page {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="!px-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-chevron-right text-xs"></i>
        </Button>
      </div>
    </div>
  );
}
