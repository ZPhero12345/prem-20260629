import React, { useState } from "react";
import { Layout as AntLayout, Menu, Button, Drawer, Typography, Card } from "antd";
import { 
  MenuOutlined, 
  DashboardOutlined, 
  LineChartOutlined, 
  WalletOutlined, 
  HistoryOutlined, 
  QuestionCircleOutlined, 
  LogoutOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";

const { Sider, Content } = AntLayout;
const { Text, Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "markets", icon: <LineChartOutlined />, label: "Markets" },
    { key: "portfolio", icon: <WalletOutlined />, label: "Portfolio" },
    { key: "history", icon: <HistoryOutlined />, label: "History" },
  ];

  const bottomItems = [
    { key: "help", icon: <QuestionCircleOutlined />, label: "Help" },
    { key: "logout", icon: <LogoutOutlined />, label: "Logout" },
  ];

  const renderSidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 16px" }}>
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#afc6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ThunderboltOutlined style={{ color: "#002d6c", fontSize: 18 }} />
        </div>
        <Title level={4} style={{ margin: 0, color: "#afc6ff" }}>CryptoMetric</Title>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        items={menuItems}
        style={{ background: "transparent", border: "none" }}
      />

      <div style={{ marginTop: "auto" }}>
        <Card 
          style={{ 
            background: "linear-gradient(135deg, #1c1b1b 0%, #2a2a2a 100%)", 
            border: "1px solid #414755", 
            marginBottom: 20,
            borderRadius: 8
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Title level={5} style={{ margin: 0, fontSize: 14 }}>Upgrade to Pro</Title>
          <Text type="secondary" style={{ fontSize: 12, display: "block", margin: "8px 0" }}>
            Get access to advanced analytics & API endpoints.
          </Text>
          <Button type="primary" size="small" block style={{ fontSize: 12 }}>
            Go Pro
          </Button>
        </Card>

        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={bottomItems}
          style={{ background: "transparent", border: "none" }}
        />
      </div>
    </div>
  );

  return (
    <AntLayout style={{ minHeight: "100vh", background: "#131313" }}>
      {/* Desktop Sider */}
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={() => {
          // If screen size goes under lg, Sider hides automatically
        }}
        trigger={null}
        style={{
          background: "#0e0e0e",
          borderRight: "1px solid #2a2a2a",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 10,
        }}
      >
        {renderSidebarContent()}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0, background: "#0e0e0e" }}
        width={240}
      >
        {renderSidebarContent()}
      </Drawer>

      <AntLayout style={{ 
        marginLeft: 240, 
        background: "#131313",
        transition: "margin-left 0.2s",
        // Responsive margins
        "@media (max-width: 991px)": {
          marginLeft: 0
        }
      } as any} className="main-layout-container">
        {/* Mobile Header Menu Button */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          padding: "16px 24px", 
          background: "#131313",
          borderBottom: "1px solid #2a2a2a",
          position: "sticky",
          top: 0,
          zIndex: 9,
          // Hide on desktop
        }} className="mobile-header">
          <Button 
            className="mobile-menu-btn"
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setDrawerVisible(true)} 
            style={{ color: "#e5e2e1", marginRight: 16 }}
          />
          <Title level={4} style={{ margin: 0, color: "#afc6ff", fontSize: 18 }} className="mobile-logo-text">CryptoMetric</Title>
        </div>

        <Content style={{ padding: "24px", maxWidth: 1400, width: "100%", margin: "0 auto" }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
