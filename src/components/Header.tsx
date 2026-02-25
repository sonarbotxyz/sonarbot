"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Menu,
  X,
  Compass,
  Rocket,
  PlusCircle,
  Activity,
  Wallet,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/upcoming", label: "Upcoming", icon: Rocket },
  { href: "/submit", label: "Submit", icon: PlusCircle },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 glass border-b border-border-subtle">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 transition-colors group-hover:bg-primary/20">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <span className="font-[family-name:var(--font-brand)] text-lg font-bold tracking-tight text-text-primary">
              Sonarbot
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-surface-hover"
                      style={{ zIndex: -1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/my-signal"
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                pathname === "/my-signal"
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Activity className="h-4 w-4" />
              My Signal
            </Link>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Wallet className="h-4 w-4" />
              Connect
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-text-primary md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile slide-out */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-surface p-6 pt-20"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
                <div className="my-3 h-px bg-border-subtle" />
                <Link
                  href="/my-signal"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    pathname === "/my-signal"
                      ? "bg-surface-hover text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Activity className="h-5 w-5" />
                  My Signal
                </Link>
              </nav>
              <div className="mt-auto">
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-surface-hover text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
