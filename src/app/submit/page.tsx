"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Globe,
  MessageCircle,
  FileText,
  Check,
  TrendingUp,
  Users,
  Palette,
  Cpu,
  Gamepad2,
  Wrench,
  LogIn,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import type { Category } from "@/lib/types";

const categories: {
  value: Category;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "DeFi", label: "DeFi", icon: TrendingUp },
  { value: "Social", label: "Social", icon: Users },
  { value: "NFT", label: "NFT", icon: Palette },
  { value: "Infra", label: "Infra", icon: Cpu },
  { value: "Gaming", label: "Gaming", icon: Gamepad2 },
  { value: "Tools", label: "Tools", icon: Wrench },
  { value: "Meme", label: "Meme", icon: Palette },
];

const CATEGORY_TO_API: Record<Category, string> = {
  DeFi: "defi",
  Social: "social",
  NFT: "nft",
  Infra: "infrastructure",
  Gaming: "gaming",
  Tools: "tools",
  Meme: "meme",
};

export default function SubmitPage() {
  const { user, loading, login, accessToken } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");

  // Auth gate
  if (!loading && !user) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 md:px-20 py-32 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <LogIn className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
        </div>
        <h2
          className="mt-4 font-display text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Sign in to Submit
        </h2>
        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Connect your wallet or sign in to submit a project to Sonarbot.
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-6 flex h-11 items-center gap-2 px-6 text-xs uppercase tracking-[0.06em] font-semibold text-white transition-colors"
          style={{ background: "var(--accent)" }}
        >
          <LogIn className="h-4 w-4" />
          Connect to Continue
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 md:px-20 py-32 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex h-16 w-16 items-center justify-center"
          style={{ background: "var(--color-success-muted)" }}
        >
          <Check className="h-8 w-8 text-success" />
        </motion.div>
        <h2
          className="mt-4 font-display text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Project Submitted
        </h2>
        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Your project has been submitted for review. Our agents will process it
          and it will appear on Sonarbot once approved.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name: formData.get("name"),
          tagline: formData.get("tagline"),
          description: formData.get("description"),
          website_url: formData.get("website"),
          twitter_handle: formData.get("twitter"),
          contract_address: formData.get("contract"),
          category: selectedCategory
            ? CATEGORY_TO_API[selectedCategory as Category]
            : "other",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit project");
      }
    } catch {
      setError("Failed to submit project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-20 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-bold text-[10px]"
            style={{ color: "var(--accent)" }}
          >
            &gt;
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "var(--text-muted)" }}
          >
            Submit
          </span>
        </div>
        <h1
          className="mt-3 font-display text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Submit a Project
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Add a Base ecosystem project to Sonarbot
        </p>
      </motion.div>

      <div className="h-rule mt-8 mb-0" data-label="Form" />

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 max-w-2xl space-y-6"
        onSubmit={handleSubmit}
      >
        {error && (
          <div
            className="p-3 text-sm"
            style={{
              background: "var(--color-danger-muted)",
              color: "var(--color-danger)",
              border: "1px solid var(--color-danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Aerodrome Finance"
            className="mt-2 h-11 w-full px-4 text-sm font-mono outline-none transition-colors focus:border-[var(--accent)]"
            style={inputStyle}
          />
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline"
            className="block text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Tagline
          </label>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: "var(--text-very-muted)" }}
          >
            One sentence describing what the project does
          </p>
          <input
            id="tagline"
            name="tagline"
            type="text"
            required
            placeholder="e.g. The central trading & liquidity hub on Base"
            className="mt-2 h-11 w-full px-4 text-sm font-mono outline-none transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div>
          <label
            className="block text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Category
          </label>
          <div className="mt-2 grid grid-cols-3 gap-px sm:grid-cols-6" style={{ background: "var(--border)" }}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className="flex flex-col items-center gap-1.5 p-3 text-[11px] font-medium transition-all"
                style={{
                  background:
                    selectedCategory === cat.value
                      ? "var(--accent-glow)"
                      : "var(--bg-primary)",
                  color:
                    selectedCategory === cat.value
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }}
              >
                <cat.icon className="h-5 w-5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <FileText className="h-3 w-3" />
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            placeholder="Tell us about the project. What does it do? Why does it matter for the Base ecosystem?"
            className="mt-2 w-full resize-none p-4 text-sm font-mono outline-none transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <Globe className="h-3 w-3" />
            Website URL
          </label>
          <input
            id="website"
            name="website"
            type="url"
            required
            placeholder="https://"
            className="mt-2 h-11 w-full px-4 text-sm font-mono outline-none transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Twitter */}
        <div>
          <label
            htmlFor="twitter"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <MessageCircle className="h-3 w-3" />
            Twitter / X Handle
          </label>
          <input
            id="twitter"
            name="twitter"
            type="text"
            placeholder="@projectname"
            className="mt-2 h-11 w-full px-4 text-sm font-mono outline-none transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Contract Address */}
        <div>
          <label
            htmlFor="contract"
            className="block text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Contract Address (optional)
          </label>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: "var(--text-very-muted)" }}
          >
            Main smart contract on Base, for on-chain tracking
          </p>
          <input
            id="contract"
            name="contract"
            type="text"
            placeholder="0x..."
            className="mt-2 h-11 w-full px-4 text-sm font-mono outline-none transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Submit */}
        <div
          className="flex items-center justify-between pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            Projects are reviewed before appearing on Sonarbot
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 items-center gap-2 px-6 text-xs uppercase tracking-[0.06em] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Submit Project
          </button>
        </div>
      </motion.form>
    </div>
  );
}
