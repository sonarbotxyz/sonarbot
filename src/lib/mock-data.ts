export type Category = "DeFi" | "Social" | "NFT" | "Infra" | "Gaming" | "Tools";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  subcategory: string;
  upvotes: number;
  watchers: number;
  isHot: boolean;
  isNew: boolean;
  launchDate?: string;
  website?: string;
  twitter?: string;
  logoUrl?: string;
  twitterHandle?: string;
  milestones: Milestone[];
  comments: Comment[];
  // Optional analytics fields (populated from real API data)
  healthScore?: number | null;
  latestSnapshot?: {
    holders: number;
    marketcap: number;
    volume_24h: number;
    liquidity: number;
  } | null;
  recentSnapshots?: Array<{
    timestamp: string;
    holders: number;
    marketcap: number;
    volume_24h: number;
    liquidity: number;
  }>;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  achieved: boolean;
  type: "metrics" | "launch" | "partnership" | "token" | "update";
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
  upvotes: number;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  category: Category;
  title: string;
  description: string;
  date: string;
  type: "metrics" | "launch" | "partnership" | "token" | "update";
  read: boolean;
}

export const CATEGORY_COLORS: Record<Category, { from: string; to: string; glow: string }> = {
  DeFi: { from: "#0052FF", to: "#3B82F6", glow: "shadow-glow-blue" },
  Social: { from: "#8B5CF6", to: "#A78BFA", glow: "shadow-glow-purple" },
  NFT: { from: "#EC4899", to: "#F472B6", glow: "shadow-glow-pink" },
  Infra: { from: "#00D897", to: "#34D399", glow: "shadow-glow-green" },
  Gaming: { from: "#F59E0B", to: "#FBBF24", glow: "shadow-glow-orange" },
  Tools: { from: "#6B7280", to: "#9CA3AF", glow: "shadow-glow-gray" },
};

export const CATEGORIES: Category[] = ["DeFi", "Social", "NFT", "Infra", "Gaming", "Tools"];

