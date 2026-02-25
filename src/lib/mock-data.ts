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
  milestones: Milestone[];
  comments: Comment[];
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
    milestones: [
      { id: "m1", title: "V2 Launch", description: "Full V2 protocol deployed with clubs feature", date: "2026-01-10", achieved: true, type: "launch" },
      { id: "m2", title: "100K active users", description: "Daily active users crossed 100K", date: "2026-02-01", achieved: true, type: "metrics" },
      { id: "m3", title: "Cross-chain expansion", description: "Social graph bridging to other L2s", date: "2026-04-01", achieved: false, type: "partnership" },
    ],
    comments: [
      { id: "c1", author: "social_degen", text: "Clubs feature is actually sick. Way better than V1.", date: "2026-02-22", upvotes: 31 },
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
    milestones: [
      { id: "m1", title: "Day 500 Canvas", description: "500 consecutive days of community art", date: "2026-02-10", achieved: true, type: "metrics" },
      { id: "m2", title: "Gallery feature", description: "On-chain gallery for browsing past canvases", date: "2026-03-15", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "pixel_lord", text: "500 days straight of community art. This is what crypto culture looks like.", date: "2026-02-12", upvotes: 42 },
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
    milestones: [
      { id: "m1", title: "API V2 launch", description: "New REST API with enhanced rate limits", date: "2026-01-25", achieved: true, type: "launch" },
    ],
    comments: [],
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
    milestones: [
      { id: "m1", title: "ILM V2 strategies", description: "New automated leverage strategies launched", date: "2026-02-05", achieved: true, type: "launch" },
      { id: "m2", title: "TVL crossed $200M", description: "Protocol TVL surpassed $200 million", date: "2026-02-18", achieved: true, type: "metrics" },
      { id: "m3", title: "Multi-collateral vaults", description: "Support for multi-asset collateral positions", date: "2026-04-15", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "yield_farmer", text: "ILMs are game-changing. One-click leverage without the headache.", date: "2026-02-10", upvotes: 27 },
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
    milestones: [
      { id: "m1", title: "10M mints on Base", description: "Ten million NFTs minted through the protocol on Base", date: "2026-01-30", achieved: true, type: "metrics" },
      { id: "m2", title: "Creator toolkit v3", description: "Enhanced tools for creators including splits and editions", date: "2026-03-10", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "nft_collector", text: "Minting for pennies on Base. This is what mass adoption looks like.", date: "2026-02-05", upvotes: 36 },
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
    milestones: [
      { id: "m1", title: "Mainnet launch", description: "Degen L3 mainnet went live", date: "2025-11-15", achieved: true, type: "launch" },
      { id: "m2", title: "500K transactions/day", description: "Daily transaction count crossed half a million", date: "2026-02-20", achieved: true, type: "metrics" },
    ],
    comments: [],
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
    milestones: [
      { id: "m1", title: "1M wallets created", description: "One million smart wallets deployed on Base", date: "2026-02-10", achieved: true, type: "metrics" },
      { id: "m2", title: "Cross-app sessions", description: "Persistent sessions across dApps without re-auth", date: "2026-03-25", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "ux_anon", text: "No seed phrase, no gas popups. This is what onboarding should feel like.", date: "2026-02-14", upvotes: 45 },
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
    milestones: [
      { id: "m1", title: "Season 2 launch", description: "Second competitive season with new card set", date: "2026-02-15", achieved: true, type: "launch" },
      { id: "m2", title: "Mobile app", description: "Native iOS and Android client", date: "2026-05-01", achieved: false, type: "launch" },
    ],
    comments: [
      { id: "c1", author: "tcg_whale", text: "Best TCG in crypto, not even close. The art direction is insane.", date: "2026-02-17", upvotes: 19 },
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
