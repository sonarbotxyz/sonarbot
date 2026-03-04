import Link from 'next/link'

const footerColumns = [
  {
    title: 'Guides',
    links: [
      { label: 'All Guides', href: '/guides' },
      { label: 'Getting Started', href: '/guides?category=Getting+Started' },
      { label: 'Development', href: '/guides?category=Development' },
      { label: 'Token Launch', href: '/guides?category=Token+Launch' },
      { label: 'AI Agents', href: '/guides?category=AI+Agents' },
      { label: 'Payments', href: '/guides?category=Payments' },
      { label: 'Growth', href: '/guides?category=Growth' },
      { label: 'Strategy', href: '/guides?category=Strategy' },
    ],
  },
  {
    title: 'Base Playbook',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Promote', href: '/promote' },
    ],
  },
  {
    title: 'Sonarbot',
    links: [
      { label: 'Twitter / X', href: 'https://x.com/0xsonarbot', external: true },
      { label: 'Sonarbot App', href: 'https://sonarbot.vercel.app', external: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Base Docs', href: 'https://docs.base.org', external: true },
      { label: 'Basescan', href: 'https://basescan.org', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer role="contentinfo" style={{ borderTop: '1px solid var(--border)' }} className="py-12">
      <div className="max-w-content mx-auto px-5 md:px-20">
        {/* 4-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {footerColumns.map(col => (
            <div key={col.title}>
              <h4
                className="text-[10px] uppercase tracking-[0.15em] mb-5"
                style={{ color: 'var(--text-muted)' }}
              >
                {col.title}
              </h4>
              <div className="flex flex-col gap-2.5">
                {col.links.map(link => {
                  if ('external' in link && link.external) {
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                      >
                        {link.label}
                      </a>
                    )
                  }
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-6 text-[11px]"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-very-muted)' }}
        >
          <span>&copy; {new Date().getFullYear()} Base Playbook by Sonarbot.</span>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span style={{ color: 'var(--text-muted)' }}>playbook@base:~$</span>
            <span
              className="inline-block w-[7px] h-[14px] animate-blink"
              style={{ background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
