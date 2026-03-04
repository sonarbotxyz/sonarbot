import Link from 'next/link'
import { getAllCategories } from '../../lib/guides'

export function HomeHero() {
  const categories = getAllCategories()

  return (
    <section className="pt-36 pb-20" style={{ paddingTop: '140px', paddingBottom: '80px' }}>
      <div className="max-w-content mx-auto px-5 md:px-20">
        <div className="text-center">
          <h1 className="font-display text-hero mb-7" style={{ color: 'var(--text-primary)' }}>
            Free guides for <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>builders on Base.</span>
          </h1>

          <p
            className="text-sm leading-relaxed mx-auto mb-10"
            style={{ color: 'var(--text-secondary)', lineHeight: '1.8', maxWidth: '600px' }}
          >
            Step-by-step guides, strategies, and technical references to help you ship faster on the leading Ethereum L2. From launching tokens to deploying AI agents.
          </p>

          {/* Theme badges — clickable, scroll to section */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => {
              const catId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
              return (
                <Link
                  key={cat}
                  href={`#cat-${catId}`}
                  className="inline-flex items-center px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] transition-all no-underline"
                  style={{
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--accent-glow)',
                  }}
                  data-hover-badge
                >
                  {cat}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
