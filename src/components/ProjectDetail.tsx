"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
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
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Droplets,
  GitBranch,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import type { Project, Comment, Milestone } from "@/lib/mock-data";
import { projects as allProjects } from "@/lib/mock-data";
import type {
  ApiHealthData,
  ApiSnapshot,
  ApiWhaleWallet,
  ApiSocialData,
} from "@/lib/types";
import {
  mapApiSnapshot,
  mapApiHealth,
  mapApiWhale,
  mapApiSocial,
  computeTrend,
} from "@/lib/types";
import { AreaChartComponent } from "@/components/charts/AreaChart";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { HealthScore } from "@/components/HealthScore";
import { HealthBreakdown } from "@/components/HealthBreakdown";
import { WhaleTable } from "@/components/WhaleTable";
import { ProjectCard } from "@/components/ProjectCard";

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

type ChartMetric = "holders" | "marketCap" | "volume24h" | "liquidity";
type ChartPeriod = 7 | 30 | 90;

const CHART_TABS: { key: ChartMetric; label: string; icon: React.ElementType; color: string }[] = [
  { key: "holders", label: "Holders", icon: Users, color: "#1652F0" },
  { key: "marketCap", label: "Market Cap", icon: DollarSign, color: "#1652F0" },
  { key: "volume24h", label: "Volume", icon: BarChart3, color: "#1652F0" },
  { key: "liquidity", label: "Liquidity", icon: Droplets, color: "#22C55E" },
];

function getAvatar(project: Project): string {
  if (project.twitterHandle) return `https://unavatar.io/twitter/${project.twitterHandle}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=111111&color=F5F5F5&size=128`;
}

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

