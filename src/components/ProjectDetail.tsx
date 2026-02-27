"use client";

import { useState, useRef, useMemo } from "react";
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

type ChartMetric = "holders" | "marketCap" | "volume24h" | "liquidity";
type ChartPeriod = 7 | 30 | 90;

const CHART_TABS: { key: ChartMetric; label: string; icon: React.ElementType; color: string }[] = [
  { key: "holders", label: "Holders", icon: Users, color: "#3DD7D8" },
  { key: "marketCap", label: "Market Cap", icon: DollarSign, color: "#3DD7D8" },
  { key: "volume24h", label: "Volume", icon: BarChart3, color: "#3DD7D8" },
  { key: "liquidity", label: "Liquidity", icon: Droplets, color: "#22C55E" },
];

function getAvatar(project: Project): string {
  if (project.twitterHandle) return `https://unavatar.io/twitter/${project.twitterHandle}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=1C1D27&color=fff&size=128`;
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

  // Map API data to frontend types
  const snapshots90d = useMemo(
    () => snapshotsData.map(mapApiSnapshot),
    [snapshotsData],
  );
  const healthScore = useMemo(
    () => (healthData ? mapApiHealth(healthData) : null),
    [healthData],
  );
  const whales = useMemo(
    () => whaleWalletsData.map(mapApiWhale),
    [whaleWalletsData],
  );
  const socialData = useMemo(
    () => (socialDataRaw ? mapApiSocial(socialDataRaw) : null),
    [socialDataRaw],
  );

  // Compute chart data for selected metric + period
  const chartData = useMemo(() => {
    const sliced = snapshots90d.slice(-chartPeriod);
    return sliced.map((s) => ({
      timestamp: s.timestamp,
      value: s[chartMetric],
    }));
  }, [snapshots90d, chartMetric, chartPeriod]);

  // Compute latest stats with trends
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

  // Sparkline data for stat cards (7d)
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
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
        <p className="text-xl font-semibold text-text-primary">Project not found</p>
        <Link href="/" className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline">
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
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to discover
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:gap-10">

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="min-w-0 flex-1">

              {/* ─── HEADER ─── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Mobile: compact horizontal layout */}
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-white/10 sm:h-20 sm:w-20 sm:rounded-2xl">
                    <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-[family-name:var(--font-brand)] text-lg font-bold text-text-primary sm:text-2xl leading-tight">
                        {project.name}
                      </h1>
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] sm:px-2.5 bg-[#3DD7D8]/12 text-[#3DD7D8]">
                        {project.category}
                      </span>
                      {healthScore && <HealthScore score={healthScore.overall} size="sm" />}
                    </div>
                    <p className="mt-0.5 text-[13px] text-text-secondary sm:mt-1 sm:text-[15px] line-clamp-2">{project.tagline}</p>
                  </div>
                </div>

                {/* Stats + links row — compact on mobile */}
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-[11px] text-text-tertiary sm:text-[12px]">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{project.watchers.toLocaleString()} watchers</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{comments.length} comments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-surface px-2.5 text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary ring-1 ring-white/5"
                      >
                        <Globe className="h-3 w-3" /> Site
                      </a>
                    )}
                    {project.twitter && (
                      <a
                        href={`https://x.com/${project.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-surface px-2.5 text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary ring-1 ring-white/5"
                      >
                        <Twitter className="h-3 w-3" /> X
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ─── STATS ROW ─── */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  <StatCard
                    label="Holders"
                    value={formatNumber(stats.holders.value)}
                    trend={stats.holders.trend}
                    sparkline={sparklines.holders}
                    icon={Users}
                    color="#3DD7D8"
                  />
                  <StatCard
                    label="Market Cap"
                    value={formatCompact(stats.marketCap.value)}
                    trend={stats.marketCap.trend}
                    sparkline={sparklines.marketCap}
                    icon={DollarSign}
                    color="#3DD7D8"
                  />
                  <StatCard
                    label="24h Volume"
                    value={formatCompact(stats.volume24h.value)}
                    trend={stats.volume24h.trend}
                    sparkline={sparklines.volume24h}
                    icon={BarChart3}
                    color="#3DD7D8"
                  />
                  <StatCard
                    label="Liquidity"
                    value={formatCompact(stats.liquidity.value)}
                    trend={stats.liquidity.trend}
                    sparkline={sparklines.liquidity}
                    icon={Droplets}
                    color="#22C55E"
                  />
                </motion.div>
              )}

              {/* ─── DESCRIPTION ─── */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
                <p className={`text-[14px] leading-relaxed text-text-secondary ${!descExpanded && isLongDesc ? "line-clamp-3" : ""}`}>
                  {description}
                </p>
                {isLongDesc && (
                  <button type="button" onClick={() => setDescExpanded(!descExpanded)} className="mt-1 text-[13px] font-medium text-primary hover:text-primary-hover transition-colors">
                    {descExpanded ? "See less" : "See more"}
                  </button>
                )}
              </motion.div>

              {/* ─── MOBILE: ACTIONS + PROMOTED (before charts) ─── */}
              <div className="mt-6 space-y-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => { if (!watching) setShowAlertModal(true); setWatching(!watching); }}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
                    watching
                      ? "bg-primary text-white shadow-[0_0_20px_rgba(61,215,216,0.2)]"
                      : "bg-surface text-text-primary ring-1 ring-white/10"
                  }`}
                >
                  {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {watching ? "Watching" : "Watch this project"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlertModal(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-surface text-sm font-medium text-text-secondary ring-1 ring-white/10 transition-colors hover:bg-surface-hover"
                >
                  <Bell className="h-4 w-4" /> Configure alerts
                </button>
                {promotedProject && <PromotedProjectCard project={promotedProject} />}
              </div>

              {/* ─── CHART SECTION ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                <div className="rounded-2xl bg-surface p-5">
                  {/* Chart tabs */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-1">
                      {CHART_TABS.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setChartMetric(tab.key)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                            chartMetric === tab.key
                              ? "bg-white/10 text-text-primary"
                              : "text-text-tertiary hover:text-text-secondary hover:bg-white/5"
                          }`}
                        >
                          <tab.icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Period selector */}
                    <div className="flex gap-1">
                      {([7, 30, 90] as ChartPeriod[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setChartPeriod(p)}
                          className={`rounded-md px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] font-medium transition-colors ${
                            chartPeriod === p
                              ? "bg-white/10 text-text-primary"
                              : "text-text-tertiary hover:text-text-secondary"
                          }`}
                        >
                          {p}d
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Chart */}
                  <div className="mt-4">
                    {chartData.length > 0 ? (
                      <AreaChartComponent
                        data={chartData}
                        color={activeChartTab.color}
                        height={280}
                        formatValue={chartMetric === "holders" ? formatNumber : formatCompact}
                      />
                    ) : (
                      <div className="flex h-[280px] items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="mx-auto h-8 w-8 text-text-tertiary" />
                          <p className="mt-2 text-sm text-text-secondary">No data yet</p>
                          <p className="mt-1 text-[11px] text-text-tertiary">Chart data will appear once snapshots are collected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ─── HEALTH + SOCIAL (Two Column) ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                {/* Health Breakdown */}
                {healthScore && <HealthBreakdown health={healthScore} />}

                {/* Social Stats — always visible */}
                <div className="rounded-2xl bg-surface p-5">
                  <h3 className="text-sm font-semibold text-text-primary">Social & Dev</h3>
                  <div className="mt-4 space-y-3">
                    <SocialRow
                      icon={Twitter}
                      label="X Followers"
                      value={socialData ? formatNumber(socialData.xFollowers) : "—"}
                      change={socialData?.xFollowersChange || undefined}
                    />
                    <SocialRow
                      icon={Activity}
                      label="Engagement Rate"
                      value={socialData ? `${socialData.engagementRate.toFixed(1)}%` : "—"}
                    />
                    <SocialRow
                      icon={GitBranch}
                      label="GitHub Commits (30d)"
                      value={socialData ? socialData.githubCommits30d.toString() : "—"}
                    />
                    <SocialRow
                      icon={Activity}
                      label="GitHub Stars"
                      value={socialData ? formatNumber(socialData.githubStars) : "—"}
                    />
                    <SocialRow
                      icon={MessageCircle}
                      label="Farcaster Followers"
                      value={socialData ? formatNumber(socialData.farcasterFollowers) : "—"}
                    />
                    <SocialRow
                      icon={Activity}
                      label="Farcaster Engagement"
                      value={socialData ? `${socialData.farcasterEngagement.toFixed(1)}%` : "—"}
                    />
                  </div>
                </div>
              </motion.div>

              {/* ─── WHALE TABLE ─── */}
              {whales.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <WhaleTable whales={whales} />
                </motion.div>
              )}

              {/* ─── TAB NAVIGATION ─── */}
              <div className="mt-8">
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
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
                              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── MILESTONES ─── */}
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

              {/* ─── COMMENTS (only on reviews tab) ─── */}
              {activeTab === "reviews" && (
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

              {/* ─── MOBILE: COMPANY INFO (after comments) ─── */}
              <div className="mt-8 lg:hidden">
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Company Info</h3>
                  <div className="mt-3 space-y-2.5">
                    {project.website && (
                      <a href={project.website.startsWith("http") ? project.website : `https://${project.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary">
                        <Globe className="h-4 w-4" /><span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span><ExternalLink className="h-3 w-3 text-text-tertiary" />
                      </a>
                    )}
                    {project.twitter && (
                      <a href={`https://x.com/${project.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary">
                        <Twitter className="h-4 w-4" /><span>@{project.twitter}</span><ExternalLink className="h-3 w-3 text-text-tertiary" />
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-[#8B8B9E]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3DD7D8]/15">
                        <span className="block h-2 w-2 rounded-full bg-[#3DD7D8]" />
                      </span>
                      <span>{project.category}</span>
                      {project.subcategory && (<><span className="text-[#52526B]">/</span><span className="text-[#52526B]">{project.subcategory}</span></>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT SIDEBAR ═══ */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden w-[320px] shrink-0 lg:block"
            >
              <div className="sticky top-20 space-y-4">
                {/* Watch — primary CTA */}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { login(); return; }
                    if (!watching) setShowAlertModal(true);
                    setWatching(!watching);
                  }}
                  className={`group flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold transition-all duration-200 ${
                    watching
                      ? "bg-primary text-white shadow-[0_0_24px_rgba(61,215,216,0.25)]"
                      : "bg-surface text-text-primary ring-1 ring-white/10 hover:bg-surface-hover hover:ring-primary/30 hover:shadow-[0_0_16px_rgba(61,215,216,0.1)]"
                  }`}
                >
                  {watching ? <Check className="h-5 w-5" /> : <Eye className={`h-5 w-5 transition-transform ${watching ? "" : "group-hover:scale-110"}`} />}
                  <span>{watching ? "Watching" : "Watch this project"}</span>
                </button>

                {/* Promoted */}
                {promotedProject && <PromotedProjectCard project={promotedProject} />}

                {/* Alert Preferences */}
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
                        <button key={st.key} type="button" onClick={() => toggleAlertPref(st.key)} className="flex w-full items-center gap-3 text-left">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <st.icon className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                            <div className="min-w-0">
                              <span className="block text-[13px] font-medium text-text-primary truncate">{st.label}</span>
                              <span className="block text-[11px] text-text-tertiary truncate">{st.desc}</span>
                            </div>
                          </div>
                          <div className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${active ? "bg-primary" : "bg-surface-hover"}`}>
                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Info */}
                <div className="rounded-2xl bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Company Info</h3>
                  <div className="mt-3 space-y-2.5">
                    {project.website && (
                      <a
                        href={project.website.startsWith("http") ? project.website : `https://${project.website}`}
                        target="_blank" rel="noopener noreferrer"
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
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-text-secondary transition-colors hover:text-primary"
                      >
                        <Twitter className="h-4 w-4 flex-shrink-0" />
                        <span>@{project.twitter}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-tertiary" />
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-[#8B8B9E]">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#3DD7D8]/15">
                        <span className="block h-2 w-2 rounded-full bg-[#3DD7D8]" />
                      </span>
                      <span>{project.category}</span>
                      {project.subcategory && (<><span className="text-text-tertiary">/</span><span className="text-text-tertiary">{project.subcategory}</span></>)}
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
        {showAlertModal && <AlertModal projectName={project.name} onClose={() => setShowAlertModal(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── STAT CARD ─── */
function StatCard({
  label,
  value,
  trend,
  sparkline,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  trend: number;
  sparkline: number[];
  icon: React.ElementType;
  color: string;
}) {
  const isUp = trend >= 0;
  return (
    <div className="rounded-xl bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">{label}</span>
        </div>
        <MiniSparkline data={sparkline} color={color} width={48} height={20} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-mono)] text-lg font-bold text-text-primary">{value}</span>
        <span className={`flex items-center gap-0.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold ${isUp ? "text-success" : "text-danger"}`}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}{trend.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/* ─── SOCIAL ROW ─── */
function SocialRow({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-[13px] text-text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-text-primary">{value}</span>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── MOBILE SIDEBAR CONTENT ─── */
function MobileSidebarContent({
  project,
  upvoted,
  upvoting,
  upvoteCount,
  watching,
  promotedProject,
  onUpvote,
  onToggleWatch,
  onOpenAlertModal,
}: {
  project: Project;
  upvoted: boolean;
  upvoting: boolean;
  upvoteCount: number;
  watching: boolean;
  alertPrefs: Set<string>;
  promotedProject: Project | null;
  onUpvote: () => void;
  onToggleWatch: () => void;
  onToggleAlertPref: (key: string) => void;
  onOpenAlertModal: () => void;
}) {
  return (
    <>
      {promotedProject && <PromotedProjectCard project={promotedProject} />}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onUpvote}
          disabled={upvoting}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
            upvoted
              ? "bg-[#3DD7D8] text-white"
              : "bg-[#13141B] text-[#E8E8ED] ring-1 ring-white/10"
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
              ? "bg-[#3DD7D8]/15 text-[#3DD7D8] ring-1 ring-[#3DD7D8]/20"
              : "bg-[#13141B] text-[#8B8B9E] ring-1 ring-white/10"
          }`}
        >
          {watching ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {watching ? "Following" : "Watch"}
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenAlertModal}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#13141B] text-sm font-medium text-[#8B8B9E] ring-1 ring-white/10 transition-colors hover:bg-[#1A1B23]"
      >
        <Bell className="h-4 w-4" /> Configure alerts
      </button>
      <div className="rounded-2xl bg-[#13141B] p-4">
        <h3 className="text-sm font-semibold text-[#E8E8ED]">Company Info</h3>
        <div className="mt-3 space-y-2.5">
          {project.website && (
            <a href={project.website.startsWith("http") ? project.website : `https://${project.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[#8B8B9E] transition-colors hover:text-[#3DD7D8]">
              <Globe className="h-4 w-4" /><span className="truncate">{project.website.replace(/^https?:\/\//, "")}</span><ExternalLink className="h-3 w-3 text-[#52526B]" />
            </a>
          )}
          {project.twitter && (
            <a href={`https://x.com/${project.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-[#8B8B9E] transition-colors hover:text-[#3DD7D8]">
              <Twitter className="h-4 w-4" /><span>@{project.twitter}</span><ExternalLink className="h-3 w-3 text-[#52526B]" />
            </a>
          )}
          <div className="flex items-center gap-2.5 text-sm text-[#8B8B9E]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3DD7D8]/15">
              <span className="block h-2 w-2 rounded-full bg-[#3DD7D8]" />
            </span>
            <span>{project.category}</span>
            {project.subcategory && (<><span className="text-[#52526B]">/</span><span className="text-[#52526B]">{project.subcategory}</span></>)}
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
      <div className="relative overflow-hidden rounded-2xl bg-[#13141B] border-l-2 border-[#3DD7D8] p-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-[#1A1B23]">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#E8E8ED] uppercase">
            <Sparkles className="h-2.5 w-2.5" /> Promoted
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/10">
            <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-[#E8E8ED] truncate">{project.name}</h4>
            <p className="text-[11px] text-[#8B8B9E] truncate">{project.tagline}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-[#3DD7D8] transition-colors group-hover:text-[#50E5E6]">
          Check it out <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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

/* ─── ALERT MODAL ─── */
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
