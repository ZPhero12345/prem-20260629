export interface CoinInfo {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number;
  price_btc?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
}

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    price_btc: number;
    data: {
      price: string;
      price_btc: string;
      price_change_percentage_24h: {
        usd: number;
      };
      sparkline: string;
    };
  };
}

export interface MarketChartPoint {
  time: number;
  price: number;
}

export interface OhlcData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Well-known details map for metadata not provided natively in simple API forms
const WELL_KNOWN_METADATA: Record<string, { creator: string; consensus: string; launchYear?: number }> = {
  bitcoin: { creator: "Satoshi Nakamoto", consensus: "Proof of Work (PoW)", launchYear: 2009 },
  ethereum: { creator: "Vitalik Buterin", consensus: "Proof of Stake (PoS)", launchYear: 2015 },
  solana: { creator: "Anatoly Yakovenko", consensus: "Proof of History (PoH)", launchYear: 2020 },
  chainlink: { creator: "Sergey Nazarov", consensus: "Oracle Network Consensus", launchYear: 2017 },
  binancecoin: { creator: "Changpeng Zhao", consensus: "Proof of Staked Authority (PoSA)", launchYear: 2017 },
  ripple: { creator: "Arthur Britto, Jed McCaleb", consensus: "Ripple Protocol Consensus", launchYear: 2012 },
  cardano: { creator: "Charles Hoskinson", consensus: "Ouroboros (PoS)", launchYear: 2017 },
  dogecoin: { creator: "Billy Markus, Jackson Palmer", consensus: "Auxiliary Proof of Work (AuxPoW)", launchYear: 2013 }
};

// Caching constants
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

interface CoinDataResult {
  chartData: MarketChartPoint[];
  ohlc: OhlcData;
  coinDetails: {
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    marketCap: string;
    volume: string;
    creator: string;
    launchYear: number;
    consensus: string;
    supply: string;
    description: string;
  };
}

const coinDataCache: Record<string, { timestamp: number; data: CoinDataResult }> = {};
let cachedTrending: { timestamp: number; data: TrendingCoin[] } | null = null;

// API configuration dynamically derived from Vite environment variables
const API_KEY = (import.meta.env.VITE_COINGECKO_API_KEY || "").trim();
const USE_API_KEY = import.meta.env.VITE_USE_API_KEY === "true";
const SHOULD_USE_KEY = API_KEY && USE_API_KEY;

const BASE_URL = "https://api.coingecko.com/api/v3";

function fetchFromApi(endpoint: string): Promise<Response> {
  let url = `${BASE_URL}${endpoint}`;
  if (SHOULD_USE_KEY) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}x_cg_demo_api_key=${API_KEY}`;
  }
  return fetch(url);
}

export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const now = Date.now();
  if (cachedTrending && now - cachedTrending.timestamp < CACHE_TTL_MS) {
    return cachedTrending.data;
  }

  const response = await fetchFromApi("/search/trending");
  if (!response.ok) {
    throw new Error(`CoinGecko Trending API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  cachedTrending = {
    timestamp: now,
    data: data.coins
  };
  return data.coins;
}

export async function searchCoins(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const response = await fetchFromApi(`/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`CoinGecko Search API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.coins.slice(0, 10);
}

function formatLargeNumber(num: number): string {
  if (!num) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatSupply(num: number, symbol: string): string {
  if (!num) return "N/A";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
  return `${num.toLocaleString()} ${symbol.toUpperCase()}`;
}

export async function fetchCoinData(id: string, days: number): Promise<CoinDataResult> {
  const coinId = id.toLowerCase();
  const cacheKey = `${coinId}_${days}`;
  const now = Date.now();

  if (coinDataCache[cacheKey] && now - coinDataCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return coinDataCache[cacheKey].data;
  }

  // 1. Fetch metadata and details from coins/{id}
  const coinRes = await fetchFromApi(`/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
  if (!coinRes.ok) {
    throw new Error(`CoinGecko Coin Details API error: ${coinRes.status} ${coinRes.statusText}`);
  }
  const coinData = await coinRes.json();

  // 2. Fetch chart history
  const chartRes = await fetchFromApi(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
  if (!chartRes.ok) {
    throw new Error(`CoinGecko Chart API error: ${chartRes.status} ${chartRes.statusText}`);
  }
  const chartDataJson = await chartRes.json();

  // Map prices to chart points
  const chartData: MarketChartPoint[] = chartDataJson.prices.map(([time, price]: [number, number]) => ({
    time,
    price: Number(price.toFixed(2))
  }));

  // Compute OHLC from chart data
  const prices = chartData.map(p => p.price);
  const ohlc: OhlcData = {
    time: Date.now(),
    open: chartData[0]?.price || 0,
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: chartData[chartData.length - 1]?.price || 0
  };

  // Determine metadata values
  const known = WELL_KNOWN_METADATA[coinId] || { creator: "N/A", consensus: "N/A" };
  const genesisDate = coinData.genesis_date;
  const launchYear = known.launchYear || (genesisDate ? new Date(genesisDate).getFullYear() : 2020);

  // Strip html from description
  const cleanDescription = (coinData.description?.en || "No description available.")
    .replace(/<[^>]*>/g, "");

  const coinDetails = {
    name: coinData.name,
    symbol: coinData.symbol.toUpperCase(),
    price: coinData.market_data?.current_price?.usd || 0,
    change24h: coinData.market_data?.price_change_percentage_24h || 0,
    marketCap: formatLargeNumber(coinData.market_data?.market_cap?.usd),
    volume: formatLargeNumber(coinData.market_data?.total_volume?.usd),
    creator: known.creator,
    launchYear: launchYear,
    consensus: known.consensus,
    supply: formatSupply(coinData.market_data?.circulating_supply, coinData.symbol),
    description: cleanDescription
  };

  const result = {
    chartData,
    ohlc,
    coinDetails
  };

  coinDataCache[cacheKey] = {
    timestamp: now,
    data: result
  };

  return result;
}
