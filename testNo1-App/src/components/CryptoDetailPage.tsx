import React, { useState, useMemo, useRef } from "react";
import { Typography, Button, theme } from "antd";
import {
  StarOutlined,
  StarFilled
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCoinData, fetchCoinsByIds } from "../utils/api";
import { CandlestickChart } from "./CandlestickChart";

import type { UTCTimestamp } from "lightweight-charts";

const { Title, Text } = Typography;

export const CryptoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [selectedRange, setSelectedRange] = useState(1);
  const [starred, setStarred] = useState(false);

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

  // Query watchlist coins live prices dynamically for only the 4 target coins
  const { data: watchlistCoins = [] } = useQuery({
    queryKey: ["watchlistCoinsData"],
    queryFn: () => fetchCoinsByIds("bitcoin,ethereum,solana,chainlink"),
    staleTime: 30000,
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

  // Sidebar watchlists dynamically populated from live market query
  const watchlist = useMemo(() => {
    const targets = ["bitcoin", "ethereum", "solana", "chainlink"];
    // Keep order consistent: BTC, ETH, SOL, LINK
    const coinMap: Record<string, any> = {};
    watchlistCoins.forEach((coin: any) => {
      coinMap[coin.id] = coin;
    });

    return targets.map((id) => {
      const coin = coinMap[id];
      if (!coin) {
        // Safe placeholder before loading completes
        const symbolMap: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", chainlink: "LINK" };
        return {
          symbol: symbolMap[id] || id.toUpperCase(),
          last: "-",
          change: "0.00%",
          isDown: false
        };
      }
      return {
        symbol: coin.symbol.toUpperCase(),
        last: `$${coin.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${coin.price_change_percentage_24h >= 0 ? "+" : ""}${coin.price_change_percentage_24h?.toFixed(2)}%`,
        isDown: coin.price_change_percentage_24h < 0
      };
    });
  }, [watchlistCoins]);



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
              Watchlist
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {watchlist.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => navigate(`/coin/${item.symbol.toLowerCase() === 'btc' ? 'bitcoin' : item.symbol.toLowerCase() === 'eth' ? 'ethereum' : item.symbol.toLowerCase() === 'sol' ? 'solana' : 'chainlink'}`)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 6px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = token.colorFillAlter}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: token.colorText, fontWeight: 600 }}>{item.symbol}/USD</span>
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
