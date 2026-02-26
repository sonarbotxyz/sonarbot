"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, Menu, X, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/submit", label: "Submit" },
  { href: "/my-signal", label: "My Signal" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, login, logout } = useAuth();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Radio className="h-4 w-4 text-primary transition-colors group-hover:text-primary-hover" />
            <span className="font-[family-name:var(--font-brand)] text-base font-bold tracking-tight text-text-primary">
              Sonarbot
            </span>
          </Link>

          {/* Desktop nav + auth */}
          <div className="hidden items-center gap-1 md:flex">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      isActive
                        ? "text-text-primary"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth button */}
            <div className="ml-3 flex items-center">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-surface" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="max-w-[120px] truncate font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                    {user.handle}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                    title="Disconnect"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={login}
                  className="flex h-8 items-center gap-2 rounded-lg bg-surface px-3.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Mobile: auth + menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {!loading && !user && (
              <button
                type="button"
                onClick={login}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-surface px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-hover"
              >
                <LogIn className="h-3.5 w-3.5" />
                Connect
              </button>
            )}
            {!loading && user && (
              <span className="max-w-[80px] truncate font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                {user.handle}
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-text-primary"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
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
              className="fixed top-0 right-0 z-50 flex h-full w-64 flex-col bg-surface p-6 pt-20"
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
                      className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile auth at bottom of slide-out */}
              {user && (
                <div className="mt-auto border-t border-border pt-4">
                  <div className="flex items-center gap-2 px-4">
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-7 w-7 rounded-full"
                      />
                    )}
                    <span className="flex-1 truncate font-[family-name:var(--font-mono)] text-sm text-text-secondary">
                      {user.handle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="mt-3 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
