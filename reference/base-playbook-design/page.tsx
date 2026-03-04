import Link from 'next/link'
import { getAllGuides, getAllCategories } from '../../lib/guides'
import { getCategoryColor, CATEGORY_ORDER } from '../../lib/types'
import { HomeHero } from '@/components/HomeHero'
import { HomeSections, FeaturedGuides } from '@/components/HomeSections'

export default function HomePage() {
  const guides = getAllGuides()
  const categories = getAllCategories().sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a)
    const bi = CATEGORY_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const groupedGuides: Record<string, typeof guides> = {}
  categories.forEach(cat => {
    groupedGuides[cat] = guides.filter(g => g.frontmatter.category === cat)
  })

  const categoriesData = categories.map(cat => ({
    name: cat,
    colors: getCategoryColor(cat),
    guides: groupedGuides[cat] || [],
  }))

  return (
    <>
      <HomeHero />

      <div className="h-rule" data-label="latest" />

      <FeaturedGuides guides={guides} />

      <div className="h-rule" data-label="all guides" />

      <HomeSections categoriesData={categoriesData} />

      <div className="h-rule" data-label="start building" />

      {/* CTA Section */}
      <section className="py-24 md:py-28">
        <div className="max-w-content mx-auto px-5 md:px-20">
          <div
            className="cta-box text-center px-8 py-16 md:px-20 md:py-20"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'linear-gradient(135deg, var(--accent-glow) 0%, transparent 50%), var(--bg-secondary)',
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.2em] mb-6"
              style={{ color: 'var(--text-very-muted)' }}
            >
              Building a tool for Base?
            </div>

            <h2 className="font-display text-3xl md:text-section font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Get your product in front of builders.
            </h2>

            <p
              className="text-sm max-w-lg mx-auto mb-10"
              style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}
            >
              We write custom guides featuring your tool — step-by-step tutorials that rank on Google and live permanently in the library. Not an ad. A recommendation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/promote"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs uppercase tracking-[0.06em] font-medium no-underline transition-all duration-300"
                style={{
                  background: 'var(--accent)',
                  color: '#FFFFFF',
                }}
              >
                See sponsorship options
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <a
                href="https://x.com/0xsonarbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs uppercase tracking-[0.06em] font-medium no-underline transition-all duration-300"
                style={{
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                DM us on X
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
