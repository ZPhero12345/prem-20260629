import React from "react";
import { Card, Radio, Typography, Spin, Row, Col, theme } from "antd";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MarketChartPoint } from "../utils/api";

const { Title, Text } = Typography;

interface PriceChartProps {
  assetName: string;
  assetSymbol: string;
  chartData: MarketChartPoint[];
  loading: boolean;
  selectedRange: number;
  onRangeChange: (days: number) => void;
  currentPrice: number;
  change24h: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  assetName,
  assetSymbol,
  chartData,
  loading,
  selectedRange,
  onRangeChange,
  currentPrice,
  change24h,
}) => {
  const { token } = theme.useToken();
  const isPositive = change24h >= 0;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2,
    }).format(val);
  };

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (selectedRange === 1) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Card
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 24,
        transition: "background 0.3s, border-color 0.3s"
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
        <Col>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Title level={3} style={{ margin: 0, color: token.colorText }}>
              {assetName} ({assetSymbol.toUpperCase()}/USD)
            </Title>
            <span style={{
              color: isPositive ? token.colorSuccess : token.colorError,
              fontWeight: 600,
              fontSize: 16,
              background: isPositive ? "rgba(109, 224, 57, 0.1)" : "rgba(255, 180, 171, 0.1)",
              padding: "4px 8px",
              borderRadius: 4
            }}>
              {isPositive ? "+" : ""}{change24h.toFixed(2)}%
            </span>
          </div>
          <Title level={2} style={{ margin: "8px 0 0 0", color: token.colorText, fontWeight: 700 }}>
            {formatPrice(currentPrice)}
          </Title>
        </Col>
        <Col>
          <Radio.Group
            value={selectedRange}
            onChange={(e) => onRangeChange(e.target.value)}
            optionType="button"
            buttonStyle="outline"
          >
            <Radio.Button value={1}>1D</Radio.Button>
            <Radio.Button value={7}>7D</Radio.Button>
            <Radio.Button value={30}>30D</Radio.Button>
            <Radio.Button value={90}>90D</Radio.Button>
          </Radio.Group>
        </Col>
      </Row>

      <div style={{ height: 350, width: "100%", position: "relative" }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(19, 19, 19, 0.7)", zIndex: 2 }}>
            <Spin tip="Updating chart..." />
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={token.colorPrimary} stopOpacity={0.25} />
                <stop offset="95%" stopColor={token.colorPrimary} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke={token.colorBorder}
              tick={{ fill: token.colorTextDescription || "#8b90a0", fontSize: 11 }}
              tickLine={{ stroke: token.colorBorder }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(v) => formatPrice(v)}
              stroke={token.colorBorder}
              tick={{ fill: token.colorTextDescription || "#8b90a0", fontSize: 11 }}
              tickLine={{ stroke: token.colorBorder }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as MarketChartPoint;
                  return (
                    <div style={{
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      padding: "8px 12px",
                      borderRadius: 4
                    }}>
                      <Text style={{ display: "block", color: token.colorTextDescription, fontSize: 11 }}>
                        {new Date(data.time).toLocaleString()}
                      </Text>
                      <Text style={{ color: token.colorText, fontWeight: 700, fontSize: 14 }}>
                        {formatPrice(data.price)}
                      </Text>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={token.colorPrimary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
