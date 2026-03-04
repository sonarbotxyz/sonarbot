import Link from 'next/link'
import { GuideCard } from './GuideCard'
import type { Guide } from '../../lib/types'

interface CategoryData {
  name: string
  colors: {
    gradient: string
    bg: string
    text: string
    border: string
    icon: string
    accent: string
    gradientFrom: string
    gradientTo: string
    lightShade: string
  }
  guides: Guide[]
}

const FEATURED_SLUGS = [
  'liquidity-strategies',
  'use-x402-as-ai-agent',
  'accept-x402-payments-merchant',
]

export function FeaturedGuides({ guides }: { guides: Guide[] }) {
  const featured = FEATURED_SLUGS
    .map(slug => guides.find(g => g.slug === slug))
    .filter((g): g is Guide => !!g)
  const latest = featured.length >= 3 ? featured : guides.slice(-3).reverse()
  if (latest.length === 0) return null

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-content mx-auto px-5 md:px-20">
        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div
            className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="font-bold" style={{ color: 'var(--accent)' }}>&gt;</span>
            Latest Guides
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-very-muted)' }}>
            Showing {latest.length} of {guides.length}
          </div>
        </div>

        {/* 3-column grid with 1px border gaps */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}
        >
          {latest.map((guide, i) => (
            <GuideCard key={guide.slug} guide={guide} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryDescription({ name }: { name: string }): string {
  const descriptions: Record<string, string> = {
    'Getting Started': 'Fundamentals for new builders on Base',
    'Development': 'Write, deploy, and verify contracts',
    'Token Launch': 'Launch and manage token projects',
    'AI Agents': 'Build autonomous onchain agents',
    'NFTs & Creators': 'Create and distribute digital assets',
    'Growth': 'Scale your project and community',
    'Strategy': 'Plan and execute for success',
    'Security': 'Protect your contracts and users',
    'Payments': 'Integrate onchain payment flows',
    'Technical': 'Deep dives into Base infrastructure',
  }
  return descriptions[name] || 'Explore guides in this category'
}

export function HomeSections({ categoriesData }: { categoriesData: CategoryData[] }) {
  let globalIndex = 0

  return (
    <section className="py-20 md:py-24">
      <div className="max-w-content mx-auto px-5 md:px-20">
        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div
            className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="font-bold" style={{ color: 'var(--accent)' }}>&gt;</span>
            All Guides by Topic
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-very-muted)' }}>
            {categoriesData.length} categories &mdash; {categoriesData.reduce((sum, c) => sum + c.guides.length, 0)} guides
          </div>
        </div>

        {/* Theme groups */}
        {categoriesData.map((cat) => {
          if (!cat.guides || cat.guides.length === 0) return null

          const startIndex = globalIndex
          globalIndex += cat.guides.length

          const catId = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

          return (
            <div
              key={cat.name}
              id={`cat-${catId}`}
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0">
                {/* Sticky left label */}
                <div
                  className="py-6 lg:py-8 lg:pr-8 lg:sticky lg:top-14 lg:self-start"
                  style={{ borderRight: '1px solid var(--border)' }}
                >
                  <h3 className="font-display text-lg font-semibold tracking-tight mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {cat.name}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {CategoryDescription({ name: cat.name })}
                  </p>
                  <div className="text-[10px] uppercase tracking-[0.1em] mt-3" style={{ color: 'var(--text-very-muted)' }}>
                    {cat.guides.length} guide{cat.guides.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Guide rows */}
                <div className="flex flex-col">
                  {cat.guides.map((guide, i) => {
                    const num = String(startIndex + i + 1).padStart(2, '0')
                    return (
                      <Link
                        key={guide.slug}
                        href={`/guides/${guide.slug}`}
                        className="theme-guide-row grid grid-cols-[60px_1fr_auto] gap-6 items-center py-5 pl-4 lg:pl-8 no-underline transition-all duration-200"
                        style={{
                          borderBottom: i < cat.guides.length - 1 ? '1px solid var(--border)' : 'none',
                          color: 'inherit',
                        }}
                      >
                        <span className="text-[11px]" style={{ color: 'var(--text-very-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {num}
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="row-title font-display text-[15px] font-medium transition-colors duration-200" style={{ color: 'var(--text-body)' }}>
                            {guide.frontmatter.title}
                          </span>
                          <span className="text-[11px] flex gap-4" style={{ color: 'var(--text-very-muted)' }}>
                            <span>{guide.readTime}</span>
                            {guide.frontmatter.difficulty && <span>{guide.frontmatter.difficulty}</span>}
                          </span>
                        </div>
                        <span
                          className="row-badge text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 transition-all duration-200"
                          style={{
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Read
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </section>
  )
}
