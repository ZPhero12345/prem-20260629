import React from "react";
import { Card, Table, Typography, Button, theme } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface RecentMoversProps {
  onSelectAsset: (id: string) => void;
}

export const RecentMovers: React.FC<RecentMoversProps> = ({ onSelectAsset }) => {
  const { token } = theme.useToken();

  const data = [
    { key: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 64210.50, change: 2.45, cap: "$1.2T", thumb: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
    { key: "ethereum", name: "Ethereum", symbol: "ETH", price: 3452.12, change: 1.82, cap: "$415.2B", thumb: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
    { key: "solana", name: "Solana", symbol: "SOL", price: 142.85, change: -0.92, cap: "$63.1B", thumb: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
    { key: "chainlink", name: "Chainlink", symbol: "LINK", price: 18.42, change: 5.10, cap: "$10.8B", thumb: "https://assets.coingecko.com/coins/images/877/large/chainlink.png" },
  ];

  const columns = [
    {
      title: "Asset",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: typeof data[0]) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={record.thumb} alt={text} style={{ width: 24, height: 24, borderRadius: "50%" }} />
          <div>
            <Text style={{ fontWeight: 600, color: token.colorText }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{record.symbol}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      render: (val: number) => (
        <Text style={{ fontWeight: 600, color: token.colorText }}>
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)}
        </Text>
      ),
    },
    {
      title: "24h Change",
      dataIndex: "change",
      key: "change",
      align: "right" as const,
      render: (val: number) => {
        const isPositive = val >= 0;
        return (
          <span style={{
            color: isPositive ? token.colorSuccess : token.colorError,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4
          }}>
            {isPositive ? <ArrowUpOutlined style={{ fontSize: 11 }} /> : <ArrowDownOutlined style={{ fontSize: 11 }} />}
            {Math.abs(val).toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: "Market Cap",
      dataIndex: "cap",
      key: "cap",
      align: "right" as const,
      responsive: ["md"] as any,
      render: (val: string) => <Text style={{ color: token.colorText }}>{val}</Text>,
    },
    {
      title: "Action",
      key: "action",
      align: "right" as const,
      render: (_: any, record: typeof data[0]) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => onSelectAsset(record.key)}
        >
          View Chart
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 24,
        transition: "background 0.3s, border-color 0.3s"
      }}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: token.colorText }}>
          Recent Market Movers
        </Title>
      </div>
      <Table 
        dataSource={data} 
        columns={columns} 
        pagination={false}
        style={{ background: "transparent" }}
        className="dark-table"
      />
    </Card>
  );
};
