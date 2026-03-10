export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-20 py-16">
      {/* Hero skeleton */}
      <div className="mb-16">
        <div
          className="h-4 w-32 mb-6 animate-pulse"
          style={{ background: "var(--bg-tertiary)" }}
        />
        <div
          className="h-10 w-80 mb-4 animate-pulse"
          style={{ background: "var(--bg-tertiary)" }}
        />
        <div
          className="h-4 w-96 animate-pulse"
          style={{ background: "var(--bg-tertiary)" }}
        />
      </div>

      {/* Cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
        style={{ border: "1px solid var(--border)" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6"
            style={{ borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="h-3 w-16 mb-4 animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
            <div
              className="h-5 w-40 mb-3 animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
            <div
              className="h-3 w-full mb-2 animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
            <div
              className="h-3 w-3/4 animate-pulse"
              style={{ background: "var(--bg-tertiary)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
