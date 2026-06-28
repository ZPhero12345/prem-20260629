import React from "react";
import { Layout as AntLayout, Typography, Button } from "antd";
import { ThunderboltOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  fullBleed?: boolean;
  searchBar?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, onToggleTheme, fullBleed, searchBar }) => {
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 6, 
            background: isDarkMode ? "#afc6ff" : "#1677ff", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            <ThunderboltOutlined style={{ color: isDarkMode ? "#002d6c" : "#ffffff", fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, color: isDarkMode ? "#afc6ff" : "#1677ff", fontSize: 18, transition: "color 0.3s" }}>
            CryptoMetric
          </Title>
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

      {/* Main Content Area */}
      <AntLayout style={{ background: isDarkMode ? "#131313" : "#f5f5f5", transition: "background 0.3s" }}>
        <Content style={fullBleed ? {
          padding: 0,
          width: "100%",
          height: "calc(100vh - 64px)",
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
