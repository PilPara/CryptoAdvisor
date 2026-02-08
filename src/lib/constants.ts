export const ASSETS = [
  { id: "BTC", label: "Bitcoin (BTC)", coingeckoId: "bitcoin" },
  { id: "ETH", label: "Ethereum (ETH)", coingeckoId: "ethereum" },
  { id: "SOL", label: "Solana (SOL)", coingeckoId: "solana" },
  { id: "BNB", label: "BNB (BNB)", coingeckoId: "binancecoin" },
  { id: "XRP", label: "Ripple (XRP)", coingeckoId: "ripple" },
  { id: "ADA", label: "Cardano (ADA)", coingeckoId: "cardano" },
  { id: "DOGE", label: "Dogecoin (DOGE)", coingeckoId: "dogecoin" },
  { id: "AVAX", label: "Avalanche (AVAX)", coingeckoId: "avalanche-2" },
] as const;

export const VALID_ASSET_IDS: string[] = ASSETS.map((asset) => asset.id);

export const ASSET_TO_COINGECKO: Record<string, string> = Object.fromEntries(
  ASSETS.map((asset) => [asset.id, asset.coingeckoId]),
);

export const INVESTOR_TYPES = [
  { id: "hodler", label: "HODLer", description: "Buy and hold long-term" },
  {
    id: "day-trader",
    label: "Day Trader",
    description: "Short-term trades for quick gains",
  },
  {
    id: "nft-collector",
    label: "NFT Collector",
    description: "Focused on digital collectibles",
  },
  {
    id: "defi-explorer",
    label: "DeFi Explorer",
    description: "Yield farming, staking, and protocols",
  },
] as const;

export const VALID_INVESTOR_TYPE_IDS: string[] = INVESTOR_TYPES.map(
  (t) => t.id,
);

export const CONTENT_TYPES = [
  { id: "news", label: "Market News" },
  { id: "prices", label: "Coin Prices & Charts" },
  { id: "social", label: "Social & Community" },
  { id: "fun", label: "Fun & Memes" },
] as const;

export const VALID_CONTENT_TYPE_IDS: string[] = CONTENT_TYPES.map((c) => c.id);
