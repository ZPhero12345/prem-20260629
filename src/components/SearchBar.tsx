import React, { useState, useEffect, useRef } from "react";
import { AutoComplete, Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchCoins } from "../utils/api";
import type { SearchResult } from "../utils/api";

interface SearchBarProps {
  onSelectAsset: (id: string) => void;
  onFocusStateChange: (focused: boolean) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectAsset, onFocusStateChange }) => {
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const handleSearch = async (searchText: string) => {
    if (!searchText.trim()) {
      setOptions([]);
      return;
    }

    setLoading(true);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchCoins(searchText);
        const mapped = results.map((coin: SearchResult) => ({
          value: coin.id,
          label: (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={coin.thumb} alt={coin.name} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                <span style={{ fontWeight: 500 }}>{coin.name}</span>
                <span style={{ color: "#8b90a0", fontSize: 12 }}>{coin.symbol.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: 11, color: "#8b90a0" }}>#{coin.market_cap_rank || "N/A"}</span>
            </div>
          ),
        }));
        setOptions(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSelect = (val: string) => {
    onSelectAsset(val);
    setValue("");
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <AutoComplete
        value={value}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onChange={(data) => setValue(data)}
        onFocus={() => onFocusStateChange(true)}
        onBlur={() => {
          // Slight delay so click triggers select before blur hides list
          setTimeout(() => onFocusStateChange(false), 200);
        }}
        style={{ width: "100%" }}
        popupClassName="search-autocomplete-popup"
      >
        <Input
          size="large"
          placeholder="Search assets (e.g. BTC, ETH, Solana)"
          prefix={<SearchOutlined style={{ color: "#8b90a0", marginRight: 8 }} />}
          suffix={loading ? <Spin size="small" /> : null}
          style={{
            background: "#1c1b1b",
            border: "1px solid #303030",
            color: "#e5e2e1",
            height: 48,
          }}
        />
      </AutoComplete>
    </div>
  );
};
