import React from "react";
import { Row, Col, Card, Statistic, Spin } from "antd";
import type { OhlcData } from "../utils/api";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface OhlcGridProps {
  ohlc: OhlcData | null;
  loading: boolean;
  marketCap: string;
  volume: string;
}

export const OhlcGrid: React.FC<OhlcGridProps> = ({ ohlc, loading, marketCap, volume }) => {
  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2,
    }).format(val);
  };

  const isPositive = ohlc ? (ohlc.close >= ohlc.open) : true;

  if (loading || !ohlc) {
    return (
      <Card style={{ background: "#1c1b1b", border: "1px solid #303030", padding: 24, textAlign: "center" }}>
        <Spin tip="Loading OHLC statistics..." />
      </Card>
    );
  }

  const statItems = [
    { title: "Open", value: formatPrice(ohlc.open), color: "#e5e2e1" },
    { title: "High", value: formatPrice(ohlc.high), color: "#6de039" },
    { title: "Low", value: formatPrice(ohlc.low), color: "#ffb4ab" },
    { 
      title: "Close", 
      value: formatPrice(ohlc.close), 
      color: isPositive ? "#6de039" : "#ffb4ab",
      prefix: isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />
    },
    { title: "Market Cap", value: marketCap, color: "#e5e2e1" },
    { title: "24h Volume", value: volume, color: "#e5e2e1" },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {statItems.map((item, index) => (
          <Col xs={24} sm={12} md={6} lg={4} key={index}>
            <Card 
              style={{ 
                background: "#1c1b1b", 
                border: "1px solid #303030" 
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Statistic
                title={<span style={{ color: "#8b90a0", textTransform: "uppercase", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>{item.title}</span>}
                value={item.value}
                valueStyle={{ color: item.color, fontSize: 18, fontWeight: 700 }}
                prefix={item.prefix}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
