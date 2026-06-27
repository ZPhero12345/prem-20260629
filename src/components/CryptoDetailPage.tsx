import React, { useState } from "react";
import { Typography, Button, Card, Col, Row, Statistic, theme, Tooltip as AntTooltip } from "antd";
import {
  SettingOutlined,
  FullscreenOutlined,
  CameraOutlined,
  UndoOutlined,
  RedoOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined,
  StarFilled
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCoinData } from "../utils/api";
import { CandlestickChart } from "./CandlestickChart";

const { Title } = Typography;

export const CryptoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [selectedRange, setSelectedRange] = useState<number | string>(7);
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

  const ohlc = assetData?.ohlc || null;
  const chartData = assetData?.chartData || [];

  // Sidebar watchlists
  const watchlist = [
    { symbol: "BTC", last: "$64,210.50", change: "+2.45%", isDown: false },
    { symbol: "ETH", last: "$3,452.12", change: "+1.82%", isDown: false },
    { symbol: "SOL", last: "$142.85", change: "-0.92%", isDown: true },
    { symbol: "LINK", last: "$18.42", change: "+5.10%", isDown: false },
  ];

  const formatPriceVal = (val?: number) => {
    if (val === undefined || val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2,
    }).format(val);
  };

  const isPositive = ohlc ? (ohlc.close >= ohlc.open) : coinDetails.change24h >= 0;

  return (
    <div style={{ background: "transparent", minHeight: "80vh", padding: "16px 0" }}>
      {/* Back button and page title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
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
          <AntTooltip title="Undo"><Button type="text" style={{ color: token.colorTextDescription }} icon={<UndoOutlined />} /></AntTooltip>
          <AntTooltip title="Redo"><Button type="text" style={{ color: token.colorTextDescription }} icon={<RedoOutlined />} /></AntTooltip>
          <AntTooltip title="Settings"><Button type="text" style={{ color: token.colorTextDescription }} icon={<SettingOutlined />} /></AntTooltip>
          <AntTooltip title="Camera"><Button type="text" style={{ color: token.colorTextDescription }} icon={<CameraOutlined />} /></AntTooltip>
          <AntTooltip title="Fullscreen"><Button type="text" style={{ color: token.colorTextDescription }} icon={<FullscreenOutlined />} /></AntTooltip>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* LEFT COLUMN: Candlestick Chart */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8,
              transition: "background 0.3s, border-color 0.3s",
              position: "relative"
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <CandlestickChart
              chartData={chartData}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              isFetching={isFetching}
              hasData={!!assetData}
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN: OHLC and Watchlist */}
        <Col xs={24} lg={8}>
          {/* OHLC Statistics Card */}
          <Card
            title={<span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>OHLC Statistics</span>}
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8,
              marginBottom: 24,
              transition: "background 0.3s, border-color 0.3s"
            }}
            styles={{ body: { padding: 16 } }}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>Open</span>}
                  value={formatPriceVal(ohlc?.open)}
                  valueStyle={{ color: token.colorText, fontSize: 16, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>High</span>}
                  value={formatPriceVal(ohlc?.high)}
                  valueStyle={{ color: token.colorSuccess, fontSize: 16, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>Low</span>}
                  value={formatPriceVal(ohlc?.low)}
                  valueStyle={{ color: token.colorError, fontSize: 16, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>Close</span>}
                  value={formatPriceVal(ohlc?.close)}
                  valueStyle={{ color: isPositive ? token.colorSuccess : token.colorError, fontSize: 16, fontWeight: 700 }}
                  prefix={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                />
              </Col>
              <Col span={12} style={{ marginTop: 8 }}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>Market Cap</span>}
                  value={coinDetails.marketCap}
                  valueStyle={{ color: token.colorText, fontSize: 15, fontWeight: 600 }}
                />
              </Col>
              <Col span={12} style={{ marginTop: 8 }}>
                <Statistic
                  title={<span style={{ color: token.colorTextDescription, fontSize: 11, textTransform: "uppercase" }}>Volume</span>}
                  value={coinDetails.volume}
                  valueStyle={{ color: token.colorText, fontSize: 15, fontWeight: 600 }}
                />
              </Col>
            </Row>
          </Card>

          {/* Simple watchlist pairs list */}
          <Card
            title={<span style={{ color: token.colorText, fontSize: 14, fontWeight: 700 }}>Quick Watchlist</span>}
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8,
              transition: "background 0.3s, border-color 0.3s"
            }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {watchlist.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => navigate(`/coin/${item.symbol.toLowerCase() === 'btc' ? 'bitcoin' : item.symbol.toLowerCase() === 'eth' ? 'ethereum' : item.symbol.toLowerCase() === 'sol' ? 'solana' : 'chainlink'}`)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: `1px solid ${token.colorBorder}`,
                    cursor: "pointer"
                  }}
                >
                  <span style={{ color: token.colorText, fontWeight: 600 }}>{item.symbol}/USD</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: token.colorText }}>{item.last}</span>
                    <span style={{ color: item.isDown ? token.colorError : token.colorSuccess, fontWeight: 600 }}>{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
