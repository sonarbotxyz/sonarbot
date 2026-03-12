"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Eye, Bell, BarChart3, Loader2 } from "lucide-react";
import Image from "next/image";
import { payWithBase } from "@/lib/base-pay";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgraded: () => void;
  accessToken: string;
}

const PRO_PERKS = [
  { icon: Eye, label: "Unlimited project watches" },
  { icon: Bell, label: "Whale alerts & priority notifications" },
  { icon: BarChart3, label: "Full analytics dashboard" },
];

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgraded,
  accessToken,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBasePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const payment = await payWithBase();

      const res = await fetch("/api/payments/base-pay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      const data = await res.json();
      if (data.success) {
        onUpgraded();
        onClose();
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Payment failed or was canceled";
      if (!msg.includes("cancel") && !msg.includes("reject")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-md p-8"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-strong)",
              }}
            >
              {/* Accent top line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--accent)" }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span
                  className="text-[10px] uppercase tracking-[0.15em] font-mono px-2 py-0.5"
                  style={{
                    color: "var(--accent)",
                    border: "1px solid var(--accent-dim)",
                    background: "var(--accent-glow)",
                  }}
                >
                  Upgrade to Pro
                </span>
              </div>

              <h2
                className="font-display text-xl font-bold tracking-tight mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                You&apos;ve hit the free limit
              </h2>
              <p
                className="text-xs font-mono mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Free accounts can watch 1 project. Upgrade to unlock the full signal feed.
              </p>

              {/* Perks */}
              <div
                className="p-4 mb-6 space-y-3"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                }}
              >
                {PRO_PERKS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 text-xs font-mono"
                  >
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "var(--accent)" }}
                    />
                    <span style={{ color: "var(--text-body)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div
                  className="mb-4 px-3 py-2 text-xs font-mono"
                  style={{
                    border: "1px solid var(--color-danger)",
                    color: "var(--color-danger)",
                    background: "rgba(239,68,68,0.06)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Base Pay button */}
              <button
                onClick={handleBasePay}
                disabled={loading}
                className="w-full py-3 text-center text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
                style={{
                  color: "#fff",
                  background: "#0000FF",
                  opacity: loading ? 0.7 : 1,
                  borderRadius: "8px",
                  height: "44px",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image
                    src="/images/BasePayWhiteLogo.png"
                    alt="Base Pay"
                    width={80}
                    height={20}
                    style={{ height: "20px", width: "auto" }}
                  />
                )}
                {loading && "Processing..."}
              </button>

              <p
                className="text-center text-[10px] font-mono mt-3"
                style={{ color: "var(--text-very-muted)" }}
              >
                $9.99 USDC/mo · No fees · Settles instantly on Base
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
