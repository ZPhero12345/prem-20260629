import React from "react";
import { Layout as AntLayout, Button } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = AntLayout;

import type { GlobalStats } from "../utils/api";

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  fullBleed?: boolean;
  searchBar?: React.ReactNode;
  globalStats?: GlobalStats;
}

export const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, onToggleTheme, fullBleed, searchBar, globalStats }) => {
  const navigate = useNavigate();

  return (
    <AntLayout style={{ minHeight: "100vh", background: isDarkMode ? "#131313" : "#f5f5f5", transition: "background 0.3s ease" }}>
      {/* Sleek Top Navigation Header */}
      <Header style={{
        background: isDarkMode ? "#0e0e0e" : "#ffffff",
        borderBottom: `1px solid ${isDarkMode ? "#2a2a2a" : "#e8e8e8"}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 10,
        transition: "background 0.3s, border-color 0.3s"
      }}>
        <div 
          onClick={() => navigate("/")}
          style={{ 
            cursor: "pointer",
            display: "flex", 
            alignItems: "center", 
            gap: 10,
            userSelect: "none"
          }}
        >
          {/* Modern vector logo combining a digital coin node and explorer magnifying glass */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="6" stroke={isDarkMode ? "#afc6ff" : "#1677ff"} strokeWidth="2.5" />
            <path d="M14.5 14.5L20 20" stroke={isDarkMode ? "#afc6ff" : "#1677ff"} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="2.5" fill={isDarkMode ? "#e5e2e1" : "#1f1f1f"} />
          </svg>
          <span style={{ 
            color: isDarkMode ? "#e5e2e1" : "#1f1f1f", 
            fontSize: 20, 
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontFamily: "Outfit, Inter, system-ui, sans-serif"
          }}>
            Crypto<span style={{ color: isDarkMode ? "#afc6ff" : "#1677ff", fontWeight: 500 }}>Explorer</span>
          </span>
        </div>

        {/* Centered Search Bar */}
        {searchBar && (
          <div style={{ flex: 1, maxWidth: 480, margin: "0 24px", display: "flex", alignItems: "center", justifyContent: "center", height: "38px", lineHeight: "normal" }}>
            {searchBar}
          </div>
        )}

        {/* Theme Toggle Button */}
        <Button 
          type="text"
          icon={isDarkMode ? <SunOutlined style={{ color: "#e5e2e1" }} /> : <MoonOutlined style={{ color: "#1f1f1f" }} />}
          onClick={onToggleTheme}
          style={{ fontSize: 16 }}
        />
      </Header>

      {/* Global Stats Bar */}
      {globalStats && (
        <div 
          className="global-stats-bar"
          style={{
            background: isDarkMode ? "#161616" : "#ffffff",
            borderBottom: `1px solid ${isDarkMode ? "#2a2a2a" : "#e8e8e8"}`,
            color: isDarkMode ? "#8b90a0" : "#555555"
          }}
        >
          <span>Coins: <strong style={{ color: isDarkMode ? "#e5e2e1" : "#1f1f1f" }}>{globalStats.active_cryptocurrencies.toLocaleString()}</strong></span>
          <span>Markets: <strong style={{ color: isDarkMode ? "#e5e2e1" : "#1f1f1f" }}>{globalStats.markets.toLocaleString()}</strong></span>
          <span>Total Market Cap: <strong style={{ color: isDarkMode ? "#e5e2e1" : "#1f1f1f" }}>${(globalStats.total_market_cap.usd / 1e12).toFixed(2)}T</strong> <span style={{ color: globalStats.market_cap_change_percentage_24h_usd >= 0 ? "#6de039" : "#ffb4ab" }}>({globalStats.market_cap_change_percentage_24h_usd.toFixed(2)}%)</span></span>
          <span>24h Vol: <strong style={{ color: isDarkMode ? "#e5e2e1" : "#1f1f1f" }}>${(globalStats.total_volume.usd / 1e9).toFixed(2)}B</strong></span>
          <span>Dominance: <strong style={{ color: isDarkMode ? "#e5e2e1" : "#1f1f1f" }}>BTC {globalStats.market_cap_percentage.btc.toFixed(1)}% / ETH {globalStats.market_cap_percentage.eth.toFixed(1)}%</strong></span>
        </div>
      )}

      {/* Main Content Area */}
      <AntLayout style={{ background: isDarkMode ? "#131313" : "#f5f5f5", transition: "background 0.3s" }}>
        <Content style={fullBleed ? {
          padding: 0,
          width: "100%",
          height: globalStats ? "calc(100vh - 102px)" : "calc(100vh - 64px)",
          boxSizing: "border-box",
          overflow: "hidden"
        } : { 
          padding: "24px", 
          maxWidth: 1200, 
          width: "100%", 
          margin: "0 auto",
          boxSizing: "border-box"
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
