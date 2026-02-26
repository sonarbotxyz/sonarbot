"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
  Loader2,
  Globe,
  Twitter,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import type { Project, Comment, Category, Milestone } from "@/lib/mock-data";

const categoryColors: Record<Category, string> = {
  DeFi: "#2A5DC4",
  Social: "#6B45C0",
  NFT: "#B83575",
  Infra: "#18A870",
  Gaming: "#C88018",
  Tools: "#505860",
};

const milestoneTypeIcons: Record<string, React.ElementType> = {
  metrics: BarChart3,
  launch: Rocket,
  partnership: Handshake,
  update: Newspaper,
  token: Coins,
};

/** Get avatar from twitter */
function getAvatar(project: Project): string {
  if (project.twitterHandle) return `https://unavatar.io/twitter/${project.twitterHandle}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=1C1D27&color=fff&size=128`;
}

/** Generate multiple product screenshots for gallery */
function getProductScreenshots(project: Project): string[] {
  const shots: string[] = [];
  if (project.logoUrl) shots.push(project.logoUrl);
  if (project.website) {
    const cleanUrl = project.website.startsWith("http") ? project.website : `https://${project.website}`;
    // Full page screenshot
    shots.push(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&type=png`);
    // Mobile view
    shots.push(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=390&viewport.height=844&type=png`);
  }
  return shots;
}

interface ProjectDetailProps {
  project: Project | null;
  comments: Comment[];
  projectId: string;
}

