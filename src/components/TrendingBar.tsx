import React from "react";
import { Card, Row, Col, Typography, Spin, theme } from "antd";
import type { TrendingCoin } from "../utils/api";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TrendingBarProps {
  trendingCoins: TrendingCoin[];
  loading: boolean;
  onSelectAsset: (id: string) => void;
}

export const TrendingBar: React.FC<TrendingBarProps> = ({ trendingCoins, loading, onSelectAsset }) => {
  const { token } = theme.useToken();

  if (loading) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center" }}>
        <Spin tip="Loading trending assets..." />
      </div>
    );
  }

  // Draw a simple mini sparkline path based on price change direction
  const renderMiniSparkline = (isPositive: boolean) => {
    const strokeColor = isPositive ? token.colorSuccess : token.colorError;
    const path = isPositive
      ? "M0,25 Q15,10 30,18 T60,5"
      : "M0,5 Q15,20 30,10 T60,25";
    return (
      <svg width="60" height="30" style={{ overflow: "visible" }}>
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Text style={{ display: "block", marginBottom: 12, fontWeight: 600, color: token.colorTextDescription, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.05em" }}>
        Trending Now
      </Text>
      <Row gutter={[16, 16]}>
        {trendingCoins.slice(0, 4).map((coin) => {
          const change24h = coin.item.data.price_change_percentage_24h.usd || 0;
          const isPositive = change24h >= 0;

          return (
            <Col xs={24} sm={12} md={6} key={coin.item.id}>
              <Card
                hoverable
                onClick={() => onSelectAsset(coin.item.id)}
                style={{
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  cursor: "pointer",
                  transition: "background 0.3s, border-color 0.3s"
                }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img
                      src={coin.item.thumb}
                      alt={coin.item.name}
                      style={{ width: 28, height: 28, borderRadius: "50%" }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontWeight: 600, color: token.colorText }}>{coin.item.symbol.toUpperCase()}</Text>
                        <span style={{
                          color: isPositive ? token.colorSuccess : token.colorError,
                          fontSize: 11,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center"
                        }}>
                          {isPositive ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
                          {Math.abs(change24h).toFixed(1)}%
                        </span>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{coin.item.name}</Text>
                    </div>
                  </div>
                  {renderMiniSparkline(isPositive)}
                </div>

                <div style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: token.colorText }}>
                    {coin.item.data.price}
                  </Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};
