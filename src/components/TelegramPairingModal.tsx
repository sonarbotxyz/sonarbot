"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface TelegramPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
}

export function TelegramPairingModal({
  isOpen,
  onClose,
  accessToken,
}: TelegramPairingModalProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "generating" | "waiting" | "connected" | "error"
  >("generating");
  const [timeLeft, setTimeLeft] = useState(600);
  const [copied, setCopied] = useState(false);
  const [botUrl, setBotUrl] = useState("https://t.me/sonarwatcher_bot");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // Generate code on open
  useEffect(() => {
    if (!isOpen) return;

    setStatus("generating");
    setCode("");
    setTimeLeft(600);
    setCopied(false);

    const generateCode = async () => {
      try {
        const res = await fetch("/api/user/telegram", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.code) {
          setCode(data.code);
          setBotUrl(data.bot_url || "https://t.me/sonarwatcher_bot");
          setTimeLeft(data.expires_in || 600);
          setStatus("waiting");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    generateCode();

    return cleanup;
  }, [isOpen, accessToken, cleanup]);

  // Poll for connection status
  useEffect(() => {
    if (status !== "waiting") return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/user/telegram", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.linked && data.activated) {
          setStatus("connected");
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, accessToken]);

  // Countdown timer
  useEffect(() => {
    if (status !== "waiting") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // Auto-close on connected
  useEffect(() => {
    if (status !== "connected") return;
    cleanup();
    const timeout = setTimeout(handleClose, 2000);
    return () => clearTimeout(timeout);
  }, [status, handleClose, cleanup]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-strong)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2
                className="text-sm font-display font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--text-primary)" }}
              >
                Connect Telegram
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-6">
              {status === "generating" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2
                    className="h-6 w-6 animate-spin"
                    style={{ color: "var(--accent)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Generating code...
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <X
                    className="h-6 w-6"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Code expired or failed to generate.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("generating");
                      // Re-trigger the useEffect by toggling
                      setCode("");
                      fetch("/api/user/telegram", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                        },
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          if (data.code) {
                            setCode(data.code);
                            setTimeLeft(data.expires_in || 600);
                            setStatus("waiting");
                          } else {
                            setStatus("error");
                          }
                        })
                        .catch(() => setStatus("error"));
                    }}
                    className="h-8 px-4 text-xs uppercase tracking-[0.08em] font-medium text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {status === "waiting" && (
                <div className="flex flex-col items-center gap-5">
                  {/* Code display */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="group relative flex items-center gap-3 px-6 py-4 transition-colors"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <span
                      className="font-mono text-3xl font-bold tracking-[0.3em]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {code}
                    </span>
                    {copied ? (
                      <Check
                        className="h-5 w-5"
                        style={{ color: "#22c55e" }}
                      />
                    ) : (
                      <Copy
                        className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-secondary)" }}
                      />
                    )}
                  </button>

                  {/* Instructions */}
                  <div className="text-center space-y-2">
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-body)" }}
                    >
                      Send this code to{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        @sonarwatcher_bot
                      </span>
                    </p>
                  </div>

                  {/* Open bot button */}
                  <a
                    href={botUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 h-9 px-5 text-xs uppercase tracking-[0.08em] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    Open Bot
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Waiting indicator */}
                  <div className="flex items-center gap-2 pt-2">
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Waiting for connection...
                    </span>
                  </div>
                </div>
              )}

              {status === "connected" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      duration: 0.5,
                      bounce: 0.4,
                    }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center"
                      style={{
                        background: "rgba(34,197,94,0.15)",
                        border: "1px solid rgba(34,197,94,0.3)",
                      }}
                    >
                      <Check className="h-6 w-6" style={{ color: "#22c55e" }} />
                    </div>
                  </motion.div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#22c55e" }}
                  >
                    Connected!
                  </p>
                </div>
              )}
            </div>

            {/* Footer - countdown */}
            {status === "waiting" && (
              <div
                className="px-5 py-3 text-center"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="font-mono text-[11px]"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  Code expires in {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
