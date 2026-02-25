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
} from "lucide-react";
import type { Category } from "@/lib/mock-data";

const categories: { value: Category; label: string; icon: React.ElementType }[] = [
  { value: "DeFi", label: "DeFi", icon: TrendingUp },
  { value: "Social", label: "Social", icon: Users },
  { value: "NFT", label: "NFT", icon: Palette },
  { value: "Infra", label: "Infra", icon: Cpu },
  { value: "Gaming", label: "Gaming", icon: Gamepad2 },
  { value: "Tools", label: "Tools", icon: Wrench },
];

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <PlusCircle className="h-5 w-5 text-primary" />
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
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
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
            type="text"
            required
            placeholder="e.g. Aerodrome Finance"
            className="mt-1.5 h-11 w-full rounded-lg bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
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
            type="text"
            required
            placeholder="e.g. The central trading & liquidity hub on Base"
            className="mt-1.5 h-11 w-full rounded-lg bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
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
                className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
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
            required
            rows={5}
            placeholder="Tell us about the project. What does it do? Why does it matter for the Base ecosystem?"
            className="mt-1.5 w-full resize-none rounded-lg bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
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
            type="url"
            required
            placeholder="https://"
            className="mt-1.5 h-11 w-full rounded-lg bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
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
            type="text"
            placeholder="@projectname"
            className="mt-1.5 h-11 w-full rounded-lg bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
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
            type="text"
            placeholder="0x..."
            className="mt-1.5 h-11 w-full rounded-lg bg-surface px-4 font-[family-name:var(--font-mono)] text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between border-t border-border-subtle pt-6">
          <p className="text-xs text-text-tertiary">
            Projects are reviewed before appearing on Sonarbot
          </p>
          <button
            type="submit"
            className="flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Upload className="h-4 w-4" />
            Submit Project
          </button>
        </div>
      </motion.form>
    </div>
  );
}
