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
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useDominantColor, buildMeshGradient, buildAccentColor } from "@/hooks/useDominantColor";
import type { Project, Comment, Category, Milestone } from "@/lib/mock-data";
import { projects as allProjects } from "@/lib/mock-data";

const noiseFilter = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

const milestoneTypeIcons: Record<string, React.ElementType> = {
  metrics: BarChart3,
  launch: Rocket,
  partnership: Handshake,
  update: Newspaper,
  token: Coins,
};

const signalTypes = [
  { key: "metrics", icon: BarChart3, label: "Metrics milestones", desc: "Users, TVL, volume thresholds" },
  { key: "launch", icon: Rocket, label: "New features & launches", desc: "Product updates, feature drops" },
  { key: "partnership", icon: Handshake, label: "Partnerships & integrations", desc: "New partners, expansions" },
  { key: "token", icon: Coins, label: "Token events", desc: "Listings, liquidity, tokenomics" },
];

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
    shots.push(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&type=png`);
    shots.push(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=390&viewport.height=844&type=png`);
  }
  return shots;
}

/** Get a promoted project (first from DB that isn't the current one) */
function getPromotedProject(currentId: string): Project | null {
  return allProjects.find((p) => p.id !== currentId) ?? null;
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
  const [descExpanded, setDescExpanded] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState<Set<string>>(new Set(["metrics", "launch"]));
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

  const avatar = getAvatar(project);
  const { rgb, color: accentColor } = useDominantColor(avatar);
  const meshGradient = buildMeshGradient(rgb);
  const accentTextColor = buildAccentColor(rgb);
  const screenshots = getProductScreenshots(project);
  const promotedProject = getPromotedProject(project.id);
  const description = project.description || project.tagline;
  const isLongDesc = description.length > 200;

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

  function toggleAlertPref(key: string) {
    setAlertPrefs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Dynamic gradient banner based on project brand color */}
        <div className="relative h-32 overflow-hidden sm:h-40" style={{ background: meshGradient }}>
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: noiseFilter, backgroundSize: "128px 128px" }} />
          {/* Bottom fade into page bg */}
          <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top, var(--background) 0%, transparent 100%)" }} />
          {/* Back nav overlaid on banner */}
          <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to discover
            </Link>
          </div>
        </div>

        {/* ─── TWO-COLUMN LAYOUT ─── */}
        <div className="relative mx-auto max-w-7xl px-4 -mt-12 pb-16 sm:px-6 sm:-mt-16">
          <div className="flex flex-col lg:flex-row lg:gap-10">

            {/* ═══════════════════════════════════════ */}
            {/* LEFT COLUMN — Main content (65-70%)    */}
            {/* ═══════════════════════════════════════ */}
            <div className="min-w-0 flex-1">

              {/* ─── HEADER: PH style ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
                        style={{ backgroundColor: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.15)`, color: accentTextColor }}
                      >
                        {project.category}
                      </span>
                    </div>

                    <p className="mt-1 text-[14px] text-text-secondary sm:text-[15px]">
                      {project.tagline}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-[12px] text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {project.watchers.toLocaleString()} watchers
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {comments.length} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <ChevronUp className="h-3 w-3" />
                        <span className="font-[family-name:var(--font-mono)]">{upvoteCount.toLocaleString()}</span> upvotes
                      </span>
                    </div>

                    {/* Visit website — visible on mobile only */}
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover ring-1 ring-white/10 lg:hidden"
                      >
                        <Globe className="h-4 w-4" />
                        Visit website
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ─── CATEGORY TAGS + LINKS ─── */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
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

              {/* ─── DESCRIPTION (expandable) ─── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5"
              >
                <p className={`text-[14px] leading-relaxed text-text-secondary ${!descExpanded && isLongDesc ? "line-clamp-3" : ""}`}>
                  {description}
                </p>
                {isLongDesc && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-1 text-[13px] font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    {descExpanded ? "See less" : "See more"}
                  </button>
                )}
              </motion.div>

              {/* ─── TAB NAVIGATION ─── */}
              <div className="mt-6">
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
                  className="mt-6"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => scrollGallery("left")}
                      className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface ring-1 ring-white/10 text-text-secondary hover:text-text-primary transition-colors shadow-lg sm:flex"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery("right")}
                      className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface ring-1 ring-white/10 text-text-secondary hover:text-text-primary transition-colors shadow-lg sm:flex"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div
                      ref={galleryRef}
                      className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {screenshots.map((src, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 snap-start overflow-hidden rounded-xl bg-surface ring-1 ring-white/5"
                          style={{ width: "min(85%, 520px)" }}
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

              {/* ─── MILESTONES (Overview tab) ─── */}
              {activeTab === "overview" && project.milestones.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
                  <h2 className="text-lg font-semibold text-text-primary">Milestones</h2>
                  <div className="mt-4 space-y-0">
                    {project.milestones.map((milestone, i) => (
                      <MilestoneItem key={milestone.id} milestone={milestone} isLast={i === project.milestones.length - 1} />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ─── COMMENTS / DISCUSSION ─── */}
              {(activeTab === "reviews" || activeTab === "overview") && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
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

              {/* ─── MOBILE SIDEBAR (shown below main content on mobile) ─── */}
              <div className="mt-10 space-y-4 lg:hidden">
                <MobileSidebarContent
                  project={project}
                  upvoted={upvoted}
                  upvoting={upvoting}
                  upvoteCount={upvoteCount}
                  watching={watching}
                  alertPrefs={alertPrefs}
                  promotedProject={promotedProject}
                  accentColor={accentColor}
                  rgb={rgb}
                  accentTextColor={accentTextColor}
                  onUpvote={handleUpvote}
                  onToggleWatch={() => { if (!watching) setShowAlertModal(true); setWatching(!watching); }}
                  onToggleAlertPref={toggleAlertPref}
                  onOpenAlertModal={() => setShowAlertModal(true)}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* RIGHT SIDEBAR — Sticky (30-35%)        */}
            {/* ═══════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden w-[320px] shrink-0 lg:block"
            >
              <div className="sticky top-20 space-y-4">

                {/* 1. UPVOTE BUTTON — Big, prominent, full-width */}
                <button
                  type="button"
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={`group flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold transition-all duration-200 ${
                    upvoted
                      ? "bg-primary text-white shadow-[0_0_24px_rgba(61,215,216,0.25)]"
                      : "bg-surface text-text-primary ring-1 ring-white/10 hover:bg-surface-hover hover:ring-primary/30 hover:shadow-[0_0_16px_rgba(61,215,216,0.1)]"
                  }`}
                >
                  {upvoting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ChevronUp className={`h-5 w-5 transition-transform ${upvoted ? "" : "group-hover:-translate-y-0.5"}`} />
                  )}
                  <span>
                    Upvote
                    <span className="mx-1.5 text-white/40">·</span>
                    <span className="font-[family-name:var(--font-mono)]">{upvoteCount.toLocaleString()}</span>
                  </span>
                </button>

                {/* 2. PROMOTED PROJECT CARD — top of sidebar for visibility */}
                {promotedProject && (
                  <PromotedProjectCard project={promotedProject} />
                )}

                {/* 3. WATCH / FOLLOWING BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { login(); return; }
                    if (!watching) setShowAlertModal(true);
                    setWatching(!watching);
                  }}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                    watching
                      ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                      : "bg-surface text-text-secondary ring-1 ring-white/10 hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {watching ? "Following" : "Watch this project"}
                </button>

                {/* 3. ALERT PREFERENCES — inline toggles */}
                <div className="rounded-2xl bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">Alert Preferences</h3>
                    <Bell className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <p className="mt-1 text-[11px] text-text-tertiary">Choose which signals to receive</p>
                  <div className="mt-3 space-y-2.5">
                    {signalTypes.map((st) => {
                      const active = alertPrefs.has(st.key);
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => toggleAlertPref(st.key)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <st.icon className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                            <div className="min-w-0">
                              <span className="block text-[13px] font-medium text-text-primary truncate">{st.label}</span>
                              <span className="block text-[11px] text-text-tertiary truncate">{st.desc}</span>
                            </div>
                          </div>
                          {/* Toggle switch */}
                          <div
                            className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                              active ? "bg-primary" : "bg-surface-hover"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                active ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. COMPANY INFO */}
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Company Info</h3>
                  <div className="mt-3 space-y-2.5">
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-tertiary" />
                      </a>
                    )}
                    {project.twitter && (
                      <a
                        href={`https://x.com/${project.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary"
                      >
                        <Twitter className="h-4 w-4 flex-shrink-0" />
                        <span>@{project.twitter}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-tertiary" />
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)` }}
                      >
                        <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: accentTextColor }} />
                      </span>
                      <span>{project.category}</span>
                      {project.subcategory && (
                        <>
                          <span className="text-text-tertiary">/</span>
                          <span className="text-text-tertiary">{project.subcategory}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Promoted card moved to top of sidebar */}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Alert modal — kept as fallback (mobile + "configure alerts" action) */}
      <AnimatePresence>
        {showAlertModal && <AlertModal projectName={project.name} onClose={() => setShowAlertModal(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── MOBILE SIDEBAR CONTENT ─── */
function MobileSidebarContent({
  project,
  upvoted,
  upvoting,
  upvoteCount,
  watching,
  alertPrefs,
  promotedProject,
  accentColor,
  rgb,
  accentTextColor,
  onUpvote,
  onToggleWatch,
  onToggleAlertPref,
  onOpenAlertModal,
}: {
  project: Project;
  upvoted: boolean;
  upvoting: boolean;
  upvoteCount: number;
  watching: boolean;
  alertPrefs: Set<string>;
  promotedProject: Project | null;
  accentColor: string;
  rgb: [number, number, number];
  accentTextColor: string;
  onUpvote: () => void;
  onToggleWatch: () => void;
  onToggleAlertPref: (key: string) => void;
  onOpenAlertModal: () => void;
}) {
  return (
    <>
      {/* Promoted — top of mobile sidebar too */}
      {promotedProject && <PromotedProjectCard project={promotedProject} />}

      {/* Upvote + Watch row */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onUpvote}
          disabled={upvoting}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
            upvoted
              ? "bg-primary text-white shadow-[0_0_20px_rgba(61,215,216,0.2)]"
              : "bg-surface text-text-primary ring-1 ring-white/10"
          }`}
        >
          {upvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
          Upvote · <span className="font-[family-name:var(--font-mono)]">{upvoteCount.toLocaleString()}</span>
        </button>
        <button
          type="button"
          onClick={onToggleWatch}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all ${
            watching
              ? "bg-primary/15 text-primary ring-1 ring-primary/20"
              : "bg-surface text-text-secondary ring-1 ring-white/10"
          }`}
        >
          {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {watching ? "Following" : "Watch"}
        </button>
      </div>

      {/* Configure alerts button (opens modal on mobile) */}
      <button
        type="button"
        onClick={onOpenAlertModal}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-surface text-sm font-medium text-text-secondary ring-1 ring-white/10 transition-colors hover:bg-surface-hover"
      >
        <Bell className="h-4 w-4" />
        Configure alerts
      </button>

      {/* Company info */}
      <div className="rounded-2xl bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary">Company Info</h3>
        <div className="mt-3 space-y-2.5">
          {project.website && (
            <a
              href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary"
            >
              <Globe className="h-4 w-4" />
              <span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-3 w-3 text-text-tertiary" />
            </a>
          )}
          {project.twitter && (
            <a
              href={`https://x.com/${project.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary"
            >
              <Twitter className="h-4 w-4" />
              <span>@{project.twitter}</span>
              <ExternalLink className="h-3 w-3 text-text-tertiary" />
            </a>
          )}
          <div className="flex items-center gap-2.5 text-sm text-text-secondary">
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ backgroundColor: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)` }}
            >
              <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: accentTextColor }} />
            </span>
            <span>{project.category}</span>
            {project.subcategory && (
              <>
                <span className="text-text-tertiary">/</span>
                <span className="text-text-tertiary">{project.subcategory}</span>
              </>
            )}
          </div>
        </div>
      </div>

    </>
  );
}

/* ─── PROMOTED PROJECT CARD ─── */
function PromotedProjectCard({ project }: { project: Project }) {
  const avatar = getAvatar(project);

  return (
    <Link href={`/project/${project.id}`} className="group block">
      <div
        className="relative overflow-hidden rounded-2xl p-4 transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(160deg, #3DD7D8 0%, #1A8FA0 35%, #0D4F6B 70%, #081838 100%)",
        }}
      >
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, rgba(61,215,216,0.4) 0%, transparent 60%)",
          }}
        />

        {/* Promoted label */}
        <div className="relative flex items-center gap-1.5 mb-3">
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
            <Sparkles className="h-2.5 w-2.5" />
            Promoted
          </span>
        </div>

        {/* Avatar + Name */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/20">
            <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-white truncate">
              {project.name}
            </h4>
            <p className="text-[11px] text-white/60 truncate">{project.tagline}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-3 flex items-center gap-1 text-[12px] font-semibold text-white/80 transition-colors group-hover:text-white">
          Check it out
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

/* ─── MILESTONE ITEM ─── */
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

/* ─── ALERT MODAL (fallback, used on mobile) ─── */
function AlertModal({ projectName, onClose }: { projectName: string; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["metrics", "launch"]));
  const toggleType = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type); else next.add(type);
    setSelected(next);
  };
  const fullSignalTypes = [
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
          {fullSignalTypes.map((st) => {
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
