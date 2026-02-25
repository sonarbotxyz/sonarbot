import Link from "next/link";
import { Radio, ExternalLink } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Discover", href: "/" },
    { label: "Upcoming", href: "/upcoming" },
    { label: "My Signal", href: "/my-signal" },
    { label: "Submit Project", href: "/submit" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API", href: "#" },
    { label: "Telegram Bot", href: "#" },
  ],
  Community: [
    { label: "Twitter", href: "#", external: true },
    { label: "Farcaster", href: "#", external: true },
    { label: "Telegram", href: "#", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
                <Radio className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-[family-name:var(--font-brand)] text-base font-bold text-text-primary">
                Sonarbot
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-tertiary">
              Your personal intelligence feed for the Base ecosystem.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
                {title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                      {"external" in link && link.external && (
                        <ExternalLink className="h-3 w-3 text-text-tertiary" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-6 sm:flex-row">
          <p className="text-xs text-text-tertiary">
            Built on Base. Powered by on-chain intelligence.
          </p>
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Sonarbot
          </p>
        </div>
      </div>
    </footer>
  );
}
