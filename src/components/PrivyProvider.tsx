"use client";

import type { ReactNode } from "react";
import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { AuthProvider } from "@/components/AuthContext";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // Fallback: render without auth if no app ID
    return <>{children}</>;
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#1652F0",
          logo: undefined,
        },
        loginMethods: ["wallet", "email", "twitter", "telegram"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </BasePrivyProvider>
  );
}
