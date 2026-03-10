import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-5">
      <div
        className="text-[10px] uppercase tracking-[0.2em] mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        {">"} Error
      </div>

      <div
        className="text-[120px] md:text-[180px] font-display font-bold leading-none"
        style={{ color: "var(--text-primary)" }}
      >
        404
      </div>

      <p
        className="text-sm tracking-[0.04em] mt-4 mb-8"
        style={{ color: "var(--text-secondary)" }}
      >
        Page not found. The signal was lost.
      </p>

      <Link
        href="/"
        className="text-xs uppercase tracking-[0.15em] px-6 py-3 transition-colors"
        style={{
          border: "1px solid var(--border-strong)",
          color: "var(--accent)",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
