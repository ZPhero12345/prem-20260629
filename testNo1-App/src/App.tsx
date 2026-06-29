import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SearchBar } from "./components/SearchBar";
import { TrendingBar } from "./components/TrendingBar";
import { MainTrendPage } from "./components/MainTrendPage";
import { CryptoDetailPage } from "./components/CryptoDetailPage";
import { fetchTrendingCoins, fetchGlobalStats, fetchMarketCoins } from "./utils/api";
import type { TrendingCoin } from "./utils/api";
import { Typography, ConfigProvider, theme, Alert } from "antd";

const { Title, Text } = Typography;

function CryptoDetailPageWrapper() {
  const { id } = useParams<{ id: string }>();
  return <CryptoDetailPage key={id} />;
}



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

  // Fetch top 15 market cap coins for search box suggestions
  const { data: topMarketCoins = [] } = useQuery({
    queryKey: ["topMarketCoins"],
    queryFn: () => fetchMarketCoins(undefined, 15),
    staleTime: 5 * 60 * 1000,
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
            suggestedCoins={topMarketCoins}
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
              <div style={{ marginBottom: 28 }}>
                <Title level={2} style={{ margin: "0 0 8px 0", color: dynamicTextColor, fontWeight: 700 }}>
                  Crypto Explorer
                </Title>
                <Text style={{ color: isDarkMode ? "#8b90a0" : "#595959", fontSize: 14, display: "block", lineHeight: "1.6" }}>
                  Explore live-updated cryptocurrency price charts and detailed statistics (OHLC) in a user-friendly interface. Search for any coin with smart suggestions, view trending assets, and track historical price movements across essential time ranges.
                </Text>
              </div>

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
          <Route path="/coin/:id" element={<CryptoDetailPageWrapper />} />
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