export const projects: Project[] = [
  {
    id: "aerodrome",
    name: "Aerodrome",
    tagline: "The central trading & liquidity hub on Base",
    description:
      "Aerodrome Finance is a next-generation AMM designed to serve as Base's central liquidity hub, combining a powerful liquidity incentive engine, vote-lock governance model, and friendly user experience. It has become the leading DEX on Base by TVL.",
    category: "DeFi",
    subcategory: "DEX",
    upvotes: 847,
    watchers: 2341,
    isHot: true,
    isNew: false,
    website: "https://aerodrome.finance",
    milestones: [
      { id: "m1", title: "TVL crossed $500M", description: "Total value locked surpassed half a billion dollars", date: "2025-12-15", achieved: true, type: "metrics" },
      { id: "m2", title: "Launched Slipstream V2", description: "New concentrated liquidity engine deployed", date: "2026-01-20", achieved: true, type: "launch" },
      { id: "m3", title: "1M unique traders", description: "Approaching one million unique trading wallets", date: "2026-03-01", achieved: false, type: "metrics" },
    ],
    comments: [
      { id: "c1", author: "0xdefi_maxi", text: "The Slipstream update is incredible. Concentrated liquidity finally done right.", date: "2026-02-20", upvotes: 24 },
      { id: "c2", author: "base_builder", text: "Best yields on Base, hands down. The ve tokenomics are clean.", date: "2026-02-18", upvotes: 18 },
    ],
    healthScore: 89,
    latestSnapshot: { holders: 45200, marketcap: 823_000_000, volume_24h: 85_400_000, liquidity: 521_000_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 43800, marketcap: 795_000_000, volume_24h: 72_000_000, liquidity: 498_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 44000, marketcap: 802_000_000, volume_24h: 78_000_000, liquidity: 503_000_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 44200, marketcap: 810_000_000, volume_24h: 81_000_000, liquidity: 508_000_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 44500, marketcap: 815_000_000, volume_24h: 76_000_000, liquidity: 512_000_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 44800, marketcap: 818_000_000, volume_24h: 82_000_000, liquidity: 515_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 45000, marketcap: 820_000_000, volume_24h: 79_000_000, liquidity: 518_000_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 45200, marketcap: 823_000_000, volume_24h: 85_400_000, liquidity: 521_000_000 },
    ],
  },
  {
    id: "friend-tech-v2",
    name: "Friend.tech V2",
    tagline: "Tokenized social connections on Base",
    description:
      "Friend.tech is a decentralized social protocol where users can trade keys representing social connections. V2 introduces clubs, improved trading mechanics, and cross-chain social graphs built natively on Base.",
    category: "Social",
    subcategory: "SocialFi",
    upvotes: 623,
    watchers: 1856,
    isHot: true,
    isNew: false,
    website: "https://friend.tech",
    milestones: [
      { id: "m1", title: "V2 Launch", description: "Full V2 protocol deployed with clubs feature", date: "2026-01-10", achieved: true, type: "launch" },
      { id: "m2", title: "100K active users", description: "Daily active users crossed 100K", date: "2026-02-01", achieved: true, type: "metrics" },
      { id: "m3", title: "Cross-chain expansion", description: "Social graph bridging to other L2s", date: "2026-04-01", achieved: false, type: "partnership" },
    ],
    comments: [
      { id: "c1", author: "social_degen", text: "Clubs feature is actually sick. Way better than V1.", date: "2026-02-22", upvotes: 31 },
    ],
    healthScore: 72,
    latestSnapshot: { holders: 28800, marketcap: 124_000_000, volume_24h: 12_300_000, liquidity: 18_500_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 27200, marketcap: 115_000_000, volume_24h: 14_000_000, liquidity: 17_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 27500, marketcap: 118_000_000, volume_24h: 11_000_000, liquidity: 17_200_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 27800, marketcap: 120_000_000, volume_24h: 13_000_000, liquidity: 17_500_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 28000, marketcap: 119_000_000, volume_24h: 10_000_000, liquidity: 17_800_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 28200, marketcap: 121_000_000, volume_24h: 12_000_000, liquidity: 18_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 28500, marketcap: 122_000_000, volume_24h: 11_500_000, liquidity: 18_200_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 28800, marketcap: 124_000_000, volume_24h: 12_300_000, liquidity: 18_500_000 },
    ],
  },
  {
    id: "base-paint",
    name: "BasePaint",
    tagline: "Collaborative pixel art canvas, one day at a time",
    description:
      "BasePaint is a collaborative NFT project where a new canvas opens every 24 hours. Users mint brush strokes as NFTs to paint on a shared canvas. Each completed canvas becomes a unique piece of community art.",
    category: "NFT",
    subcategory: "Art",
    upvotes: 412,
    watchers: 1203,
    isHot: false,
    isNew: false,
    website: "https://basepaint.xyz",
    milestones: [
      { id: "m1", title: "Day 500 Canvas", description: "500 consecutive days of community art", date: "2026-02-10", achieved: true, type: "metrics" },
      { id: "m2", title: "Gallery feature", description: "On-chain gallery for browsing past canvases", date: "2026-03-15", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "pixel_lord", text: "500 days straight of community art. This is what crypto culture looks like.", date: "2026-02-12", upvotes: 42 },
    ],
    healthScore: 64,
    latestSnapshot: { holders: 8600, marketcap: 15_200_000, volume_24h: 1_200_000, liquidity: 3_200_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 8400, marketcap: 14_500_000, volume_24h: 1_100_000, liquidity: 3_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 8420, marketcap: 14_600_000, volume_24h: 900_000, liquidity: 3_050_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 8450, marketcap: 14_800_000, volume_24h: 1_300_000, liquidity: 3_080_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 8480, marketcap: 14_900_000, volume_24h: 1_000_000, liquidity: 3_100_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 8520, marketcap: 15_000_000, volume_24h: 1_150_000, liquidity: 3_120_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 8560, marketcap: 15_100_000, volume_24h: 1_100_000, liquidity: 3_150_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 8600, marketcap: 15_200_000, volume_24h: 1_200_000, liquidity: 3_200_000 },
    ],
  },
  {
    id: "base-bridge",
    name: "Base Bridge",
    tagline: "The official Base L1 to L2 bridge",
    description:
      "The native bridge for moving assets between Ethereum mainnet and Base. Optimized for security and speed with canonical messaging and fraud proof support.",
    category: "Infra",
    subcategory: "Bridge",
    upvotes: 356,
    watchers: 987,
    isHot: false,
    isNew: false,
    milestones: [
      { id: "m1", title: "$2B total bridged", description: "Cumulative bridge volume crossed $2 billion", date: "2026-01-05", achieved: true, type: "metrics" },
      { id: "m2", title: "Fast withdrawal mode", description: "Sub-10-minute withdrawals with liquidity providers", date: "2026-03-20", achieved: false, type: "launch" },
    ],
    comments: [],
    healthScore: 78,
    latestSnapshot: { holders: 65000, marketcap: 0, volume_24h: 45_000_000, liquidity: 182_000_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 63200, marketcap: 0, volume_24h: 38_000_000, liquidity: 175_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 63500, marketcap: 0, volume_24h: 41_000_000, liquidity: 176_000_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 63800, marketcap: 0, volume_24h: 39_000_000, liquidity: 177_000_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 64100, marketcap: 0, volume_24h: 43_000_000, liquidity: 178_000_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 64400, marketcap: 0, volume_24h: 42_000_000, liquidity: 179_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 64700, marketcap: 0, volume_24h: 44_000_000, liquidity: 180_000_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 65000, marketcap: 0, volume_24h: 45_000_000, liquidity: 182_000_000 },
    ],
  },
  {
    id: "onchain-arcade",
    name: "Onchain Arcade",
    tagline: "Fully on-chain casual games with leaderboards",
    description:
      "A collection of casual games with fully on-chain state. Compete on leaderboards, earn achievements as NFTs, and wager on matches. All game logic lives on Base smart contracts.",
    category: "Gaming",
    subcategory: "Casual",
    upvotes: 289,
    watchers: 764,
    isHot: false,
    isNew: true,
    milestones: [
      { id: "m1", title: "5 games launched", description: "Five playable games live on mainnet", date: "2026-02-01", achieved: true, type: "launch" },
      { id: "m2", title: "Tournament mode", description: "Bracket-style tournaments with prize pools", date: "2026-04-01", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "game_anon", text: "The snake game is oddly addictive. On-chain high scores hit different.", date: "2026-02-15", upvotes: 15 },
    ],
    healthScore: 55,
    latestSnapshot: { holders: 3200, marketcap: 8_100_000, volume_24h: 800_000, liquidity: 1_500_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 2400, marketcap: 5_200_000, volume_24h: 500_000, liquidity: 1_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 2550, marketcap: 5_800_000, volume_24h: 600_000, liquidity: 1_100_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 2700, marketcap: 6_400_000, volume_24h: 650_000, liquidity: 1_150_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 2850, marketcap: 6_900_000, volume_24h: 700_000, liquidity: 1_200_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 2950, marketcap: 7_200_000, volume_24h: 720_000, liquidity: 1_300_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 3080, marketcap: 7_600_000, volume_24h: 750_000, liquidity: 1_400_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 3200, marketcap: 8_100_000, volume_24h: 800_000, liquidity: 1_500_000 },
    ],
  },
  {
    id: "basescan-tools",
    name: "Basescan Tools",
    tagline: "Advanced analytics & dev tools for Base",
    description:
      "Enhanced block explorer tooling for Base developers and power users. Includes contract verification, API access, token tracker, gas tracker, and advanced analytics dashboards.",
    category: "Tools",
    subcategory: "Analytics",
    upvotes: 198,
    watchers: 543,
    isHot: false,
    isNew: false,
    website: "https://basescan.org",
    milestones: [
      { id: "m1", title: "API V2 launch", description: "New REST API with enhanced rate limits", date: "2026-01-25", achieved: true, type: "launch" },
    ],
    comments: [],
    healthScore: 71,
    latestSnapshot: { holders: 12000, marketcap: 25_000_000, volume_24h: 2_500_000, liquidity: 5_100_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 11700, marketcap: 24_000_000, volume_24h: 2_300_000, liquidity: 4_800_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 11750, marketcap: 24_200_000, volume_24h: 2_400_000, liquidity: 4_850_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 11800, marketcap: 24_300_000, volume_24h: 2_350_000, liquidity: 4_900_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 11850, marketcap: 24_500_000, volume_24h: 2_400_000, liquidity: 4_950_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 11900, marketcap: 24_700_000, volume_24h: 2_450_000, liquidity: 5_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 11950, marketcap: 24_800_000, volume_24h: 2_480_000, liquidity: 5_050_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 12000, marketcap: 25_000_000, volume_24h: 2_500_000, liquidity: 5_100_000 },
    ],
  },
  {
    id: "seamless-protocol",
    name: "Seamless Protocol",
    tagline: "Native lending & borrowing on Base",
    description:
      "Seamless is an integrated lending and borrowing protocol built natively for Base. It features ILMs (Integrated Liquidity Markets) that automate leveraged yield strategies in a single click.",
    category: "DeFi",
    subcategory: "Lending",
    upvotes: 534,
    watchers: 1567,
    isHot: true,
    isNew: false,
    website: "https://seamless.fi",
    milestones: [
      { id: "m1", title: "ILM V2 strategies", description: "New automated leverage strategies launched", date: "2026-02-05", achieved: true, type: "launch" },
      { id: "m2", title: "TVL crossed $200M", description: "Protocol TVL surpassed $200 million", date: "2026-02-18", achieved: true, type: "metrics" },
      { id: "m3", title: "Multi-collateral vaults", description: "Support for multi-asset collateral positions", date: "2026-04-15", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "yield_farmer", text: "ILMs are game-changing. One-click leverage without the headache.", date: "2026-02-10", upvotes: 27 },
    ],
    healthScore: 84,
    latestSnapshot: { holders: 22400, marketcap: 178_000_000, volume_24h: 28_500_000, liquidity: 212_000_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 21200, marketcap: 162_000_000, volume_24h: 24_000_000, liquidity: 195_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 21400, marketcap: 165_000_000, volume_24h: 25_000_000, liquidity: 198_000_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 21600, marketcap: 168_000_000, volume_24h: 26_000_000, liquidity: 201_000_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 21800, marketcap: 170_000_000, volume_24h: 25_500_000, liquidity: 204_000_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 22000, marketcap: 173_000_000, volume_24h: 27_000_000, liquidity: 207_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 22200, marketcap: 175_000_000, volume_24h: 27_500_000, liquidity: 209_000_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 22400, marketcap: 178_000_000, volume_24h: 28_500_000, liquidity: 212_000_000 },
    ],
  },
  {
    id: "zora-base",
    name: "Zora",
    tagline: "Mint, earn, and collect on Base",
    description:
      "Zora is a decentralized protocol for creating and collecting NFTs. On Base, Zora enables ultra-low-cost minting, protocol rewards for creators and collectors, and a vibrant on-chain media ecosystem.",
    category: "NFT",
    subcategory: "Marketplace",
    upvotes: 478,
    watchers: 1432,
    isHot: false,
    isNew: false,
    website: "https://zora.co",
    milestones: [
      { id: "m1", title: "10M mints on Base", description: "Ten million NFTs minted through the protocol on Base", date: "2026-01-30", achieved: true, type: "metrics" },
      { id: "m2", title: "Creator toolkit v3", description: "Enhanced tools for creators including splits and editions", date: "2026-03-10", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "nft_collector", text: "Minting for pennies on Base. This is what mass adoption looks like.", date: "2026-02-05", upvotes: 36 },
    ],
    healthScore: 76,
    latestSnapshot: { holders: 35200, marketcap: 95_000_000, volume_24h: 8_300_000, liquidity: 12_500_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 34500, marketcap: 91_000_000, volume_24h: 7_500_000, liquidity: 12_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 34600, marketcap: 92_000_000, volume_24h: 7_800_000, liquidity: 12_100_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 34700, marketcap: 92_500_000, volume_24h: 8_000_000, liquidity: 12_150_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 34800, marketcap: 93_000_000, volume_24h: 7_900_000, liquidity: 12_200_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 34950, marketcap: 93_500_000, volume_24h: 8_100_000, liquidity: 12_300_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 35100, marketcap: 94_200_000, volume_24h: 8_200_000, liquidity: 12_400_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 35200, marketcap: 95_000_000, volume_24h: 8_300_000, liquidity: 12_500_000 },
    ],
  },
  {
    id: "degen-chain",
    name: "Degen Chain",
    tagline: "L3 rollup for the Degen community",
    description:
      "Degen Chain is an L3 built on Base, powered by the DEGEN token. It provides an ultra-fast, ultra-cheap environment for Degen community applications, tipping, and social experiments.",
    category: "Infra",
    subcategory: "L3",
    upvotes: 367,
    watchers: 1089,
    isHot: false,
    isNew: false,
    website: "https://degen.tips",
    milestones: [
      { id: "m1", title: "Mainnet launch", description: "Degen L3 mainnet went live", date: "2025-11-15", achieved: true, type: "launch" },
      { id: "m2", title: "500K transactions/day", description: "Daily transaction count crossed half a million", date: "2026-02-20", achieved: true, type: "metrics" },
    ],
    comments: [],
    healthScore: 68,
    latestSnapshot: { holders: 18500, marketcap: 45_000_000, volume_24h: 6_100_000, liquidity: 8_200_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 18900, marketcap: 48_000_000, volume_24h: 7_200_000, liquidity: 8_800_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 18850, marketcap: 47_500_000, volume_24h: 6_800_000, liquidity: 8_600_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 18800, marketcap: 47_000_000, volume_24h: 6_500_000, liquidity: 8_500_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 18750, marketcap: 46_500_000, volume_24h: 6_400_000, liquidity: 8_400_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 18700, marketcap: 46_000_000, volume_24h: 6_300_000, liquidity: 8_350_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 18600, marketcap: 45_500_000, volume_24h: 6_200_000, liquidity: 8_250_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 18500, marketcap: 45_000_000, volume_24h: 6_100_000, liquidity: 8_200_000 },
    ],
  },
  {
    id: "farcaster-frames",
    name: "Farcaster Frames",
    tagline: "Interactive mini-apps inside Farcaster posts",
    description:
      "Frames transform Farcaster posts into interactive applications. Developers build rich experiences — polls, games, mints, trades — that users interact with directly in their social feed, all powered by Base.",
    category: "Social",
    subcategory: "Developer Tools",
    upvotes: 445,
    watchers: 1678,
    isHot: true,
    isNew: false,
    milestones: [
      { id: "m1", title: "Frames V2 spec", description: "New Frames specification with richer capabilities", date: "2026-01-15", achieved: true, type: "launch" },
      { id: "m2", title: "10K active frames", description: "Over ten thousand actively used frames in the wild", date: "2026-03-01", achieved: false, type: "metrics" },
    ],
    comments: [
      { id: "c1", author: "frame_dev", text: "Frames V2 opens up so many possibilities. The SDK is excellent.", date: "2026-02-01", upvotes: 22 },
    ],
    healthScore: 81,
    latestSnapshot: { holders: 15300, marketcap: 65_000_000, volume_24h: 5_200_000, liquidity: 9_400_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 14500, marketcap: 58_000_000, volume_24h: 4_200_000, liquidity: 8_500_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 14600, marketcap: 59_000_000, volume_24h: 4_500_000, liquidity: 8_600_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 14750, marketcap: 60_000_000, volume_24h: 4_800_000, liquidity: 8_800_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 14900, marketcap: 61_000_000, volume_24h: 4_600_000, liquidity: 8_900_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 15000, marketcap: 62_500_000, volume_24h: 5_000_000, liquidity: 9_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 15150, marketcap: 63_500_000, volume_24h: 5_100_000, liquidity: 9_200_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 15300, marketcap: 65_000_000, volume_24h: 5_200_000, liquidity: 9_400_000 },
    ],
  },
  {
    id: "coinbase-wallet",
    name: "Coinbase Smart Wallet",
    tagline: "Passkey-powered smart wallet on Base",
    description:
      "Coinbase Smart Wallet uses passkeys instead of seed phrases, enabling gasless transactions and seamless onboarding. The smart contract wallet supports batched transactions, session keys, and social recovery.",
    category: "Tools",
    subcategory: "Wallet",
    upvotes: 512,
    watchers: 1890,
    isHot: true,
    isNew: false,
    website: "https://wallet.coinbase.com",
    milestones: [
      { id: "m1", title: "1M wallets created", description: "One million smart wallets deployed on Base", date: "2026-02-10", achieved: true, type: "metrics" },
      { id: "m2", title: "Cross-app sessions", description: "Persistent sessions across dApps without re-auth", date: "2026-03-25", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "ux_anon", text: "No seed phrase, no gas popups. This is what onboarding should feel like.", date: "2026-02-14", upvotes: 45 },
    ],
    healthScore: 88,
    latestSnapshot: { holders: 125000, marketcap: 0, volume_24h: 0, liquidity: 0 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 118000, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 119000, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 120000, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 121000, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 122000, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 123500, marketcap: 0, volume_24h: 0, liquidity: 0 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 125000, marketcap: 0, volume_24h: 0, liquidity: 0 },
    ],
  },
  {
    id: "parallel-tcg",
    name: "Parallel TCG",
    tagline: "Sci-fi trading card game with on-chain assets",
    description:
      "Parallel is a sci-fi themed trading card game where cards are NFTs. Play matches on Base with near-instant transactions and low fees. Earn rewards, trade cards, and compete in ranked seasons.",
    category: "Gaming",
    subcategory: "TCG",
    upvotes: 334,
    watchers: 921,
    isHot: false,
    isNew: true,
    website: "https://parallel.life",
    milestones: [
      { id: "m1", title: "Season 2 launch", description: "Second competitive season with new card set", date: "2026-02-15", achieved: true, type: "launch" },
      { id: "m2", title: "Mobile app", description: "Native iOS and Android client", date: "2026-05-01", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "tcg_whale", text: "Best TCG in crypto, not even close. The art direction is insane.", date: "2026-02-17", upvotes: 19 },
    ],
    healthScore: 62,
    latestSnapshot: { holders: 9200, marketcap: 38_000_000, volume_24h: 3_400_000, liquidity: 6_800_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 8200, marketcap: 32_000_000, volume_24h: 2_800_000, liquidity: 5_800_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 8350, marketcap: 33_000_000, volume_24h: 2_900_000, liquidity: 6_000_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 8500, marketcap: 34_000_000, volume_24h: 3_000_000, liquidity: 6_200_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 8650, marketcap: 35_000_000, volume_24h: 3_100_000, liquidity: 6_300_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 8800, marketcap: 36_000_000, volume_24h: 3_200_000, liquidity: 6_500_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 9000, marketcap: 37_000_000, volume_24h: 3_300_000, liquidity: 6_600_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 9200, marketcap: 38_000_000, volume_24h: 3_400_000, liquidity: 6_800_000 },
    ],
  },
  {
    id: "virtuals-protocol",
    name: "Virtuals Protocol",
    tagline: "AI agent token launchpad powering autonomous agents on Base",
    description:
      "Virtuals Protocol is the leading AI agent token launchpad on Base. Create, deploy, and trade AI agents as tokens. Each agent has on-chain autonomy — managing treasuries, executing trades, and interacting with protocols. The VIRTUAL token fuels agent creation and governance.",
    category: "DeFi",
    subcategory: "AI Launchpad",
    upvotes: 1243,
    watchers: 3420,
    isHot: true,
    isNew: false,
    website: "https://virtuals.io",
    milestones: [
      { id: "m1", title: "1,000 agents deployed", description: "Over one thousand autonomous AI agents live on Base", date: "2026-01-28", achieved: true, type: "metrics" },
      { id: "m2", title: "$500M agent TVL", description: "Total value managed by AI agents crossed half a billion", date: "2026-02-15", achieved: true, type: "metrics" },
      { id: "m3", title: "Agent SDK V2", description: "Next-gen SDK enabling multi-chain agent operations", date: "2026-03-20", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "ai_degen", text: "This is the AI x DeFi meta. Agent tokens are printing. The launchpad UX is elite.", date: "2026-02-25", upvotes: 67 },
      { id: "c2", author: "0xresearcher", text: "Seriously impressive tech. The autonomous treasury management actually works.", date: "2026-02-22", upvotes: 41 },
    ],
    healthScore: 91,
    latestSnapshot: { holders: 32500, marketcap: 348_000_000, volume_24h: 124_000_000, liquidity: 45_200_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 25000, marketcap: 210_000_000, volume_24h: 85_000_000, liquidity: 32_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 26500, marketcap: 238_000_000, volume_24h: 95_000_000, liquidity: 34_500_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 28000, marketcap: 265_000_000, volume_24h: 105_000_000, liquidity: 37_000_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 29200, marketcap: 288_000_000, volume_24h: 110_000_000, liquidity: 39_000_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 30500, marketcap: 310_000_000, volume_24h: 115_000_000, liquidity: 41_000_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 31500, marketcap: 330_000_000, volume_24h: 120_000_000, liquidity: 43_000_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 32500, marketcap: 348_000_000, volume_24h: 124_000_000, liquidity: 45_200_000 },
    ],
  },
  {
    id: "aero-yield",
    name: "Aero",
    tagline: "Automated yield aggregator built on Aerodrome",
    description:
      "Aero is a yield optimization protocol that auto-compounds and rebalances liquidity positions on Aerodrome. Deposit into vaults that maximize AERO rewards through intelligent vote allocation and position management. Built by DeFi natives, for DeFi natives.",
    category: "DeFi",
    subcategory: "Yield",
    upvotes: 178,
    watchers: 612,
    isHot: false,
    isNew: true,
    website: "https://aero.fi",
    milestones: [
      { id: "m1", title: "Beta launch", description: "First vaults live with curated Aerodrome pools", date: "2026-02-20", achieved: true, type: "launch" },
      { id: "m2", title: "$50M TVL target", description: "Targeting $50M in vault deposits", date: "2026-04-01", achieved: false, type: "metrics" },
    ],
    comments: [
      { id: "c1", author: "yield_maxi", text: "Finally a proper auto-compounder for Aerodrome. The vault APYs are insane right now.", date: "2026-02-28", upvotes: 23 },
    ],
    healthScore: 58,
    latestSnapshot: { holders: 4800, marketcap: 28_000_000, volume_24h: 5_200_000, liquidity: 12_400_000 },
    recentSnapshots: [
      { timestamp: "2026-02-25T00:00:00Z", holders: 2800, marketcap: 15_000_000, volume_24h: 3_000_000, liquidity: 8_000_000 },
      { timestamp: "2026-02-26T00:00:00Z", holders: 3100, marketcap: 17_000_000, volume_24h: 3_500_000, liquidity: 8_500_000 },
      { timestamp: "2026-02-27T00:00:00Z", holders: 3400, marketcap: 19_000_000, volume_24h: 3_800_000, liquidity: 9_200_000 },
      { timestamp: "2026-02-28T00:00:00Z", holders: 3700, marketcap: 21_000_000, volume_24h: 4_000_000, liquidity: 9_800_000 },
      { timestamp: "2026-03-01T00:00:00Z", holders: 4000, marketcap: 23_000_000, volume_24h: 4_300_000, liquidity: 10_500_000 },
      { timestamp: "2026-03-02T00:00:00Z", holders: 4400, marketcap: 25_500_000, volume_24h: 4_800_000, liquidity: 11_500_000 },
      { timestamp: "2026-03-03T00:00:00Z", holders: 4800, marketcap: 28_000_000, volume_24h: 5_200_000, liquidity: 12_400_000 },
    ],
  },
];

