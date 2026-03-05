"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";

interface User {
  handle: string;
  name: string;
  avatar: string | null;
  walletAddress?: string;
  email?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  accessToken: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    ready,
    authenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUser = useCallback(async () => {
    if (!ready) return;

    if (!authenticated || !privyUser) {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      return;
    }

    try {
      const token = await getAccessToken();
      setAccessToken(token);

      if (token) {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({
            handle: data.handle,
            name: data.name,
            avatar: data.avatar,
            walletAddress: data.wallet_address,
            email: data.email,
          });
        } else {
          // API failed — build user from Privy client data directly
          buildUserFromPrivy();
        }
      } else {
        buildUserFromPrivy();
      }
    } catch {
      buildUserFromPrivy();
    } finally {
      setLoading(false);
    }

    function buildUserFromPrivy() {
      if (!privyUser) return;

      const twitter = privyUser.linkedAccounts?.find(
        (a) => a.type === "twitter_oauth"
      ) as { username?: string; name?: string; profilePictureUrl?: string } | undefined;

      if (twitter?.username) {
        setUser({
          handle: twitter.username,
          name: twitter.name || twitter.username,
          avatar: twitter.profilePictureUrl || null,
        });
        return;
      }

      const wallet = privyUser.linkedAccounts?.find(
        (a) => a.type === "wallet"
      ) as { address?: string } | undefined;

      if (wallet?.address) {
        const short =
          wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
        setUser({
          handle: short,
          name: short,
          avatar: null,
          walletAddress: wallet.address,
        });
        return;
      }

      const email = privyUser.linkedAccounts?.find(
        (a) => a.type === "email"
      ) as { address?: string } | undefined;

      if (email?.address) {
        setUser({
          handle: email.address.split("@")[0],
          name: email.address.split("@")[0],
          avatar: null,
          email: email.address,
        });
        return;
      }
    }
  }, [ready, authenticated, privyUser, getAccessToken]);

  useEffect(() => {
    resolveUser();
  }, [resolveUser]);

  const login = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  const logout = useCallback(async () => {
    await privyLogout();
    setUser(null);
    setAccessToken(null);
  }, [privyLogout]);

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
