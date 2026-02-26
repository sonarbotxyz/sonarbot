"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
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
import type { Category } from "@/lib/mock-data";

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
];

const CATEGORY_TO_API: Record<Category, string> = {
  DeFi: "defi",
  Social: "social",
  NFT: "nft",
  Infra: "infrastructure",
  Gaming: "gaming",
  Tools: "tools",
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
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          <LogIn className="h-8 w-8 text-text-tertiary" />
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-brand)] text-xl font-bold text-text-primary">
          Sign in to Submit
        </h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Connect your wallet or sign in to submit a project to Sonarbot.
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-6 flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <LogIn className="h-4 w-4" />
          Connect to Continue
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15"
        >
          <Check className="h-8 w-8 text-success" />
        </motion.div>
        <h2 className="mt-4 font-[family-name:var(--font-brand)] text-xl font-bold text-text-primary">
          Project Submitted
        </h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
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
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}),
        },
        body: JSON.stringify({
          name: formData.get("name"),
          tagline: formData.get("tagline"),
          description: formData.get("description"),
          website_url: formData.get("website"),
          twitter_handle: formData.get("twitter"),
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface">
            <PlusCircle className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold text-text-primary">
              Submit a Project
            </h1>
            <p className="text-sm text-text-secondary">
              Add a Base ecosystem project to Sonarbot
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 space-y-6"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="rounded-xl bg-danger-muted p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary"
          >
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Aerodrome Finance"
            className="mt-1.5 h-11 w-full rounded-xl bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline"
            className="block text-sm font-medium text-text-primary"
          >
            Tagline
          </label>
          <p className="mt-0.5 text-xs text-text-tertiary">
            One sentence describing what the project does
          </p>
          <input
            id="tagline"
            name="tagline"
            type="text"
            required
            placeholder="e.g. The central trading & liquidity hub on Base"
            className="mt-1.5 h-11 w-full rounded-xl bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-primary">
            Category
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary/12 text-primary"
                    : "bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
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
            className="flex items-center gap-2 text-sm font-medium text-text-primary"
          >
            <FileText className="h-4 w-4 text-text-tertiary" />
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            placeholder="Tell us about the project. What does it do? Why does it matter for the Base ecosystem?"
            className="mt-1.5 w-full resize-none rounded-xl bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="flex items-center gap-2 text-sm font-medium text-text-primary"
          >
            <Globe className="h-4 w-4 text-text-tertiary" />
            Website URL
          </label>
          <input
            id="website"
            name="website"
            type="url"
            required
            placeholder="https://"
            className="mt-1.5 h-11 w-full rounded-xl bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Twitter */}
        <div>
          <label
            htmlFor="twitter"
            className="flex items-center gap-2 text-sm font-medium text-text-primary"
          >
            <MessageCircle className="h-4 w-4 text-text-tertiary" />
            Twitter / X Handle
          </label>
          <input
            id="twitter"
            name="twitter"
            type="text"
            placeholder="@projectname"
            className="mt-1.5 h-11 w-full rounded-xl bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Contract Address */}
        <div>
          <label
            htmlFor="contract"
            className="block text-sm font-medium text-text-primary"
          >
            Contract Address (optional)
          </label>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Main smart contract on Base, for on-chain tracking
          </p>
          <input
            id="contract"
            name="contract"
            type="text"
            placeholder="0x..."
            className="mt-1.5 h-11 w-full rounded-xl bg-surface px-4 font-[family-name:var(--font-mono)] text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6">
          <p className="text-xs text-text-tertiary">
            Projects are reviewed before appearing on Sonarbot
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
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
