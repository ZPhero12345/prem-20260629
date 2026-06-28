import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SearchBar } from "./components/SearchBar";
import { TrendingBar } from "./components/TrendingBar";
import { MainTrendPage } from "./components/MainTrendPage";
import { CryptoDetailPage } from "./components/CryptoDetailPage";
import { fetchTrendingCoins, fetchGlobalStats } from "./utils/api";
import type { TrendingCoin } from "./utils/api";
import { Row, Col, Card, Typography, ConfigProvider, theme, Alert } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;



function MainAppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoinDetail = location.pathname.startsWith("/coin");
  const [_isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Fetch global crypto stats
  const { data: globalStats, isError: globalError, refetch: refetchGlobal } = useQuery({
    queryKey: ["globalStats"],
    queryFn: fetchGlobalStats,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch trending coins
  const { data: trendingCoins = [], isLoading: trendingLoading, isError: trendingError } = useQuery<TrendingCoin[]>({
    queryKey: ["trendingCoins"],
    queryFn: fetchTrendingCoins,
    staleTime: 60000,
    retry: 1,
  });




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
      <Layout 
        isDarkMode={isDarkMode} 
        onToggleTheme={() => setIsDarkMode(prev => !prev)} 
        fullBleed={isCoinDetail}
        globalStats={globalStats}
        searchBar={
          <SearchBar 
            onSelectAsset={(id) => navigate(`/coin/${id}`)} 
            onFocusStateChange={setIsSearchFocused} 
            trendingCoins={trendingCoins}
          />
        }
      >
        <Routes>
          <Route path="/" element={
            <>
              {trendingError && (
                <Alert
                  message="API Rate Limit Reached"
                  description="The public CoinGecko API has rate-limited requests. Showing static fallback values. Please try again in a few moments."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}
              {/* Top Header section */}
              <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
                <Col xs={24}>
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

              {/* Suggest trending coins */}
              {trendingCoins.length > 0 && (
                <TrendingBar 
                  trendingCoins={trendingCoins} 
                  loading={trendingLoading} 
                  onSelectAsset={(id) => navigate(`/coin/${id}`)}
                />
              )}

              {/* Main Trend Dashboard Content */}
              <MainTrendPage
                globalStats={globalStats}
                globalError={globalError}
                onReloadGlobal={refetchGlobal}
                loading={trendingLoading}
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
