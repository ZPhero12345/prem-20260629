import React, { useState } from "react";
import { Card, Typography, Row, Col, Table, theme, Segmented, Spin } from "antd";
import { StarFilled, StarOutlined, GlobalOutlined } from "@ant-design/icons";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketCoins, fetchPublicTreasury } from "../utils/api";
import type { GlobalStats } from "../utils/api";

const { Title, Text } = Typography;

interface MainTrendPageProps {
  loading: boolean;
  onSelectAsset: (id: string) => void;
  globalStats?: GlobalStats;
}

export const MainTrendPage: React.FC<MainTrendPageProps> = ({
  loading: _loading,
  onSelectAsset,
  globalStats
}) => {
  const { token } = theme.useToken();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [starredCoins, setStarredCoins] = useState<Record<string, boolean>>({
    AVAX: true,
    MATIC: true,
    ADA: true
  });

  const toggleStar = (symbol: string) => {
    setStarredCoins(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Query category-filtered coins
  const { data: marketCoins = [], isLoading: marketLoading } = useQuery({
    queryKey: ["marketCoins", selectedCategory],
    queryFn: () => fetchMarketCoins(selectedCategory || undefined, 6),
    staleTime: 30000,
    retry: 1
  });

  // Query corporate holdings (public treasury)
  const { data: treasuryData, isLoading: treasuryLoading } = useQuery({
    queryKey: ["publicTreasury"],
    queryFn: fetchPublicTreasury,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  const tableData = marketCoins.length > 0
    ? marketCoins.map((coin: any, idx: number) => ({
        key: (idx + 1).toString(),
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change: coin.price_change_percentage_24h || 0,
        image: coin.image
      }))
    : [
        { key: "1", id: "avalanche-2", symbol: "AVAX", name: "AVAX", price: 38.92, change: -4.21, image: "https://coin-images.coingecko.com/coins/images/825/large/AVAX.png?1696501867" },
        { key: "2", id: "matic-network", symbol: "MATIC", name: "MATIC", price: 92.68, change: 7.84, image: "https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233740" },
        { key: "3", id: "oasis-network", symbol: "ROSE", name: "ROSE", price: 8.33, change: 1.02, image: "https://coin-images.coingecko.com/coins/images/13162/large/rose.png?1696512918" },
        { key: "4", id: "decred", symbol: "DCR", name: "DCR", price: 45.69, change: -17.88, image: "https://coin-images.coingecko.com/coins/images/329/large/decred.png?1696501499" },
        { key: "5", id: "cardano", symbol: "ADA", name: "ADA", price: 0.435, change: 5.21, image: "https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090" },
        { key: "6", id: "solana", symbol: "SOL", name: "SOL", price: 145.30, change: -2.37, image: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1696504756" }
      ];

  const totalMarketCap = globalStats?.total_market_cap?.usd || 0;
  const totalVolume24h = globalStats?.total_volume?.usd || 0;

  const btcShare = globalStats?.market_cap_percentage?.btc || 0;
  const ethShare = globalStats?.market_cap_percentage?.eth || 0;
  const stablecoinShare = (globalStats?.market_cap_percentage?.usdt || 0) + (globalStats?.market_cap_percentage?.usdc || 0);
  const othersShare = Math.max(0, 100 - btcShare - ethShare - stablecoinShare);

  const pieData = [
    { name: "BTC", value: btcShare, valUsd: totalMarketCap * (btcShare / 100), color: "#f7931a", id: "bitcoin", fullName: "Bitcoin", logo: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400" },
    { name: "ETH", value: ethShare, valUsd: totalMarketCap * (ethShare / 100), color: "#627eea", id: "ethereum", fullName: "Ethereum", logo: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501484" },
    { name: "Stablecoins", value: stablecoinShare, valUsd: totalMarketCap * (stablecoinShare / 100), color: "#26a17b", fullName: "Stablecoins", logo: "" },
    { name: "Others", value: othersShare, valUsd: totalMarketCap * (othersShare / 100), color: "#8b90a0", fullName: "Others", logo: "" }
  ];

  const formatCurrency = (val: number) => {
    if (val === 0) return "$0.00";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <Row gutter={[24, 24]}>
      {/* Left side column: Main chart and details */}
      <Col xs={24} xl={17}>
        {/* Market Dominance Donut Chart Card */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ color: token.colorText, fontSize: 16, fontWeight: 700 }}>Crypto Market Cap Dominance</span>
              <div style={{
                background: token.colorFillAlter,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                color: token.colorTextDescription
              }}>
                Live Stats
              </div>
            </div>
          }
          styles={{ body: { padding: 24 } }}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 24,
            borderRadius: 8,
            transition: "background 0.3s, border-color 0.3s"
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              {/* Donut Chart Container */}
              <div style={{ height: 260, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={(data: any) => {
                        const coinId = data?.payload?.id || data?.id;
                        if (coinId) {
                          onSelectAsset(coinId);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {pieData.map((entry, index) => {
                        const isHovered = index === activeIndex;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              transform: isHovered ? "scale(1.05)" : "scale(1)",
                              transformOrigin: "50% 50%",
                              transition: "all 0.2s ease"
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              background: token.colorBgElevated,
                              border: `1px solid ${token.colorBorder}`,
                              padding: "8px 12px",
                              borderRadius: 6,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                            }}>
                              <Text style={{ fontWeight: 600, color: token.colorText, display: "block" }}>{data.fullName}</Text>
                              <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Share: <strong style={{ color: data.color }}>{data.value.toFixed(2)}%</strong></Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>Valuation: <strong>{formatCurrency(data.valUsd)}</strong></Text>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central HUD */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                  width: "140px"
                }}>
                  {activeIndex !== null ? (
                    <>
                      <Title level={3} style={{ margin: 0, color: pieData[activeIndex].color, fontWeight: 700 }}>
                        {pieData[activeIndex].value.toFixed(1)}%
                      </Title>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                        {pieData[activeIndex].name} Share
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: token.colorTextDescription }}>
                        {formatCurrency(pieData[activeIndex].valUsd)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Title level={4} style={{ margin: 0, color: token.colorText, fontWeight: 700, fontSize: 18 }}>
                        {formatCurrency(totalMarketCap)}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Total Cap
                      </Text>
                      <Text style={{ fontSize: 10, color: token.colorTextDescription }}>
                        Vol: {formatCurrency(totalVolume24h)}
                      </Text>
                    </>
                  )}
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              {/* Detailed Breakdown Legend List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pieData.map((item, index) => {
                  const isHovered = index === activeIndex;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={() => item.id && onSelectAsset(item.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: isHovered ? token.colorFillAlter : "transparent",
                        cursor: item.id ? "pointer" : "default",
                        transition: "background 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.logo ? (
                          <img src={item.logo} alt={item.fullName} style={{ width: 16, height: 16, borderRadius: "50%" }} />
                        ) : (
                          <span style={{ width: 16, height: 16, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                        )}
                        <Text style={{ color: token.colorText, fontWeight: 600 }}>{item.fullName}</Text>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Text style={{ color: token.colorText, fontWeight: 700, display: "block" }}>
                          {item.value.toFixed(2)}%
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatCurrency(item.valUsd)}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* Right side column: Watchlist Table and Order Book */}
      <Col xs={24} xl={7}>
        {/* Watchlist card */}
        <Card
          title={<span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>Pairs</span>}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 8,
            marginBottom: 24,
            transition: "background 0.3s, border-color 0.3s"
          }}
          styles={{ body: { padding: "12px 0 0 0" } }}
        >
          <div style={{ padding: "0 12px 12px 12px" }}>
            <Segmented
              block
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as string)}
              options={[
                { label: "All", value: "" },
                { label: "L1", value: "layer-1" },
                { label: "DeFi", value: "decentralized-finance-defi" },
                { label: "Memes", value: "meme-token" }
              ]}
            />
          </div>
          <Table
            dataSource={tableData}
            pagination={false}
            size="small"
            showHeader={true}
            loading={marketLoading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => onSelectAsset(record.id),
              style: { cursor: "pointer" }
            })}
            columns={[
              {
                title: "Pairs",
                dataIndex: "symbol",
                key: "symbol",
                render: (text, record: any) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div onClick={(e) => { e.stopPropagation(); toggleStar(text); }} style={{ cursor: "pointer" }}>
                      {starredCoins[text] ? <StarFilled style={{ color: "#ffc107" }} /> : <StarOutlined style={{ color: token.colorTextDescription }} />}
                    </div>
                    {record.image && (
                      <img src={record.image} alt={text} style={{ width: 16, height: 16, borderRadius: "50%" }} />
                    )}
                    <Text style={{ color: token.colorText, fontWeight: 600 }}>{text}</Text>
                  </div>
                )
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                align: "right",
                render: (price) => <Text style={{ color: token.colorText }}>${price.toFixed(2)}</Text>
              },
              {
                title: "Change",
                dataIndex: "change",
                key: "change",
                align: "right",
                render: (val) => {
                  const isPositive = val >= 0;
                  return (
                    <span style={{
                      color: isPositive ? token.colorSuccess : token.colorError,
                      background: isPositive ? "rgba(109,224,57,0.1)" : "rgba(255,180,171,0.1)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {isPositive ? "↑" : "↓"} {Math.abs(val).toFixed(2)}%
                    </span>
                  );
                }
              }
            ]}
          />
        </Card>


        {/* Bitcoin Corporate Holdings Card */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GlobalOutlined style={{ color: "#ff6b35" }} />
              <span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>Bitcoin Corporate Holdings</span>
            </div>
          }
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 8,
            marginTop: 24,
            transition: "background 0.3s, border-color 0.3s"
          }}
          styles={{ body: { padding: 0 } }}
        >
          {treasuryLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <Spin size="small" />
            </div>
          ) : (
            <Table
              dataSource={treasuryData?.companies?.slice(0, 5) || []}
              pagination={false}
              size="small"
              showHeader={true}
              rowKey="name"
              columns={[
                {
                  title: "Company",
                  dataIndex: "name",
                  key: "name",
                  render: (name, record) => (
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
                  render: (val) => <Text style={{ color: token.colorText, fontWeight: 600 }}>{val.toLocaleString()} BTC</Text>
                },
                {
                  title: "Value",
                  dataIndex: "total_current_value_usd",
                  key: "total_current_value_usd",
                  align: "right",
                  render: (val) => <Text style={{ color: token.colorText }}>${(val / 1e6).toFixed(1)}M</Text>
                }
              ]}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};
