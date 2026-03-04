"use client";

import { type ReactNode, useState, useEffect } from "react";
import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { AuthProvider } from "@/components/AuthContext";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

function PrivyWrapper({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
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

export function PrivyProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Privy during SSR/static generation — it crashes without a valid app ID
  if (!mounted || !PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return <PrivyWrapper>{children}</PrivyWrapper>;
}
