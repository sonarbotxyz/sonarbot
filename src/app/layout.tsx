import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { PrivyProvider } from "@/components/PrivyProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sonarbot.vercel.app"),
  title: "Sonarbot — Discover What's Building on Base",
  description:
    "A personalized intelligence feed for the Base ecosystem. Discover projects, watch what matters, get notified when milestones happen.",
  keywords: [
    "Base",
    "crypto",
    "blockchain",
    "DeFi",
    "NFT",
    "project discovery",
    "Base ecosystem",
    "Sonarbot",
  ],
  openGraph: {
    title: "Sonarbot — Discover What's Building on Base",
    description:
      "A personalized intelligence feed for the Base ecosystem. Discover projects, watch what matters, get notified when milestones happen.",
    siteName: "Sonarbot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonarbot — Discover What's Building on Base",
    description:
      "A personalized intelligence feed for the Base ecosystem. Discover projects, watch what matters, get notified when milestones happen.",
  },
};

// Static inline script to prevent flash of wrong theme on page load.
// Runs before React hydrates, reads localStorage / prefers-color-scheme,
// and removes the `dark` class if the user prefers light mode.
// Contains NO user input — purely static string, safe to inline.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else if(!t&&window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.remove('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline theme init — static string, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-mono min-h-screen flex flex-col relative">
        <PrivyProvider>
          <ThemeProvider>
            <div className="vertical-line left" />
            <div className="vertical-line right" />
            <Header />
            <main className="flex-1 pt-14">{children}</main>
            <Footer />
          </ThemeProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
