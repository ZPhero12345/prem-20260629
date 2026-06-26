import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SearchBar } from "./components/SearchBar";
import { TrendingBar } from "./components/TrendingBar";
import { MainTrendPage } from "./components/MainTrendPage";
import { CryptoDetailPage } from "./components/CryptoDetailPage";
import { fetchTrendingCoins, fetchCoinData } from "./utils/api";
import type { TrendingCoin, MarketChartPoint, OhlcData } from "./utils/api";
import { Row, Col, Card, Typography, ConfigProvider, theme } from "antd";
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
    creator: string;
    launchYear: number;
    consensus: string;
    supply: string;
    description: string;
  };
}

function MainAppContent() {
  const navigate = useNavigate();
  const [selectedRange] = useState(7);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Fetch trending coins
  const { data: trendingCoins = [], isLoading: trendingLoading } = useQuery<TrendingCoin[]>({
    queryKey: ["trendingCoins"],
    queryFn: fetchTrendingCoins,
    staleTime: 60000,
  });

  // Fetch default bitcoin chart for the main page trend chart
  const { data: assetData, isLoading: assetLoading } = useQuery<AssetDataPayload>({
    queryKey: ["coinData", "bitcoin", selectedRange],
    queryFn: () => fetchCoinData("bitcoin", selectedRange),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const coinDetails = assetData?.coinDetails || {
    name: "Bitcoin",
    symbol: "BTC",
    price: 64210.50,
    change24h: 2.45,
    marketCap: "$1.2T",
    volume: "$34.8B",
    creator: "Satoshi Nakamoto",
    launchYear: 2009,
    consensus: "Proof of Work (PoW)",
    supply: "19.5M BTC",
    description: "Bitcoin is the world's first and most widely adopted decentralized digital currency, enabling peer-to-peer transactions without intermediaries."
  };

  const dynamicTextColor = isDarkMode ? "#e5e2e1" : "#1f1f1f";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#afc6ff' : '#0059c7',
          colorSuccess: isDarkMode ? '#6de039' : '#45b703',
          colorError: isDarkMode ? '#ffb4ab' : '#93000a',
          colorWarning: '#ffb3ae',
          colorBgBase: isDarkMode ? '#131313' : '#f5f5f5',
          colorBgContainer: isDarkMode ? '#1c1b1b' : '#ffffff',
          colorTextBase: isDarkMode ? '#e5e2e1' : '#1f1f1f',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          borderRadius: 4,
        },
        components: {
          Card: {
            borderRadiusLG: 8,
            colorBgContainer: isDarkMode ? '#1c1b1b' : '#ffffff',
            colorBorderSecondary: isDarkMode ? '#303030' : '#e8e8e8',
          },
          Button: {
            borderRadius: 4,
          },
          Input: {
            borderRadius: 4,
          },
          Table: {
            headerBg: isDarkMode ? '#151515' : '#fafafa',
            headerColor: isDarkMode ? '#e5e2e1' : '#1f1f1f',
            rowHoverBg: isDarkMode ? '#2c2b2b' : '#f5f5f5',
            borderColor: isDarkMode ? '#303030' : '#e8e8e8',
          },
        },
      }}
    >
      <Layout isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(prev => !prev)}>
        <Routes>
          <Route path="/" element={
            <>
              {/* Top Header section */}
              <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
                <Col xs={24} lg={16}>
                  <SearchBar 
                    onSelectAsset={(id) => navigate(`/coin/${id}`)} 
                    onFocusStateChange={setIsSearchFocused} 
                  />
                </Col>
                
                <Col xs={24} lg={8}>
                  <Card 
                    style={{ 
                      background: isDarkMode ? "#1c1b1b" : "#ffffff", 
                      border: `1px solid ${isDarkMode ? "#303030" : "#e8e8e8"}`,
                      transition: "background 0.3s, border-color 0.3s"
                    }} 
                    styles={{ body: { padding: "12px 20px" } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text style={{ color: "#8b90a0", fontSize: 11, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                          EQUITY BALANCE
                        </Text>
                        <Title level={4} style={{ margin: "4px 0 0 0", color: dynamicTextColor, fontWeight: 700 }}>
                          $128,450.00
                        </Title>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          color: isDarkMode ? "#6de039" : "#45b703",
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
                  onSelectAsset={(id) => navigate(`/coin/${id}`)}
                />
              )}

              {/* Main Trend Dashboard Content */}
              <MainTrendPage
                coinDetails={coinDetails}
                chartData={assetData?.chartData || []}
                ohlc={assetData?.ohlc || null}
                loading={assetLoading}
                onSelectAsset={(id) => navigate(`/coin/${id}`)}
              />
            </>
          } />
          <Route path="/coin/:id" element={<CryptoDetailPage />} />
        </Routes>
      </Layout>
    </ConfigProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainAppContent />
    </BrowserRouter>
  );
}

export default App;
