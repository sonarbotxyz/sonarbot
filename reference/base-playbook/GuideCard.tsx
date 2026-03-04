import Link from 'next/link'
import type { Guide } from '../../lib/types'

export function GuideCard({
  guide,
  index = 0,
}: {
  guide: Guide
  index?: number
}) {
  const num = String(index + 1).padStart(3, '0')

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="guide-card flex flex-col gap-5 cursor-pointer transition-all duration-300 no-underline"
      style={{
        background: 'var(--bg-primary)',
        padding: '36px 32px',
        color: 'inherit',
      }}
    >
      {/* Card number */}
      <div
        className="text-[10px] tracking-[0.15em]"
        style={{ color: 'var(--text-very-muted)', fontVariantNumeric: 'tabular-nums' }}
      >
        {num}
      </div>

      {/* Category tag */}
      <div
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase w-fit px-2.5 py-1"
        style={{
          color: 'var(--accent)',
          border: '1px solid var(--accent-dim)',
          background: 'var(--accent-glow)',
        }}
      >
        {guide.frontmatter.category}
      </div>

      {/* Title */}
      <div
        className="font-display text-xl font-semibold leading-snug"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
      >
        {guide.frontmatter.title}
      </div>

      {/* Description */}
      {guide.frontmatter.description && (
        <div className="text-[13px] leading-relaxed flex-grow" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {guide.frontmatter.description}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-4 text-[11px]"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {guide.readTime} read
        </div>
        <div className="transition-all duration-300 card-arrow" style={{ color: 'var(--text-very-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>

    </Link>
  )
}
