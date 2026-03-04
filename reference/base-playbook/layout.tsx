import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://baseplaybook.xyz'),
  title: {
    default: 'Base Playbook — The unfair advantage for builders on Base',
    template: '%s | Base Playbook',
  },
  description: 'The unfair advantage for builders on Base. Free guides covering development, token launches, AI agents, growth, and more.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Base Playbook',
  },
  openGraph: {
    type: 'website',
    siteName: 'Base Playbook',
    title: 'Base Playbook — The unfair advantage for builders on Base',
    description: 'The unfair advantage for builders on Base. Free guides covering development, token launches, AI agents, growth, and more.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base Playbook — The unfair advantage for builders on Base',
    description: 'The unfair advantage for builders on Base.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      'msvalidate.01': '397B5BB978B8499E5385B7179601C0D2',
    },
  },
}

// Static inline script to prevent flash of wrong theme on page load.
// This runs before React hydrates, reads localStorage/prefers-color-scheme,
// and removes the `dark` class if the user prefers light mode.
// Contains NO user input — purely static string, safe to inline.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else if(!t&&window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.remove('dark')}}catch(e){}})()` // eslint-disable-line

// Static JSON-LD structured data — no user input, safe to inline
const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Base Playbook',
  url: 'https://baseplaybook.xyz',
  description: 'The unfair advantage for builders on Base.',
  publisher: {
    '@type': 'Organization',
    name: 'Base Playbook',
    url: 'https://baseplaybook.xyz',
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${fontDisplay.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Inline theme init — static string, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-mono min-h-screen flex flex-col relative">
        {/* Static JSON-LD — no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <ThemeProvider>
          <div className="vertical-line left" />
          <div className="vertical-line right" />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
