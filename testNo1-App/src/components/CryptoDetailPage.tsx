import React, { useState, useMemo, useRef } from "react";
import { Typography, Button, theme, Tooltip } from "antd";
import {
  StarOutlined,
  StarFilled
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCoinData, fetchMarketCoins, fetchTrendingCoins } from "../utils/api";
import { CandlestickChart } from "./CandlestickChart";

import type { UTCTimestamp } from "lightweight-charts";

const { Title, Text } = Typography;

export const CryptoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [selectedRange, setSelectedRange] = useState(1);
  const [starred, setStarred] = useState(false);
  const [filter, setFilter] = useState<"rank" | "trending" | "gainers" | "losers">("rank");

  const coinId = id || "bitcoin";

  // Fetch chart and OHLC data inside the detail page
  const { data: assetData, isFetching } = useQuery({
    queryKey: ["coinData", coinId, selectedRange],
    queryFn: () => fetchCoinData(coinId, selectedRange),
    placeholderData: keepPreviousData,
    staleTime: 30000,
    retry: true,
    retryDelay: (attempt) => Math.min(attempt * 5000, 30000),
  });

  // Query watchlist coins live prices dynamically (top 50 by market cap rank to support Rank/Gainers/Losers sorting)
  const { data: watchlistCoins = [] } = useQuery({
    queryKey: ["watchlistCoinsData50"],
    queryFn: () => fetchMarketCoins(undefined, 50),
    staleTime: 30000,
  });

  // Query trending search coins from API (enabled when filter is set to trending)
  const { data: trendingData = [] } = useQuery({
    queryKey: ["watchlistTrendingCoins"],
    queryFn: fetchTrendingCoins,
    staleTime: 10 * 60 * 1000,
    enabled: filter === "trending"
  });

  // Fetch public corporate holdings dynamically (commented out for now)
  /*
  const { data: treasuryData, isLoading: treasuryLoading, isError: treasuryError, refetch: refetchTreasury } = useQuery({
    queryKey: ["publicTreasury", coinId],
    queryFn: () => fetchPublicTreasury(coinId),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });
  */

  const coinDetails = assetData?.coinDetails || {
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    symbol: coinId.slice(0, 4).toUpperCase(),
    price: 0,
    change24h: 0,
    marketCap: "-",
    volume: "-",
    creator: "-",
    launchYear: 0,
    consensus: "-",
    supply: "-",
    description: "Fetching coin details from CoinGecko..."
  };

  const ohlcData = assetData?.ohlcData || [];

  // Chunk native OHLC candle arrays to target exactly 80 to 150 candles
  const candlestickData = useMemo(() => {
    if (!ohlcData || ohlcData.length < 2) return [];

    const targetCandles = 100;
    const chunkSize = Math.max(1, Math.round(ohlcData.length / targetCandles));

    const candles = [];
    for (let i = 0; i + chunkSize <= ohlcData.length; i += chunkSize) {
      const slice = ohlcData.slice(i, i + chunkSize);
      if (slice.length === 0) continue;

      const open = slice[0][1]; // Open of first candle in slice
      const close = slice[slice.length - 1][4]; // Close of last candle in slice
      const highs = slice.map(s => s[2]);
      const lows = slice.map(s => s[3]);
      const high = Math.max(...highs);
      const low = Math.min(...lows);
      const time = Math.floor(slice[Math.floor(slice.length / 2)][0] / 1000) as UTCTimestamp;

      candles.push({
        time,
        open,
        high,
        low,
        close
      });
    }

    candles.sort((a, b) => a.time - b.time);
    return candles.filter((item, index, self) =>
      index === 0 || item.time > self[index - 1].time
    );
  }, [ohlcData]);



  const openStatRef = useRef<HTMLSpanElement>(null);
  const highStatRef = useRef<HTMLSpanElement>(null);
  const lowStatRef = useRef<HTMLSpanElement>(null);
  const closeStatRef = useRef<HTMLSpanElement>(null);

  // Overall OHLC calculated from the chunked candlestick data
  const overallOhlc = useMemo(() => {
    if (candlestickData.length === 0) return null;
    const highs = candlestickData.map((c: any) => c.high);
    const lows = candlestickData.map((c: any) => c.low);
    return {
      open: candlestickData[0].open,
      high: Math.max(...highs),
      low: Math.min(...lows),
      close: candlestickData[candlestickData.length - 1].close
    };
  }, [candlestickData]);

  // Sidebar watchlists dynamically populated based on active filter tab
  const watchlist = useMemo(() => {
    if (filter === "trending") {
      if (!trendingData || trendingData.length === 0) {
        return Array.from({ length: 15 }).map((_, idx) => ({
          id: `loading-${idx}`,
          symbol: "...",
          last: "-",
          change: "0.00%",
          isDown: false,
          image: ""
        }));
      }
      return trendingData.slice(0, 15).map((coin: any) => {
        const item = coin.item;
        const changePercent = item.data?.price_change_percentage_24h?.usd || 0;
        return {
          id: item.id,
          symbol: item.symbol.toUpperCase(),
          last: item.data?.price || "-",
          change: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
          isDown: changePercent < 0,
          image: item.thumb || ""
        };
      });
    }

    if (watchlistCoins.length === 0) {
      return Array.from({ length: 15 }).map((_, idx) => ({
        id: `loading-${idx}`,
        symbol: "...",
        last: "-",
        change: "0.00%",
        isDown: false,
        image: ""
      }));
    }

    let sortedList = [...watchlistCoins];
    if (filter === "gainers") {
      sortedList = sortedList
        .filter((c: any) => c.price_change_percentage_24h !== undefined)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (filter === "losers") {
      sortedList = sortedList
        .filter((c: any) => c.price_change_percentage_24h !== undefined)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    }

    return sortedList.slice(0, 15).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      last: coin.current_price !== undefined && coin.current_price !== null 
        ? `$${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "-",
      change: coin.price_change_percentage_24h !== undefined && coin.price_change_percentage_24h !== null
        ? `${coin.price_change_percentage_24h >= 0 ? "+" : ""}${coin.price_change_percentage_24h.toFixed(2)}%`
        : "0.00%",
      isDown: (coin.price_change_percentage_24h || 0) < 0,
      image: coin.image || ""
    }));
  }, [filter, watchlistCoins, trendingData]);



  return (
    <div style={{ 
      background: "transparent", 
      height: "100%", 
      width: "100%", 
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Top bar: Back button, title, and actions */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "8px 24px",
        height: 52,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button onClick={() => navigate("/")} type="text" style={{ color: token.colorTextDescription, fontWeight: 600 }}>
            ← Back to Dashboard
          </Button>
          <Title level={4} style={{ margin: 0, color: token.colorText, display: "flex", alignItems: "center", gap: 8 }}>
            {coinDetails.name} ({coinDetails.symbol.toUpperCase()})
            <span onClick={() => setStarred(!starred)} style={{ cursor: "pointer", fontSize: 16 }}>
              {starred ? <StarFilled style={{ color: "#ffc107" }} /> : <StarOutlined style={{ color: token.colorTextDescription }} />}
            </span>
          </Title>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
        </div>
      </div>

      {/* Main split-pane content */}
      <div className="detail-layout-container">
        {/* LEFT COLUMN: Candlestick Chart */}
        <div className="detail-chart-column" style={{ 
          background: token.colorBgContainer,
          padding: "20px 24px"
        }}>
          <CandlestickChart
            candlestickData={candlestickData}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            isFetching={isFetching}
            hasData={!!assetData}
            openStatRef={openStatRef}
            highStatRef={highStatRef}
            lowStatRef={lowStatRef}
            closeStatRef={closeStatRef}
            overallOhlc={overallOhlc}
          />

          {/* Dynamic Corporate Holdings Card commented out for now
          {((["bitcoin", "ethereum", "solana"].includes(coinId.toLowerCase()) && (treasuryLoading || treasuryError)) || 
            (treasuryData && treasuryData.companies && treasuryData.companies.length > 0)) && (
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GlobalOutlined style={{ color: "#ff6b35" }} />
                  <span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>
                    {coinDetails.name} Corporate Holdings
                  </span>
                </div>
              }
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 8,
                marginTop: 24,
                transition: "background 0.3s, border-color 0.3s"
              }}
              styles={{ body: { padding: treasuryError ? "24px" : 0 } }}
            >
              {treasuryError ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 12px", gap: 12 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Failed to load treasury data for {coinDetails.name}.</Text>
                  <Button onClick={() => refetchTreasury()} size="small" type="primary">Reload</Button>
                </div>
              ) : treasuryLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <Spin size="small" />
                </div>
              ) : (
                <Table
                  dataSource={treasuryData?.companies || []}
                  pagination={false}
                  size="small"
                  showHeader={true}
                  rowKey="name"
                  columns={[
                    {
                      title: "Company",
                      dataIndex: "name",
                      key: "name",
                      render: (name, record: any) => (
                        <div>
                          <Text style={{ color: token.colorText, fontWeight: 600, display: "block" }}>{name}</Text>
                          <Text type="secondary" style={{ fontSize: 10 }}>{record.symbol} • {record.country}</Text>
                        </div>
                      )
                    },
                    {
                      title: "Holdings",
                      dataIndex: "total_holdings",
                      key: "total_holdings",
                      align: "right",
                      render: (val: number) => <Text style={{ color: token.colorText, fontWeight: 600 }}>{val.toLocaleString()} {coinDetails.symbol.toUpperCase()}</Text>
                    },
                    {
                      title: "Value",
                      dataIndex: "total_current_value_usd",
                      key: "total_current_value_usd",
                      align: "right",
                      render: (val: number) => {
                        if (val >= 1e9) return <Text style={{ color: token.colorText }}>${(val / 1e9).toFixed(2)}B</Text>;
                        return <Text style={{ color: token.colorText }}>${(val / 1e6).toFixed(1)}M</Text>;
                      }
                    }
                  ]}
                />
              )}
            </Card>
          )}
          */}
        </div>

        {/* RIGHT COLUMN: OHLC and Watchlist */}
        <div className="detail-sidebar-column" style={{ 
          borderLeft: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}>
          {/* OHLC Statistics Section */}
          <div>
            <Text style={{ 
              color: token.colorTextDescription, 
              fontSize: 10, 
              fontWeight: 700, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: 8,
              paddingLeft: 4
            }}>
              Key Statistics
            </Text>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Open", ref: openStatRef, color: token.colorText },
                { label: "High", ref: highStatRef, color: token.colorSuccess },
                { label: "Low", ref: lowStatRef, color: token.colorError },
                { label: "Close", ref: closeStatRef, color: token.colorSuccess },
                { label: "Market Cap", val: coinDetails.marketCap, color: token.colorText },
                { label: "Volume (24h)", val: coinDetails.volume, color: token.colorText },
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "6px 4px", 
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    fontSize: 12 
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11 }}>{stat.label}</Text>
                  {stat.ref ? (
                    <span ref={stat.ref} style={{ fontWeight: 600, color: stat.color }}>$0.00</span>
                  ) : (
                    <Text style={{ fontWeight: 600, color: stat.color }}>{stat.val}</Text>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Watchlist Section */}
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: 10,
              padding: "0 4px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              paddingBottom: 6
            }}>
              {(["rank", "trending", "gainers", "losers"] as const).map((t) => {
                const isActive = filter === t;
                const filterTitles = {
                  rank: "Market Cap Rank",
                  trending: "Top Search Trending Coins",
                  gainers: "Top 24h Price Gainers",
                  losers: "Top 24h Price Losers"
                };
                return (
                  <Tooltip 
                    key={t}
                    title={filterTitles[t]} 
                    color="#1e222d" 
                    overlayInnerStyle={{ fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 4 }}
                    mouseEnterDelay={0.3}
                  >
                    <span
                      onClick={() => setFilter(t)}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        cursor: "pointer",
                        color: isActive ? token.colorText : token.colorTextDescription,
                        transition: "color 0.2s",
                        borderBottom: isActive ? `1.5px solid ${token.colorLink || "#1677ff"}` : "none",
                        paddingBottom: 5,
                        marginBottom: isActive ? -6 : 0,
                        display: "inline-block"
                      }}
                    >
                      {t}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
            
            {/* Column Names Header Row */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              padding: "2px 6px 6px 6px", 
              fontSize: 9, 
              fontWeight: 700, 
              color: token.colorTextDescription, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              marginBottom: 4
            }}>
              <span>Ticker</span>
              <div style={{ display: "flex", gap: 36, paddingRight: 4 }}>
                <span>Last</span>
                <span style={{ minWidth: 42, textAlign: "right" }}>Chg %</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.id && !item.id.startsWith("loading-") && navigate(`/coin/${item.id}`)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 6px",
                    borderRadius: 4,
                    cursor: item.id && !item.id.startsWith("loading-") ? "pointer" : "default",
                    fontSize: 12,
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (item.id && !item.id.startsWith("loading-")) {
                      e.currentTarget.style.background = token.colorFillAlter;
                    }
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.image ? (
                      <img src={item.image} alt={item.symbol} style={{ width: 16, height: 16, borderRadius: "50%" }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: token.colorBorderSecondary }} />
                    )}
                    <span style={{ color: token.colorText, fontWeight: 600 }}>{item.symbol}/USD</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: token.colorText }}>{item.last}</span>
                    <span style={{ color: item.isDown ? token.colorError : token.colorSuccess, fontWeight: 600 }}>{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
