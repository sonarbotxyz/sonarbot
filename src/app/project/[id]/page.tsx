"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  ChevronUp,
  ExternalLink,
  Bell,
  Check,
  Circle,
  MessageSquare,
  BarChart3,
  Rocket,
  Handshake,
  Newspaper,
  Coins,
  X,
} from "lucide-react";
import { projects, upcomingProjects, type Category, type Milestone } from "@/lib/mock-data";

const categoryGradients: Record<Category, { from: string; via: string; to: string }> = {
  DeFi: { from: "#2A5DC4", via: "#1A3D94", to: "#0A1D64" },
  Social: { from: "#6B45C0", via: "#4B2590", to: "#2B0560" },
  NFT: { from: "#B83575", via: "#882050", to: "#580A30" },
  Infra: { from: "#18A870", via: "#0A7848", to: "#004828" },
  Gaming: { from: "#C88018", via: "#986010", to: "#684008" },
  Tools: { from: "#505860", via: "#383E48", to: "#202428" },
};

const milestoneTypeIcons: Record<string, React.ElementType> = {
  metrics: BarChart3,
  launch: Rocket,
  partnership: Handshake,
  update: Newspaper,
  token: Coins,
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [watching, setWatching] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const allProjects = [...projects, ...upcomingProjects];
  const project = allProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
        <p className="text-xl font-semibold text-text-primary">Project not found</p>
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to discover
        </Link>
      </div>
    );
  }

  const gradient = categoryGradients[project.category];
  const displayUpvotes = project.upvotes + (upvoted ? 1 : 0);

  return (
    <>
      <div className="min-h-screen">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative h-48 overflow-hidden sm:h-56 md:h-64"
          style={{
            background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`,
          }}
        >
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6">
            <Link
              href="/"
              className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white sm:left-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/80 uppercase backdrop-blur-sm">
                  {project.category}
                </span>
                <span className="text-xs text-white/50">{project.subcategory}</span>
              </div>
              <h1 className="mt-3 font-[family-name:var(--font-brand)] text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {project.name}
              </h1>
              <p className="mt-2 text-base text-white/70 sm:text-lg">
                {project.tagline}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Action bar — no border, subtle surface difference */}
        <div className="bg-surface-hover">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => {
                if (!watching) {
                  setShowAlertModal(true);
                }
                setWatching(!watching);
              }}
              className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all ${
                watching
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {watching ? "Watching" : "Watch"}
            </button>

            <button
              type="button"
              onClick={() => setUpvoted(!upvoted)}
              className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all ${
                upvoted
                  ? "bg-surface text-primary"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="font-[family-name:var(--font-mono)]">
                {displayUpvotes.toLocaleString()}
              </span>
            </button>

            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center gap-2 rounded-lg bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowAlertModal(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex gap-10">
            {/* Left column */}
            <div className="min-w-0 flex-1 space-y-10">
              {/* Description */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-lg font-semibold text-text-primary">About</h2>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  {project.description}
                </p>
              </motion.section>

              {/* Milestones */}
              {project.milestones.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-lg font-semibold text-text-primary">
                    Milestones
                  </h2>
                  <div className="mt-4 space-y-0">
                    {project.milestones.map((milestone, i) => (
                      <MilestoneItem
                        key={milestone.id}
                        milestone={milestone}
                        isLast={i === project.milestones.length - 1}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Comments */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Discussion
                  </h2>
                  <span className="font-[family-name:var(--font-mono)] text-sm text-text-tertiary">
                    {project.comments.length}
                  </span>
                </div>

                {project.comments.length === 0 ? (
                  <div className="mt-4 rounded-2xl bg-surface p-6 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-text-tertiary" />
                    <p className="mt-2 text-sm text-text-secondary">
                      No comments yet. Be the first to share your thoughts.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {project.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl bg-surface p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-text-primary">
                            {comment.author}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {formatDate(comment.date)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                          {comment.text}
                        </p>
                        <div className="mt-3">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                          >
                            <ChevronUp className="h-3 w-3" />
                            <span className="font-[family-name:var(--font-mono)]">
                              {comment.upvotes}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <div className="mt-4">
                  <textarea
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full resize-none rounded-2xl bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Right sidebar */}
            <div className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-20 space-y-4">
                {/* Stats card */}
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Stats</h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <ChevronUp className="h-4 w-4" />
                        Upvotes
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">
                        {displayUpvotes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <Eye className="h-4 w-4" />
                        Watchers
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">
                        {project.watchers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <MessageSquare className="h-4 w-4" />
                        Comments
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">
                        {project.comments.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick subscribe */}
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Quick Subscribe
                  </h3>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Get notified about this project
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(true)}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary/12 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Bell className="h-4 w-4" />
                    Choose Signals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert subscription modal */}
      <AnimatePresence>
        {showAlertModal && (
          <AlertModal
            projectName={project.name}
            onClose={() => setShowAlertModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MilestoneItem({
  milestone,
  isLast,
}: {
  milestone: Milestone;
  isLast: boolean;
}) {
  const Icon = milestoneTypeIcons[milestone.type] || Circle;

  return (
    <div className="flex gap-4">
      {/* Timeline track */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            milestone.achieved
              ? "bg-success/15"
              : "bg-surface-hover"
          }`}
        >
          {milestone.achieved ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Icon className="h-4 w-4 text-text-tertiary" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 ${
              milestone.achieved ? "bg-success/30" : "bg-surface-hover"
            }`}
            style={{ minHeight: "24px" }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p
          className={`text-sm font-medium ${
            milestone.achieved ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {milestone.title}
        </p>
        <p className="mt-0.5 text-xs text-text-tertiary">
          {milestone.description}
        </p>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-text-tertiary">
          {formatDate(milestone.date)}
        </p>
      </div>
    </div>
  );
}

function AlertModal({
  projectName,
  onClose,
}: {
  projectName: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["metrics", "launch"])
  );

  const toggleType = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelected(next);
  };

  const signalTypes = [
    {
      key: "metrics",
      icon: BarChart3,
      label: "Metrics milestones",
      desc: "Users, TVL, volume crossing key thresholds",
    },
    {
      key: "launch",
      icon: Rocket,
      label: "New features & launches",
      desc: "Product updates, new versions, feature drops",
    },
    {
      key: "partnership",
      icon: Handshake,
      label: "Partnerships & integrations",
      desc: "New partners, chain expansions, protocol integrations",
    },
    {
      key: "update",
      icon: Newspaper,
      label: "All updates",
      desc: "Everything the agents find about this project",
    },
    {
      key: "token",
      icon: Coins,
      label: "Token events",
      desc: "Listings, liquidity events, tokenomics changes",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl bg-surface p-5 sm:inset-x-auto sm:w-full"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Choose Your Signals
            </h2>
            <p className="mt-0.5 text-xs text-text-tertiary">
              for {projectName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {signalTypes.map((st) => {
            const isChecked = selected.has(st.key);
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => toggleType(st.key)}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  isChecked
                    ? "bg-primary/8"
                    : "bg-surface-hover/50 hover:bg-surface-hover"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isChecked
                      ? "border-primary bg-primary"
                      : "border-border bg-transparent"
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <st.icon className="h-3.5 w-3.5 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center rounded-lg px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Bell className="h-3.5 w-3.5" />
            Save Preferences
          </button>
        </div>
      </motion.div>
    </>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
