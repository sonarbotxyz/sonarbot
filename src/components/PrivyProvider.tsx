"use client";

import type { ReactNode } from "react";

// Privy disabled temporarily — app ID needs to be re-validated
// TODO: Re-enable when auth is needed (Phase 2)
export function PrivyProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