export const upcomingProjects: (Project & { launchDate: string })[] = [
  {
    id: "morpho-base",
    name: "Morpho Blue",
    tagline: "Permissionless lending markets on Base",
    description: "Morpho Blue brings permissionless, immutable lending markets to Base. Create isolated lending pairs with custom oracles, LTVs, and interest rate models.",
    category: "DeFi",
    subcategory: "Lending",
    upvotes: 203,
    watchers: 678,
    isHot: false,
    isNew: true,
    launchDate: "2026-03-05",
    milestones: [],
    comments: [],
  },
  {
    id: "onchain-music",
    name: "Sound Protocol",
    tagline: "Music NFTs and artist-first streaming",
    description: "Sound Protocol enables musicians to release songs as NFTs on Base, with streaming revenue sharing and community-driven curation.",
    category: "NFT",
    subcategory: "Music",
    upvotes: 156,
    watchers: 445,
    isHot: false,
    isNew: true,
    launchDate: "2026-03-12",
    milestones: [],
    comments: [],
  },
  {
    id: "base-quest",
    name: "BaseQuest",
    tagline: "On-chain RPG adventure",
    description: "A fully on-chain RPG where game state, items, and characters live as smart contracts on Base. Play quests, craft items, and trade with other adventurers.",
    category: "Gaming",
    subcategory: "RPG",
    upvotes: 189,
    watchers: 534,
    isHot: false,
    isNew: true,
    launchDate: "2026-03-20",
    milestones: [],
    comments: [],
  },
  {
    id: "warpcast-pro",
    name: "Warpcast Pro",
    tagline: "Premium Farcaster client with analytics",
    description: "Enhanced Farcaster client with cast analytics, audience insights, scheduled posts, and advanced moderation tools. Powered by Base for premium feature payments.",
    category: "Social",
    subcategory: "Client",
    upvotes: 134,
    watchers: 389,
    isHot: false,
    isNew: true,
    launchDate: "2026-04-01",
    milestones: [],
    comments: [],
  },
  {
    id: "base-relay",
    name: "Base Relay",
    tagline: "Cross-chain messaging infrastructure",
    description: "A decentralized relay network for cross-chain communication between Base and other rollups. Enables trustless message passing, state verification, and atomic cross-chain transactions.",
    category: "Infra",
    subcategory: "Messaging",
    upvotes: 112,
    watchers: 298,
    isHot: false,
    isNew: true,
    launchDate: "2026-04-15",
    milestones: [],
    comments: [],
  },
];

