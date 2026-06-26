import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { SearchBar } from "./components/SearchBar";
import { TrendingBar } from "./components/TrendingBar";
import { PriceChart } from "./components/PriceChart";
import { OhlcGrid } from "./components/OhlcGrid";
import { RecentMovers } from "./components/RecentMovers";
import { fetchTrendingCoins, fetchCoinData } from "./utils/api";
import type { TrendingCoin, MarketChartPoint, OhlcData } from "./utils/api";
import { Row, Col, Card, Typography } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface AssetDataPayload {
  chartData: MarketChartPoint[];
  ohlc: OhlcData;
  coinDetails: {
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    marketCap: string;
    volume: string;
  };
}

function App() {
  const [selectedAsset, setSelectedAsset] = useState("bitcoin");
  const [selectedRange, setSelectedRange] = useState(7); // 7-day default viewing horizon (Req 6.c)
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Prefetch/hydrate trending coins (Req 6.b)
  const { data: trendingCoins = [], isLoading: trendingLoading } = useQuery<TrendingCoin[]>({
    queryKey: ["trendingCoins"],
    queryFn: fetchTrendingCoins,
    staleTime: 60000,
  });

  // Fetch chart and OHLC data for selected coin (Req 6.c, 6.d, 6.e)
  const { data: assetData, isLoading: assetLoading } = useQuery<AssetDataPayload>({
    queryKey: ["coinData", selectedAsset, selectedRange],
    queryFn: () => fetchCoinData(selectedAsset, selectedRange),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const handleSelectAsset = (id: string) => {
    setSelectedAsset(id);
  };

  const coinDetails = assetData?.coinDetails || {
    name: "Bitcoin",
    symbol: "BTC",
    price: 64210.50,
    change24h: 2.45,
    marketCap: "$1.2T",
    volume: "$34.8B",
  };

  return (
    <Layout>
      {/* Top Header section */}
      <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <SearchBar 
            onSelectAsset={handleSelectAsset} 
            onFocusStateChange={setIsSearchFocused} 
          />
        </Col>
        
        {/* Equity Balance component on the right */}
        <Col xs={24} lg={8}>
          <Card 
            style={{ 
              background: "#1c1b1b", 
              border: "1px solid #303030",
            }} 
            bodyStyle={{ padding: "12px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text style={{ color: "#8b90a0", fontSize: 11, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  EQUITY BALANCE
                </Text>
                <Title level={4} style={{ margin: "4px 0 0 0", color: "#e5e2e1", fontWeight: 700 }}>
                  $128,450.00
                </Title>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  color: "#6de039",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <ArrowUpOutlined style={{ fontSize: 11 }} />
                  $4,210.00 (3.2%)
                </span>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Buying Power: $12,045.00
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Suggest trending coins immediately on focus or show by default */}
      {(isSearchFocused || trendingCoins.length > 0) && (
        <TrendingBar 
          trendingCoins={trendingCoins} 
          loading={trendingLoading} 
          onSelectAsset={handleSelectAsset}
        />
      )}

      {/* Main Chart Canvas */}
      <PriceChart
        assetName={coinDetails.name}
        assetSymbol={coinDetails.symbol}
        chartData={assetData?.chartData || []}
        loading={assetLoading}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        currentPrice={coinDetails.price}
        change24h={coinDetails.change24h}
      />

      {/* OHLC Statistics Panel */}
      <OhlcGrid
        ohlc={assetData?.ohlc || null}
        loading={assetLoading}
        marketCap={coinDetails.marketCap}
        volume={coinDetails.volume}
      />

      {/* Recent Market Movers Table */}
      <RecentMovers onSelectAsset={handleSelectAsset} />
    </Layout>
  );
}

export default App;
