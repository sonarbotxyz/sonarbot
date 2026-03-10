"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-5">
      <div
        className="text-[10px] uppercase tracking-[0.2em] mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        {">"} System Error
      </div>

      <div
        className="text-[80px] md:text-[120px] font-display font-bold leading-none"
        style={{ color: "var(--text-primary)" }}
      >
        Error
      </div>

      <p
        className="text-sm tracking-[0.04em] mt-4 mb-2 max-w-md text-center"
        style={{ color: "var(--text-secondary)" }}
      >
        {error.message || "Something went wrong."}
      </p>

      {error.digest && (
        <p
          className="text-[10px] tracking-[0.1em] mb-8"
          style={{ color: "var(--text-very-muted)" }}
        >
          Digest: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="text-xs uppercase tracking-[0.15em] px-6 py-3 transition-colors cursor-pointer"
        style={{
          border: "1px solid var(--border-strong)",
          color: "var(--accent)",
          background: "transparent",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
