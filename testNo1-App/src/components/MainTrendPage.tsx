import React, { useState } from "react";
import { Card, Typography, Row, Col, Table, theme, Segmented, Spin } from "antd";
import { StarFilled, StarOutlined, GlobalOutlined } from "@ant-design/icons";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketCoins, fetchPublicTreasury } from "../utils/api";
import type { MarketChartPoint, OhlcData } from "../utils/api";

const { Text } = Typography;

interface MainTrendPageProps {
  chartData: MarketChartPoint[];
  ohlc: OhlcData | null;
  loading: boolean;
  onSelectAsset: (id: string) => void;
}

export const MainTrendPage: React.FC<MainTrendPageProps> = ({
  chartData,
  ohlc: _ohlc,
  loading: _loading,
  onSelectAsset
}) => {
  const { token } = theme.useToken();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
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
        change: coin.price_change_percentage_24h || 0
      }))
    : [
        { key: "1", id: "avalanche-2", symbol: "AVAX", name: "AVAX", price: 38.92, change: -4.21 },
        { key: "2", id: "matic-network", symbol: "MATIC", name: "MATIC", price: 92.68, change: 7.84 },
        { key: "3", id: "oasis-network", symbol: "ROSE", name: "ROSE", price: 8.33, change: 1.02 },
        { key: "4", id: "decred", symbol: "DCR", name: "DCR", price: 45.69, change: -17.88 },
        { key: "5", id: "cardano", symbol: "ADA", name: "ADA", price: 0.435, change: 5.21 },
        { key: "6", id: "solana", symbol: "SOL", name: "SOL", price: 145.30, change: -2.37 }
      ];


  // Convert chartData to standard format for BarChart
  const displayData = chartData.map((pt, idx) => ({
    name: new Date(pt.time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: pt.price,
    index: idx
  }));

  // Tooltip details based on hovered bar
  const activePoint = hoveredBarIndex !== null ? displayData[hoveredBarIndex] : displayData[displayData.length - 1];

  const statLabelStyle = { color: token.colorTextDescription, fontSize: 13 };

  return (
    <Row gutter={[24, 24]}>
      {/* Left side column: Main chart and details */}
      <Col xs={24} xl={17}>
        {/* Main trend bar chart card */}
        <Card
          styles={{ body: { padding: 24 } }}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 24,
            borderRadius: 8,
            transition: "background 0.3s, border-color 0.3s"
          }}
        >
          {/* Header Stats */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Text style={statLabelStyle}>
                  {activePoint ? activePoint.name : "May 27 2025 2:30PM"} :
                </Text>
                <Text style={statLabelStyle}>
                  Open <span style={{ color: token.colorSuccess, fontWeight: 600 }}>↑ (+2.5%)</span>
                </Text>
                <Text style={statLabelStyle}>
                  High <span style={{ color: token.colorSuccess, fontWeight: 600 }}>↑ (+3.0%)</span>
                </Text>
                <Text style={statLabelStyle}>
                  Low <span style={{ color: token.colorError, fontWeight: 600 }}>↓ (-1.2%)</span>
                </Text>
                <Text style={statLabelStyle}>
                  Change <span style={{ color: token.colorSuccess, fontWeight: 600 }}>↑ (+2.7%)</span>
                </Text>
              </div>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div style={{ height: 260, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredBarIndex(typeof state.activeTooltipIndex === 'number' ? state.activeTooltipIndex : null);
                  }
                }}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <XAxis dataKey="name" stroke={token.colorBorder} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  cursor={{ fill: token.colorFillAlter }}
                  content={() => null}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {displayData.map((_, index) => {
                    const isHovered = index === hoveredBarIndex;
                    const fill = isHovered ? "#ff6b35" : (hoveredBarIndex !== null && Math.abs(index - hoveredBarIndex) <= 2) ? "#f17e52" : token.colorBorder;
                    return <Cell key={`cell-${index}`} fill={fill} style={{ transition: "fill 0.15s ease" }} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Custom Tooltip Card positioned inside chart space */}
            {activePoint && (
              <div style={{
                position: "absolute",
                top: 30,
                left: "50%",
                transform: "translateX(-50%)",
                background: token.colorBgElevated,
                borderRadius: 6,
                padding: "8px 16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                pointerEvents: "none",
                minWidth: 150,
                border: `1px solid ${token.colorBorder}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b35" }}></span>
                  <Text style={{ color: token.colorText, fontWeight: 600, fontSize: 12 }}>{activePoint.name}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ color: token.colorTextDescription, fontSize: 11 }}>Price</Text>
                  <Text style={{ color: token.colorText, fontWeight: 700, fontSize: 12 }}>${activePoint.value.toLocaleString()}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ color: token.colorTextDescription, fontSize: 11 }}>Vol (24h)</Text>
                  <Text style={{ color: token.colorText, fontWeight: 700, fontSize: 12 }}>${(activePoint.value * 0.95).toFixed(0)}</Text>
                </div>
              </div>
            )}
          </div>
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
                render: (text) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div onClick={(e) => { e.stopPropagation(); toggleStar(text); }} style={{ cursor: "pointer" }}>
                      {starredCoins[text] ? <StarFilled style={{ color: "#ffc107" }} /> : <StarOutlined style={{ color: token.colorTextDescription }} />}
                    </div>
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
