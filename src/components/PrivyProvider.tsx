"use client";

import { useState, useEffect, type ReactNode } from "react";
import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { AuthProvider } from "./AuthContext";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before mount, render without Privy
  if (!mounted || !PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <Privy
      appId={PRIVY_APP_ID}
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