export const alerts: Alert[] = [
  {
    id: "a1",
    projectId: "aerodrome",
    projectName: "Aerodrome",
    category: "DeFi",
    title: "TVL crossed $500M",
    description: "Aerodrome total value locked surpassed half a billion dollars",
    date: "2026-02-24T14:30:00Z",
    type: "metrics",
    read: false,
  },
  {
    id: "a2",
    projectId: "seamless-protocol",
    projectName: "Seamless Protocol",
    category: "DeFi",
    title: "ILM V2 strategies launched",
    description: "New automated leverage strategies are now live on Seamless",
    date: "2026-02-23T10:00:00Z",
    type: "launch",
    read: false,
  },
  {
    id: "a3",
    projectId: "friend-tech-v2",
    projectName: "Friend.tech V2",
    category: "Social",
    title: "100K daily active users",
    description: "Friend.tech V2 crossed 100,000 daily active users",
    date: "2026-02-22T18:15:00Z",
    type: "metrics",
    read: true,
  },
  {
    id: "a4",
    projectId: "coinbase-wallet",
    projectName: "Coinbase Smart Wallet",
    category: "Tools",
    title: "1M wallets milestone",
    description: "One million smart wallets have been created on Base",
    date: "2026-02-21T09:00:00Z",
    type: "metrics",
    read: true,
  },
  {
    id: "a5",
    projectId: "zora-base",
    projectName: "Zora",
    category: "NFT",
    title: "10M mints on Base",
    description: "Ten million NFTs minted through Zora protocol on Base",
    date: "2026-02-20T16:45:00Z",
    type: "metrics",
    read: true,
  },
  {
    id: "a6",
    projectId: "degen-chain",
    projectName: "Degen Chain",
    category: "Infra",
    title: "500K daily transactions",
    description: "Degen Chain L3 hit 500,000 transactions in a single day",
    date: "2026-02-19T12:00:00Z",
    type: "metrics",
    read: true,
  },
];

export const ecosystemStats = {
  totalProjects: 147,
  newThisWeek: 12,
  totalWatchers: 4200,
  totalUpvotes: 18400,
};
