'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import { useTheme } from '@/components/ThemeProvider'

const NAV_LINKS = [
  { label: 'Explore', href: '/' },
  { label: 'Upcoming', href: '/upcoming' },
  { label: 'Submit', href: '/submit' },
  { label: 'My Signal', href: '/my-signal' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const { user, loading, login, logout } = useAuth()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex items-center justify-between h-14 px-5 md:px-20 max-w-[1400px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="#1652F0" />
            <circle cx="12" cy="12" r="4" fill="white" />
            <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
          </svg>
          <span
            className="font-display font-bold text-base tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Sonarbot
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href)
            return (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-[0.04em] transition-colors no-underline"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Auth */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div
                className="h-7 w-16 animate-pulse"
                style={{ background: 'var(--bg-tertiary)' }}
              />
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.avatar && (
                  <img src={user.avatar} alt="" className="h-5 w-5 rounded-full" />
                )}
                <span
                  className="max-w-[100px] truncate text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {user.handle}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  title="Disconnect"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={login}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-all no-underline"
                style={{
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-dim)',
                  background: 'var(--accent-glow)',
                }}
              >
                <LogIn className="h-3 w-3" />
                Connect
              </button>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <path d="M5 5l10 10" />
                  <path d="M15 5L5 15" />
                </>
              ) : (
                <>
                  <path d="M3 5h14" />
                  <path d="M3 10h14" />
                  <path d="M3 15h14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 bg-black/50 md:hidden z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden relative z-50" style={{ borderTop: '1px solid var(--border)' }}>
            <nav
              className="px-4 py-4 space-y-1"
              style={{ background: 'var(--bg-primary)' }}
              aria-label="Mobile navigation"
            >
              {NAV_LINKS.map(link => {
                const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href)
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm uppercase tracking-wider transition-colors no-underline"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                )
              })}

              {/* Mobile auth */}
              <div className="px-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {loading ? null : user ? (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {user.avatar && (
                        <img src={user.avatar} alt="" className="h-5 w-5 rounded-full" />
                      )}
                      <span
                        className="text-[11px] uppercase tracking-[0.04em]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user.handle}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { logout(); setMobileOpen(false) }}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { login(); setMobileOpen(false) }}
                    className="flex items-center gap-1.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <LogIn className="h-3 w-3" />
                    Connect
                  </button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
