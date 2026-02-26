"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { AuthProvider } from "./AuthContext";
import type { ReactNode } from "react";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // Render without Privy if not configured (dev fallback)
    return <AuthFallback>{children}</AuthFallback>;
  }

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
}

/** Fallback when Privy is not configured — provides no-op auth context. */
function AuthFallback({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