export function ProjectDetail({ project, comments: initialComments, projectId }: ProjectDetailProps) {
  const { user, login, accessToken } = useAuth();
  const [watching, setWatching] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(project?.upvotes ?? 0);
  const [upvoting, setUpvoting] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const galleryRef = useRef<HTMLDivElement>(null);

  if (!project) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
        <p className="text-xl font-semibold text-text-primary">Project not found</p>
        <Link href="/" className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to discover
        </Link>
      </div>
    );
  }

  const accentColor = categoryColors[project.category];
  const avatar = getAvatar(project);
  const screenshots = getProductScreenshots(project);

  async function handleUpvote() {
    if (!user) { login(); return; }
    if (upvoting) return;
    setUpvoting(true);
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setUpvoteCount((c) => (wasUpvoted ? c - 1 : c + 1));
    try {
      const res = await fetch(`/api/projects/${projectId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setUpvoted(wasUpvoted);
        setUpvoteCount((c) => (wasUpvoted ? c + 1 : c - 1));
      } else {
        setUpvoteCount(data.upvotes);
        setUpvoted(data.action === "added");
      }
    } catch {
      setUpvoted(wasUpvoted);
      setUpvoteCount((c) => (wasUpvoted ? c + 1 : c - 1));
    } finally {
      setUpvoting(false);
    }
  }

  async function handlePostComment() {
    if (!user) { login(); return; }
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, {
          id: data.comment.id, author: data.comment.twitter_handle,
          text: data.comment.content, date: data.comment.created_at, upvotes: 0,
        }]);
        setCommentText("");
      }
    } catch { /* silent */ } finally { setPosting(false); }
  }

  function scrollGallery(dir: "left" | "right") {
    if (!galleryRef.current) return;
    const amount = galleryRef.current.offsetWidth * 0.8;
    galleryRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Back nav */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to discover
          </Link>
        </div>

        {/* ─── HEADER: PH style ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 sm:h-20 sm:w-20">
              <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-[family-name:var(--font-brand)] text-xl font-bold text-text-primary sm:text-2xl">
                  {project.name}
                </h1>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {project.category}
                </span>
              </div>

              <p className="mt-1 text-[14px] text-text-secondary sm:text-[15px]">
                {project.tagline}
              </p>

              <div className="mt-2 flex items-center gap-3 text-[12px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {project.watchers} watchers
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {comments.length} comments
                </span>
              </div>
            </div>

            {/* Action buttons — right side */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {project.website && (
                <a
                  href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover ring-1 ring-white/10"
                >
                  <Globe className="h-4 w-4" />
                  Visit website
                </a>
              )}
              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoting}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all ring-1 ${
                  upvoted
                    ? "bg-primary/15 text-primary ring-primary/30"
                    : "bg-surface text-text-secondary ring-white/10 hover:bg-surface-hover"
                }`}
              >
                {upvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
                <span className="font-[family-name:var(--font-mono)]">{upvoteCount.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── CATEGORY TAGS + LINKS ─── */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-3 flex-wrap">
            {project.subcategory && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-text-tertiary">
                {project.subcategory}
              </span>
            )}
            {project.twitter && (
              <a
                href={`https://x.com/${project.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <Twitter className="h-3 w-3" />
                @{project.twitter}
              </a>
            )}
          </div>
        </div>

        {/* ─── DESCRIPTION (expandable) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-7xl px-4 pt-5 sm:px-6"
        >
          <p className="text-[14px] leading-relaxed text-text-secondary">
            {project.description || project.tagline}
          </p>
        </motion.div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="flex gap-6 border-b border-white/5">
            {(["overview", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-text-primary border-b-2 border-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tab === "reviews" ? `Reviews (${comments.length})` : tab}
              </button>
            ))}
          </div>
        </div>

        {/* ─── SCREENSHOT GALLERY ─── */}
        {activeTab === "overview" && screenshots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"
          >
            <div className="relative">
              {/* Scroll buttons */}
              <button
                type="button"
                onClick={() => scrollGallery("left")}
                className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface ring-1 ring-white/10 text-text-secondary hover:text-text-primary transition-colors shadow-lg hidden sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollGallery("right")}
                className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface ring-1 ring-white/10 text-text-secondary hover:text-text-primary transition-colors shadow-lg hidden sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Scrollable gallery */}
              <div
                ref={galleryRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {screenshots.map((src, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 snap-start overflow-hidden rounded-xl bg-surface ring-1 ring-white/5"
                    style={{ width: "min(80%, 560px)" }}
                  >
                    <div className="relative h-64 sm:h-80">
                      <img
                        src={src}
                        alt={`${project.name} screenshot ${i + 1}`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.parentElement!.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── CONTENT AREA ─── */}
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6">
          <div className="flex gap-10">
            {/* Left column */}
            <div className="min-w-0 flex-1 space-y-10">

              {activeTab === "overview" && (
                <>
                  {/* Milestones */}
                  {project.milestones.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <h2 className="text-lg font-semibold text-text-primary">Milestones</h2>
                      <div className="mt-4 space-y-0">
                        {project.milestones.map((milestone, i) => (
                          <MilestoneItem key={milestone.id} milestone={milestone} isLast={i === project.milestones.length - 1} />
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {/* Watch CTA */}
                  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="rounded-2xl bg-surface p-6 text-center">
                      <Bell className="mx-auto h-8 w-8 text-primary" />
                      <h3 className="mt-3 text-base font-semibold text-text-primary">Get notified about {project.name}</h3>
                      <p className="mt-1 text-sm text-text-tertiary">Choose which milestones matter to you and get alerts via Telegram</p>
                      <div className="mt-4 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => { if (!watching) setShowAlertModal(true); setWatching(!watching); }}
                          className={`flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium transition-all ${
                            watching ? "bg-primary text-white" : "bg-primary/15 text-primary hover:bg-primary/25"
                          }`}
                        >
                          {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {watching ? "Watching" : "Watch this project"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAlertModal(true)}
                          className="flex h-10 items-center gap-2 rounded-xl bg-surface-hover px-5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <Bell className="h-4 w-4" />
                          Configure alerts
                        </button>
                      </div>
                    </div>
                  </motion.section>
                </>
              )}

              {/* Comments / Reviews — shown in both tabs but primary in reviews */}
              {(activeTab === "reviews" || activeTab === "overview") && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {activeTab === "reviews" ? "Reviews" : "Discussion"}
                    </h2>
                    <span className="font-[family-name:var(--font-mono)] text-sm text-text-tertiary">{comments.length}</span>
                  </div>

                  {comments.length === 0 ? (
                    <div className="mt-4 rounded-2xl bg-surface p-6 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-text-tertiary" />
                      <p className="mt-2 text-sm text-text-secondary">No comments yet. Be the first to share your thoughts.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-surface p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-text-primary">{comment.author}</span>
                            <span className="text-xs text-text-tertiary">{formatDate(comment.date)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{comment.text}</p>
                          <div className="mt-3">
                            <button type="button" className="flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary">
                              <ChevronUp className="h-3 w-3" />
                              <span className="font-[family-name:var(--font-mono)]">{comment.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="mt-4">
                    <textarea
                      placeholder={user ? "Share your thoughts..." : "Sign in to comment..."}
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onFocus={() => { if (!user) login(); }}
                      className="w-full resize-none rounded-2xl bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handlePostComment}
                        disabled={posting || !commentText.trim()}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                      >
                        {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Post Comment
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right sidebar */}
            <div className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-20 space-y-4">
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Stats</h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary"><ChevronUp className="h-4 w-4" /> Upvotes</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">{upvoteCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary"><Eye className="h-4 w-4" /> Watchers</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">{project.watchers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-text-secondary"><MessageSquare className="h-4 w-4" /> Comments</span>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">{comments.length}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Quick Subscribe</h3>
                  <p className="mt-1 text-xs text-text-tertiary">Get notified about this project</p>
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(true)}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary/12 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Bell className="h-4 w-4" /> Choose Signals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert modal */}
      <AnimatePresence>
        {showAlertModal && <AlertModal projectName={project.name} onClose={() => setShowAlertModal(false)} />}
      </AnimatePresence>
    </>
  );
}

function MilestoneItem({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const Icon = milestoneTypeIcons[milestone.type] || Circle;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${milestone.achieved ? "bg-success/15" : "bg-surface-hover"}`}>
          {milestone.achieved ? <Check className="h-4 w-4 text-success" /> : <Icon className="h-4 w-4 text-text-tertiary" />}
        </div>
        {!isLast && <div className={`w-px flex-1 ${milestone.achieved ? "bg-success/30" : "bg-surface-hover"}`} style={{ minHeight: "24px" }} />}
      </div>
      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p className={`text-sm font-medium ${milestone.achieved ? "text-text-primary" : "text-text-secondary"}`}>{milestone.title}</p>
        <p className="mt-0.5 text-xs text-text-tertiary">{milestone.description}</p>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-text-tertiary">{formatDate(milestone.date)}</p>
      </div>
    </div>
  );
}

function AlertModal({ projectName, onClose }: { projectName: string; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["metrics", "launch"]));
  const toggleType = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type); else next.add(type);
    setSelected(next);
  };
  const signalTypes = [
    { key: "metrics", icon: BarChart3, label: "Metrics milestones", desc: "Users, TVL, volume crossing key thresholds" },
    { key: "launch", icon: Rocket, label: "New features & launches", desc: "Product updates, new versions, feature drops" },
    { key: "partnership", icon: Handshake, label: "Partnerships & integrations", desc: "New partners, chain expansions" },
    { key: "update", icon: Newspaper, label: "All updates", desc: "Everything the agents find about this project" },
    { key: "token", icon: Coins, label: "Token events", desc: "Listings, liquidity events, tokenomics changes" },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl bg-surface p-5 sm:inset-x-auto sm:w-full"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Choose Your Signals</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">for {projectName}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {signalTypes.map((st) => {
            const isChecked = selected.has(st.key);
            return (
              <button
                key={st.key} type="button" onClick={() => toggleType(st.key)}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${isChecked ? "bg-primary/8" : "bg-surface-hover/50 hover:bg-surface-hover"}`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${isChecked ? "border-primary bg-primary" : "border-border bg-transparent"}`}>
                  {isChecked && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <st.icon className="h-3.5 w-3.5 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">{st.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="flex h-9 items-center rounded-lg px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">Cancel</button>
          <button type="button" onClick={onClose} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            <Bell className="h-3.5 w-3.5" /> Save Preferences
          </button>
        </div>
      </motion.div>
    </>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
