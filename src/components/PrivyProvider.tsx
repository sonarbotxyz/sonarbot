"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { AuthProvider } from "./AuthContext";
import type { ReactNode } from "react";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId || appId === "undefined" || typeof window === "undefined") {
    // Render without Privy during SSR/prerender or if not configured
    return <AuthFallback>{children}</AuthFallback>;
  }

  try {
    return (
      <Privy
        appId={appId}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#3DD7D8",
          },
          loginMethods: ["wallet", "email", "twitter"],
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </Privy>
    );
  } catch {
    return <AuthFallback>{children}</AuthFallback>;
  }
}

/** Fallback when Privy is not configured — provides no-op auth context. */
function AuthFallback({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