function getPromotedProject(currentId: string): Project | null {
  return allProjects.find((p) => p.id !== currentId) ?? null;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface ProjectDetailProps {
  project: Project | null;
  comments: Comment[];
  projectId: string;
  healthData: ApiHealthData | null;
  snapshotsData: ApiSnapshot[];
  whaleWalletsData: ApiWhaleWallet[];
  socialData: ApiSocialData | null;
}

export function ProjectDetail({
  project,
  comments: initialComments,
  projectId,
  healthData,
  snapshotsData,
  whaleWalletsData,
  socialData: socialDataRaw,
}: ProjectDetailProps) {
  const { user, login, accessToken } = useAuth();
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>("holders");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(30);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Map DB column names to frontend keys
  const PREF_KEY_MAP: Record<string, string> = {
    metrics_milestones: "metrics",
    new_features_launches: "launch",
    partnerships_integrations: "partnership",
    all_updates: "update",
    token_events: "token",
  };
  const PREF_KEY_MAP_REVERSE: Record<string, string> = {
    metrics: "metrics_milestones",
    launch: "new_features_launches",
    partnership: "partnerships_integrations",
    update: "all_updates",
    token: "token_events",
  };

  // Check watch status on mount
  useEffect(() => {
    if (!user || !accessToken || !projectId) return;
    fetch(`/api/projects/${projectId}/watch`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setWatching(data.watched ?? false);
        if (data.preferences) {
          const set = new Set<string>();
          for (const [dbKey, uiKey] of Object.entries(PREF_KEY_MAP)) {
            if (data.preferences[dbKey]) set.add(uiKey);
          }
          setAlertPrefs(set);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken, projectId]);

  const handleWatch = useCallback(async () => {
    if (!user) { login(); return; }
    if (watchLoading) return;
    setWatchLoading(true);
    try {
      if (watching) {
        // Unwatch
        const res = await fetch(`/api/projects/${projectId}/watch`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) setWatching(false);
      } else {
        // Watch — show modal first
        setShowAlertModal(true);
        const res = await fetch(`/api/projects/${projectId}/watch`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWatching(true);
          if (data.preferences) {
            const set = new Set<string>();
            for (const [dbKey, uiKey] of Object.entries(PREF_KEY_MAP)) {
              if (data.preferences[dbKey]) set.add(uiKey);
            }
            setAlertPrefs(set);
          }
        }
      }
    } catch (e) {
      console.error("Watch error:", e);
    } finally {
      setWatchLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, watching, projectId, accessToken, watchLoading]);

  const handleSaveAlertPrefs = useCallback(async (selected: Set<string>) => {
    if (!accessToken) return;
    const body: Record<string, boolean> = {};
    for (const [uiKey, dbKey] of Object.entries(PREF_KEY_MAP_REVERSE)) {
      body[dbKey] = selected.has(uiKey);
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAlertPrefs(new Set(selected));
      }
    } catch (e) {
      console.error("Alert pref error:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, accessToken]);

  const snapshots90d = useMemo(() => snapshotsData.map(mapApiSnapshot), [snapshotsData]);
  const healthScore = useMemo(() => (healthData ? mapApiHealth(healthData) : null), [healthData]);
  const whales = useMemo(() => whaleWalletsData.map(mapApiWhale), [whaleWalletsData]);
  const socialData = useMemo(() => (socialDataRaw ? mapApiSocial(socialDataRaw) : null), [socialDataRaw]);

  const chartData = useMemo(() => {
    const sliced = snapshots90d.slice(-chartPeriod);
    return sliced.map((s) => ({ timestamp: s.timestamp, value: s[chartMetric] }));
  }, [snapshots90d, chartMetric, chartPeriod]);

  const stats = useMemo(() => {
    if (!snapshots90d.length) return null;
    const latest = snapshots90d[snapshots90d.length - 1];
    return {
      holders: { value: latest.holders, trend: computeTrend(snapshots90d, "holders", 7) },
      marketCap: { value: latest.marketCap, trend: computeTrend(snapshots90d, "marketCap", 7) },
      volume24h: { value: latest.volume24h, trend: computeTrend(snapshots90d, "volume24h", 7) },
      liquidity: { value: latest.liquidity, trend: computeTrend(snapshots90d, "liquidity", 7) },
    };
  }, [snapshots90d]);

  const sparklines = useMemo(() => {
    const last7 = snapshots90d.slice(-7);
    return {
      holders: last7.map((s) => s.holders),
      marketCap: last7.map((s) => s.marketCap),
      volume24h: last7.map((s) => s.volume24h),
      liquidity: last7.map((s) => s.liquidity),
    };
  }, [snapshots90d]);

  if (!project) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-5 md:px-20 py-32 text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Project not found</p>
        <Link href="/" className="mt-4 flex items-center gap-2 text-sm transition-colors" style={{ color: "var(--accent)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to discover
        </Link>
      </div>
    );
  }

  const avatar = getAvatar(project);
  const screenshots = getProductScreenshots(project);
  const promotedProject = getPromotedProject(project.id);
  const description = project.description || project.tagline;
  const isLongDesc = description.length > 200;
  const activeChartTab = CHART_TABS.find((t) => t.key === chartMetric)!;

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
        {/* Back nav */}
        <div className="mx-auto max-w-[1400px] px-5 md:px-20 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] transition-colors no-underline"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to discover
          </Link>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 md:px-20 pt-6 pb-16">
          <div className="flex flex-col lg:flex-row lg:gap-10">

            {/* LEFT COLUMN */}
            <div className="min-w-0 flex-1">

              {/* HEADER */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden sm:h-20 sm:w-20" style={{ border: "1px solid var(--border)" }}>
                    <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-lg font-bold sm:text-2xl leading-tight" style={{ color: "var(--text-primary)" }}>
                        {project.name}
                      </h1>
                      <span
                        className="px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
                        style={{
                          color: "var(--accent)",
                          border: "1px solid var(--accent-dim)",
                          background: "var(--accent-glow)",
                        }}
                      >
                        {project.category}
                      </span>
                      {healthScore && <HealthScore score={healthScore.overall} size="sm" />}
                    </div>
                    <p className="mt-1 text-[13px] sm:text-[15px] line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {project.tagline}
                    </p>
                  </div>
                </div>

                {/* Stats + links row */}
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{project.watchers.toLocaleString()} watchers</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{comments.length} comments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 px-2.5 text-[11px] font-medium transition-colors"
                        style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                      >
                        <Globe className="h-3 w-3" /> Site
                      </a>
                    )}
                    {project.twitter && (
                      <a
                        href={`https://x.com/${project.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 px-2.5 text-[11px] font-medium transition-colors"
                        style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                      >
                        <Twitter className="h-3 w-3" /> X
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* STATS ROW */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 grid grid-cols-2 gap-px sm:grid-cols-4"
                  style={{ background: "var(--border)" }}
                >
                  <StatCard label="Holders" value={formatNumber(stats.holders.value)} trend={stats.holders.trend} sparkline={sparklines.holders} icon={Users} color="#1652F0" />
                  <StatCard label="Market Cap" value={formatCompact(stats.marketCap.value)} trend={stats.marketCap.trend} sparkline={sparklines.marketCap} icon={DollarSign} color="#1652F0" />
                  <StatCard label="24h Volume" value={formatCompact(stats.volume24h.value)} trend={stats.volume24h.trend} sparkline={sparklines.volume24h} icon={BarChart3} color="#1652F0" />
                  <StatCard label="Liquidity" value={formatCompact(stats.liquidity.value)} trend={stats.liquidity.trend} sparkline={sparklines.liquidity} icon={Droplets} color="#22C55E" />
                </motion.div>
              )}

              {/* DESCRIPTION */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
                <p className={`text-[14px] leading-relaxed ${!descExpanded && isLongDesc ? "line-clamp-3" : ""}`} style={{ color: "var(--text-secondary)" }}>
                  {description}
                </p>
                {isLongDesc && (
                  <button type="button" onClick={() => setDescExpanded(!descExpanded)} className="mt-1 text-[13px] font-medium transition-colors" style={{ color: "var(--accent)" }}>
                    {descExpanded ? "See less" : "See more"}
                  </button>
                )}
              </motion.div>

              {/* MOBILE: ACTIONS */}
              <div className="mt-6 space-y-3 lg:hidden">
                <button
                  type="button"
                  onClick={handleWatch}
                  disabled={watchLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 text-sm font-bold transition-all"
                  style={{
                    background: watching ? "var(--accent)" : "var(--bg-secondary)",
                    color: watching ? "#FFFFFF" : "var(--text-primary)",
                    border: watching ? "none" : "1px solid var(--border)",
                    opacity: watchLoading ? 0.6 : 1,
                  }}
                >
                  {watchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {watching ? "Watching" : "Watch this project"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlertModal(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 text-sm font-medium transition-colors"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  <Bell className="h-4 w-4" /> Configure alerts
                </button>
                {promotedProject && <PromotedProjectCard project={promotedProject} />}
              </div>

              {/* CHART SECTION */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
                <div className="p-5" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-1">
                      {CHART_TABS.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setChartMetric(tab.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors"
                          style={{
                            color: chartMetric === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                            background: chartMetric === tab.key ? "var(--border-strong)" : "transparent",
                          }}
                        >
                          <tab.icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {([7, 30, 90] as ChartPeriod[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setChartPeriod(p)}
                          className="px-2.5 py-1 font-mono text-[11px] font-medium transition-colors"
                          style={{
                            color: chartPeriod === p ? "var(--text-primary)" : "var(--text-muted)",
                            background: chartPeriod === p ? "var(--border-strong)" : "transparent",
                          }}
                        >
                          {p}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    {chartData.length > 0 ? (
                      <AreaChartComponent data={chartData} color={activeChartTab.color} height={280} formatValue={chartMetric === "holders" ? formatNumber : formatCompact} />
                    ) : (
                      <div className="flex h-[280px] items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="mx-auto h-8 w-8" style={{ color: "var(--text-muted)" }} />
                          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No data yet</p>
                          <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>Chart data will appear once snapshots are collected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* HEALTH + SOCIAL */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 grid gap-px md:grid-cols-2" style={{ background: "var(--border)" }}>
                {healthScore && <HealthBreakdown health={healthScore} />}
                <div className="p-5" style={{ background: "var(--bg-secondary)" }}>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: "var(--text-muted)" }}>Social & Dev</h3>
                  <div className="mt-4 space-y-3">
                    <SocialRow icon={Twitter} label="X Followers" value={socialData ? formatNumber(socialData.xFollowers) : "—"} change={socialData?.xFollowersChange || undefined} />
                    <SocialRow icon={Activity} label="Engagement Rate" value={socialData ? `${socialData.engagementRate.toFixed(1)}%` : "—"} />
                    <SocialRow icon={GitBranch} label="GitHub Commits (30d)" value={socialData ? socialData.githubCommits30d.toString() : "—"} />
                    <SocialRow icon={Activity} label="GitHub Stars" value={socialData ? formatNumber(socialData.githubStars) : "—"} />
                    <SocialRow icon={MessageCircle} label="Farcaster Followers" value={socialData ? formatNumber(socialData.farcasterFollowers) : "—"} />
                    <SocialRow icon={Activity} label="Farcaster Engagement" value={socialData ? `${socialData.farcasterEngagement.toFixed(1)}%` : "—"} />
                  </div>
                </div>
              </motion.div>

              {/* WHALE TABLE */}
              {whales.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                  <WhaleTable whales={whales} />
                </motion.div>
              )}

              {/* TAB NAVIGATION */}
              <div className="mt-8">
                <div className="flex gap-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  {(["overview", "reviews"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="pb-3 text-[11px] uppercase tracking-[0.08em] font-medium capitalize transition-colors"
                      style={{
                        color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                        borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                      }}
                    >
                      {tab === "reviews" ? `Reviews (${comments.length})` : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCREENSHOT GALLERY */}
              {activeTab === "overview" && screenshots.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => scrollGallery("left")}
                      className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors sm:flex"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery("right")}
                      className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors sm:flex"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div
                      ref={galleryRef}
                      className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {screenshots.map((src, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 snap-start overflow-hidden"
                          style={{ width: "min(85%, 520px)", border: "1px solid var(--border)" }}
                        >
                          <div className="relative h-64 sm:h-80">
                            <img
                              src={src}
                              alt={`${project.name} screenshot ${i + 1}`}
                              className="h-full w-full object-cover object-top"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MILESTONES */}
              {activeTab === "overview" && project.milestones.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="font-bold text-[10px]" style={{ color: "var(--accent)" }}>&gt;</span>
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Milestones</span>
                  </div>
                  <div className="space-y-0">
                    {project.milestones.map((milestone, i) => (
                      <MilestoneItem key={milestone.id} milestone={milestone} isLast={i === project.milestones.length - 1} />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* COMMENTS */}
              {activeTab === "reviews" && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="font-bold text-[10px]" style={{ color: "var(--accent)" }}>&gt;</span>
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Reviews</span>
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-very-muted)" }}>{comments.length}</span>
                  </div>
                  {comments.length === 0 ? (
                    <div className="p-6 text-center" style={{ background: "var(--bg-secondary)" }}>
                      <MessageSquare className="mx-auto h-8 w-8" style={{ color: "var(--text-muted)" }} />
                      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>No comments yet. Be the first to share your thoughts.</p>
                    </div>
                  ) : (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>{comment.author}</span>
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(comment.date)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{comment.text}</p>
                          <div className="mt-3">
                            <button type="button" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "var(--text-muted)" }}>
                              <ChevronUp className="h-3 w-3" />
                              <span className="font-mono">{comment.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <textarea
                      placeholder={user ? "Share your thoughts..." : "Sign in to comment..."}
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onFocus={() => { if (!user) login(); }}
                      className="w-full resize-none p-4 text-sm outline-none transition-colors"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handlePostComment}
                        disabled={posting || !commentText.trim()}
                        className="flex h-9 items-center gap-2 px-4 text-xs uppercase tracking-[0.06em] font-medium text-white transition-colors disabled:opacity-50"
                        style={{ background: "var(--accent)" }}
                      >
                        {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Post Comment
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* MOBILE: COMPANY INFO */}
              <div className="mt-8 lg:hidden">
                <div className="p-4" style={{ background: "var(--bg-secondary)" }}>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: "var(--text-muted)" }}>Company Info</h3>
                  <div className="mt-3 space-y-2.5">
                    {project.website && (
                      <a href={project.website.startsWith("http") ? project.website : `https://${project.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <Globe className="h-4 w-4" /><span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span><ExternalLink className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                      </a>
                    )}
                    {project.twitter && (
                      <a href={`https://x.com/${project.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <Twitter className="h-4 w-4" /><span>@{project.twitter}</span><ExternalLink className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex h-4 w-4 items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                        <span className="block h-2 w-2" style={{ background: "var(--accent)", borderRadius: "50%" }} />
                      </span>
                      <span>{project.category}</span>
                      {project.subcategory && (<><span style={{ color: "var(--text-muted)" }}>/</span><span style={{ color: "var(--text-muted)" }}>{project.subcategory}</span></>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden w-[320px] shrink-0 lg:block"
            >
              <div className="sticky top-20 space-y-4">
                {/* Watch CTA */}
                <button
                  type="button"
                  onClick={handleWatch}
                  disabled={watchLoading}
                  className="group flex h-14 w-full items-center justify-center gap-3 text-sm font-bold transition-all duration-200"
                  style={{
                    background: watching ? "var(--accent)" : "var(--bg-secondary)",
                    color: watching ? "#FFFFFF" : "var(--text-primary)",
                    border: watching ? "1px solid var(--accent)" : "1px solid var(--border)",
                    opacity: watchLoading ? 0.6 : 1,
                  }}
                >
                  {watchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : watching ? <Check className="h-5 w-5" /> : <Eye className="h-5 w-5 transition-transform group-hover:scale-110" />}
                  <span>{watching ? "Watching" : "Watch this project"}</span>
                </button>

                {/* Promoted */}
                {promotedProject && <PromotedProjectCard project={promotedProject} />}

                {/* Alert Preferences */}
                <div className="p-4" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: "var(--text-muted)" }}>Alert Preferences</h3>
                    <Bell className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>Choose which signals to receive</p>
                  <div className="mt-3 space-y-2.5">
                    {signalTypes.map((st) => {
                      const active = alertPrefs.has(st.key);
                      return (
                        <button key={st.key} type="button" onClick={() => toggleAlertPref(st.key)} className="flex w-full items-center gap-3 text-left">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <st.icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div className="min-w-0">
                              <span className="block text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{st.label}</span>
                              <span className="block text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{st.desc}</span>
                            </div>
                          </div>
                          <div
                            className="relative h-5 w-9 flex-shrink-0 transition-colors"
                            style={{
                              background: active ? "var(--accent)" : "var(--bg-tertiary)",
                              borderRadius: "10px",
                            }}
                          >
                            <div
                              className="absolute top-0.5 h-4 w-4 bg-white shadow-sm transition-transform"
                              style={{
                                borderRadius: "50%",
                                transform: active ? "translateX(16px)" : "translateX(2px)",
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Info */}
                <div className="p-4" style={{ background: "var(--bg-secondary)" }}>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: "var(--text-muted)" }}>Company Info</h3>
                  <div className="mt-3 space-y-2.5">
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                      </a>
                    )}
                    {project.twitter && (
                      <a
                        href={`https://x.com/${project.twitter}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Twitter className="h-4 w-4 flex-shrink-0" />
                        <span>@{project.twitter}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center" style={{ background: "var(--accent-dim)" }}>
                        <span className="block h-2 w-2" style={{ background: "var(--accent)", borderRadius: "50%" }} />
                      </span>
                      <span>{project.category}</span>
                      {project.subcategory && (<><span style={{ color: "var(--text-muted)" }}>/</span><span style={{ color: "var(--text-muted)" }}>{project.subcategory}</span></>)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Alert modal */}
      <AnimatePresence>
        {showAlertModal && <AlertModal projectName={project.name} onClose={() => setShowAlertModal(false)} initialSelected={alertPrefs} onSave={handleSaveAlertPrefs} />}
      </AnimatePresence>
    </>
  );
}

/* STAT CARD */
function StatCard({
  label, value, trend, sparkline, icon: Icon, color,
}: {
  label: string; value: string; trend: number; sparkline: number[]; icon: React.ElementType; color: string;
}) {
  const isUp = trend >= 0;
  return (
    <div className="p-3.5" style={{ background: "var(--bg-secondary)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>{label}</span>
        </div>
        <MiniSparkline data={sparkline} color={color} width={48} height={20} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</span>
        <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${isUp ? "text-success" : "text-danger"}`}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}{trend.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/* SOCIAL ROW */
function SocialRow({ icon: Icon, label, value, change }: { icon: React.ElementType; label: string; value: string; change?: number; }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
        <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* PROMOTED PROJECT CARD — uses the same blue featured style as homepage */
function PromotedProjectCard({ project }: { project: Project }) {
  return (
    <div className="relative">
      {/* Promoted label */}
      <div
        className="flex items-center gap-1.5 px-3.5 py-1.5"
        style={{ background: "#1652F0" }}
      >
        <span
          className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.12)" }}
        >
          <Sparkles className="h-2.5 w-2.5" /> Promoted
        </span>
      </div>
      <ProjectCard project={project} variant="featured" />
    </div>
  );
}

/* MILESTONE ITEM */
function MilestoneItem({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const Icon = milestoneTypeIcons[milestone.type] || Circle;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center"
          style={{
            background: milestone.achieved ? "var(--color-success-muted)" : "var(--bg-tertiary)",
          }}
        >
          {milestone.achieved ? <Check className="h-4 w-4 text-success" /> : <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1"
            style={{
              minHeight: "24px",
              background: milestone.achieved ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
            }}
          />
        )}
      </div>
      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p className="text-sm font-medium" style={{ color: milestone.achieved ? "var(--text-primary)" : "var(--text-secondary)" }}>{milestone.title}</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{milestone.description}</p>
        <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(milestone.date)}</p>
      </div>
    </div>
  );
}

/* ALERT MODAL */
function AlertModal({ projectName, onClose, initialSelected, onSave }: { projectName: string; onClose: () => void; initialSelected: Set<string>; onSave: (selected: Set<string>) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [saving, setSaving] = useState(false);
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
        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md p-5 sm:inset-x-auto sm:w-full"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-strong)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Choose Your Signals</h2>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>for {projectName}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center transition-colors" style={{ color: "var(--text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {fullSignalTypes.map((st) => {
            const isChecked = selected.has(st.key);
            return (
              <button
                key={st.key} type="button" onClick={() => toggleType(st.key)}
                className="flex w-full items-start gap-3 p-3 text-left transition-colors"
                style={{ background: isChecked ? "var(--accent-glow)" : "var(--bg-tertiary)" }}
              >
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors"
                  style={{
                    border: isChecked ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
                    background: isChecked ? "var(--accent)" : "transparent",
                  }}
                >
                  {isChecked && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <st.icon className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{st.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{st.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="flex h-9 items-center px-4 text-sm font-medium transition-colors" style={{ color: "var(--text-secondary)" }}>Cancel</button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(selected);
              setSaving(false);
              onClose();
            }}
            className="flex h-9 items-center gap-2 px-4 text-xs uppercase tracking-[0.06em] font-medium text-white transition-colors"
            style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />} Save Preferences
          </button>
        </div>
      </motion.div>
    </>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
