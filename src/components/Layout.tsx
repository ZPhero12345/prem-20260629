import React from "react";
import { Layout as AntLayout, Typography } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AntLayout style={{ minHeight: "100vh", background: "#131313" }}>
      {/* Sleek Top Navigation Header */}
      <Header style={{
        background: "#0e0e0e",
        borderBottom: "1px solid #2a2a2a",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#afc6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ThunderboltOutlined style={{ color: "#002d6c", fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, color: "#afc6ff", fontSize: 18 }}>CryptoMetric</Title>
        </div>
      </Header>

      {/* Main Content Area */}
      <AntLayout style={{ background: "#131313" }}>
        <Content style={{ 
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
