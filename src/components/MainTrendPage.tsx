import React, { useState } from "react";
import { Card, Typography, Row, Col, Table, Button, Badge, theme } from "antd";
import { StarFilled, StarOutlined, ShareAltOutlined, LayoutOutlined } from "@ant-design/icons";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import type { MarketChartPoint, OhlcData } from "../utils/api";

const { Title, Text, Paragraph } = Typography;

interface MainTrendPageProps {
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
  chartData: MarketChartPoint[];
  ohlc: OhlcData | null;
  loading: boolean;
  onSelectAsset: (id: string) => void;
}

export const MainTrendPage: React.FC<MainTrendPageProps> = ({
  coinDetails,
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

  // Watchlist items (as in Screenshot 1)
  const watchlistData = [
    { key: "1", id: "avalanche-2", symbol: "AVAX", name: "AVAX", price: 38.92, change: -4.21 },
    { key: "2", id: "matic-network", symbol: "MATIC", name: "MATIC", price: 92.68, change: 7.84 },
    { key: "3", id: "oasis-network", symbol: "ROSE", name: "ROSE", price: 8.33, change: 1.02 },
    { key: "4", id: "decred", symbol: "DCR", name: "DCR", price: 45.69, change: -17.88 },
    { key: "5", id: "cardano", symbol: "ADA", name: "ADA", price: 0.435, change: 5.21 },
    { key: "6", id: "solana", symbol: "SOL", name: "SOL", price: 145.30, change: -2.37 },
  ];

  // Order Book Mock Data
  const orderBookAsks = [
    { price: 1.048, amount: 100.0, total: 104.80 },
    { price: 1.034, amount: 15.0, total: 1342.63 },
    { price: 1.027, amount: 266.0, total: 476.24 },
    { price: 1.028, amount: 404.9, total: 351.69 },
    { price: 1.019, amount: 100.0, total: 10.52 },
    { price: 1.017, amount: 10.4, total: 5407.56 },
    { price: 1.017, amount: 10.4, total: 5407.56 },
  ];

  const orderBookBids = [
    { price: 1.048, amount: 100.0, total: 104.80 },
    { price: 1.038, amount: 1284.2, total: 102.72 },
    { price: 1.023, amount: 270.0, total: 10.24 },
    { price: 1.027, amount: 266.0, total: 476.24 },
    { price: 1.020, amount: 468.1, total: 410.98 },
    { price: 1.028, amount: 404.9, total: 351.69 },
    { price: 1.028, amount: 404.9, total: 351.69 },
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

        {/* Info card bottom-left */}
        <Card
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 8,
            transition: "background 0.3s, border-color 0.3s"
          }}
          styles={{ body: { padding: 24 } }}
        >
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#ff6b35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#fff"
              }}>
                {coinDetails.symbol.charAt(0)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Title level={3} style={{ margin: 0, color: token.colorText }}>{coinDetails.name}</Title>
                  <Badge count="Active" style={{ backgroundColor: "rgba(109,224,57,0.15)", color: token.colorSuccess, border: `1px solid ${token.colorSuccess}` }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button ghost icon={<StarOutlined />} style={{ color: token.colorTextDescription, borderColor: token.colorBorder }}>Watchlist</Button>
              <Button ghost icon={<ShareAltOutlined />} style={{ color: token.colorTextDescription, borderColor: token.colorBorder }}>Share</Button>
            </div>
          </div>

          <Title level={4} style={{ color: token.colorText, margin: "0 0 12px 0" }}>{coinDetails.name} ({coinDetails.symbol})</Title>
          <Paragraph style={{ color: token.colorTextDescription, fontSize: 14, lineHeight: "1.6" }}>
            {coinDetails.description}
          </Paragraph>

          {/* Details Grid */}
          <Row gutter={[16, 24]} style={{ marginTop: 24, borderTop: `1px solid ${token.colorBorder}`, paddingTop: 20 }}>
            <Col xs={12} sm={6}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Creator</Text>
              <Text style={{ color: token.colorText, fontWeight: 600, fontSize: 14 }}>{coinDetails.creator}</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Launch Year</Text>
              <Text style={{ color: token.colorText, fontWeight: 600, fontSize: 14 }}>{coinDetails.launchYear}</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Consensus Mechanism</Text>
              <Text style={{ color: token.colorText, fontWeight: 600, fontSize: 14 }}>{coinDetails.consensus}</Text>
            </Col>
            <Col xs={12} sm={6}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Current Supply</Text>
              <Text style={{ color: token.colorText, fontWeight: 600, fontSize: 14 }}>{coinDetails.supply}</Text>
            </Col>
          </Row>

          {/* Sparkline underneath */}
          <div style={{ height: 100, marginTop: 24 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#ff6b35" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
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
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={watchlistData}
            pagination={false}
            size="small"
            showHeader={true}
            rowKey="symbol"
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

        {/* Order Book Card */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>Order Book</span>
              <div style={{ display: "flex", gap: 4 }}>
                <Button size="small" type="text" style={{ color: token.colorText }} icon={<LayoutOutlined />} />
              </div>
            </div>
          }
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 8,
            transition: "background 0.3s, border-color 0.3s"
          }}
          styles={{ body: { padding: 12 } }}
        >
          {/* Table Headers */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: `1px solid ${token.colorBorder}`, marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Price</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>Amount</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>Total</Text>
          </div>

          {/* ASKS (Sells) - Red */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }}>
            {orderBookAsks.map((ask, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px", fontSize: 12 }}>
                <Text style={{ color: token.colorError, fontWeight: 600 }}>{ask.price.toFixed(3)}</Text>
                <Text style={{ color: token.colorText }}>{ask.amount.toFixed(1)}</Text>
                <Text style={{ color: token.colorTextDescription }}>{ask.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </div>
            ))}
          </div>

          {/* Spread / Mid Market Price */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px",
            background: "rgba(109, 224, 57, 0.08)",
            borderTop: `1px solid ${token.colorBorder}`,
            borderBottom: `1px solid ${token.colorBorder}`,
            marginBottom: 12
          }}>
            <span style={{ color: token.colorSuccess, fontWeight: 700, fontSize: 14 }}>
              ↓ 1,362.08
            </span>
            <Text style={{ color: token.colorTextDescription, fontSize: 11 }}>1,085 / 1,186</Text>
          </div>

          {/* BIDS (Buys) - Green */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {orderBookBids.map((bid, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px", fontSize: 12 }}>
                <Text style={{ color: token.colorSuccess, fontWeight: 600 }}>{bid.price.toFixed(3)}</Text>
                <Text style={{ color: token.colorText }}>{bid.amount.toFixed(1)}</Text>
                <Text style={{ color: token.colorTextDescription }}>{bid.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </div>
            ))}
          </div>
        </Card>
      </Col>
    </Row>
  );
};
