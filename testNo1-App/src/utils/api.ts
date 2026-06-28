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
  ohlcData: [number, number, number, number, number][];
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

const FULL_COINS_CACHE_KEY = "cryptometric_full_coins";
const FULL_COINS_CACHE_TIME_KEY = "cryptometric_full_coins_time";
const CACHE_24H_MS = 24 * 60 * 60 * 1000;

export async function initializeCoinsCache(): Promise<void> {
  const now = Date.now();
  const cachedTime = localStorage.getItem(FULL_COINS_CACHE_TIME_KEY);
  const cachedData = localStorage.getItem(FULL_COINS_CACHE_KEY);

  if (cachedData && cachedTime && now - parseInt(cachedTime, 10) < CACHE_24H_MS) {
    return; // Cache is still fresh
  }

  try {
    const res = await fetchFromApi("/coins/list");
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(FULL_COINS_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(FULL_COINS_CACHE_TIME_KEY, now.toString());
    }
  } catch (err) {
    console.warn("Failed to background-initialize coins cache:", err);
  }
}

function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

function localFuzzySearch(query: string): SearchResult[] {
  const cachedData = localStorage.getItem(FULL_COINS_CACHE_KEY);
  if (!cachedData) return [];

  try {
    const coins: { id: string; name: string; symbol: string }[] = JSON.parse(cachedData);
    const trimmed = query.trim().toLowerCase();
    const matches: { coin: SearchResult; score: number }[] = [];

    for (const coin of coins) {
      const name = coin.name.toLowerCase();
      const symbol = coin.symbol.toLowerCase();

      let matched = false;
      let score = 999;

      if (symbol === trimmed || name === trimmed) {
        matched = true;
        score = 0;
      } else if (symbol.startsWith(trimmed) || name.startsWith(trimmed)) {
        matched = true;
        score = 1;
      } else {
        const distName = calculateLevenshtein(trimmed, name);
        const distSym = calculateLevenshtein(trimmed, symbol);
        const minDist = Math.min(distName, distSym);

        const maxAllowedDist = trimmed.length <= 4 ? 1 : trimmed.length <= 7 ? 2 : 3;
        if (minDist <= maxAllowedDist) {
          matched = true;
          score = minDist + 2;
        }
      }

      if (matched) {
        matches.push({
          coin: {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            market_cap_rank: 9999,
            thumb: ""
          },
          score
        });
      }
    }

    matches.sort((a, b) => a.score - b.score);
    return matches.slice(0, 10).map(m => m.coin);
  } catch (err) {
    console.error("Failed to parse local coins search index:", err);
    return [];
  }
}

const searchQueryCache: Record<string, { timestamp: number; data: SearchResult[] }> = {};

export async function searchCoins(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const now = Date.now();
  if (searchQueryCache[trimmed] && now - searchQueryCache[trimmed].timestamp < CACHE_TTL_MS) {
    return searchQueryCache[trimmed].data;
  }

  let results: SearchResult[] = [];
  let isApiSuccess = false;

  try {
    const response = await fetchFromApi(`/search?query=${encodeURIComponent(query)}`);
    if (response.ok) {
      const data = await response.json();
      results = data.coins || [];
      isApiSuccess = true;
    }
  } catch (err) {
    console.warn("CoinGecko search API failed or rate-limited:", err);
  }

  // Evaluate if the API returned exact or prefix matches
  const hasGoodMatches = isApiSuccess && results.some(coin => 
    coin.symbol.toLowerCase().startsWith(trimmed) || 
    coin.name.toLowerCase().startsWith(trimmed)
  );

  let finalResults: SearchResult[] = [];

  if (hasGoodMatches) {
    // Sort exact matches on symbol or name to the top of suggestions
    results.sort((a, b) => {
      const aSym = a.symbol.toLowerCase();
      const bSym = b.symbol.toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      if (aSym === trimmed && bSym !== trimmed) return -1;
      if (bSym === trimmed && aSym !== trimmed) return 1;
      if (aName === trimmed && bName !== trimmed) return -1;
      if (bName === trimmed && aName !== trimmed) return 1;
      return 0;
    });
    finalResults = results.slice(0, 10);
  } else {
    // If API failed, returned empty, or had no good prefix/exact matches (e.g. typos), use local index
    finalResults = localFuzzySearch(trimmed);
  }

  searchQueryCache[trimmed] = {
    timestamp: now,
    data: finalResults
  };

  return finalResults;
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

  // 2. Fetch official OHLC history (with 2 decimal precision)
  const ohlcRes = await fetchFromApi(`/coins/${coinId}/ohlc?vs_currency=usd&days=${days}&precision=2`);
  if (!ohlcRes.ok) {
    throw new Error(`CoinGecko OHLC API error: ${ohlcRes.status} ${ohlcRes.statusText}`);
  }
  const ohlcData: [number, number, number, number, number][] = await ohlcRes.json();

  // Map to chartData for backward compatibility (using close price as the point price)
  const chartData: MarketChartPoint[] = ohlcData.map(([time, , , , close]) => ({
    time,
    price: close
  }));

  // Calculate overall OHLC statistics from the native candles
  const highs = ohlcData.map(d => d[2]);
  const lows = ohlcData.map(d => d[3]);
  const ohlc: OhlcData = {
    time: Date.now(),
    open: ohlcData[0]?.[1] || 0,
    high: ohlcData.length > 0 ? Math.max(...highs) : 0,
    low: ohlcData.length > 0 ? Math.min(...lows) : 0,
    close: ohlcData[ohlcData.length - 1]?.[4] || 0
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
    ohlcData,
    coinDetails
  };

  coinDataCache[cacheKey] = {
    timestamp: now,
    data: result
  };

  return result;
}
