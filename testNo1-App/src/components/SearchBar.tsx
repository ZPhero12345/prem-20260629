import React, { useState, useEffect, useRef, useCallback } from "react";
import { AutoComplete, Input, Spin, theme } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchCoins, initializeCoinsCache } from "../utils/api";
import type { SearchResult } from "../utils/api";

interface SearchBarProps {
  onSelectAsset: (id: string) => void;
  onFocusStateChange: (focused: boolean) => void;
  suggestedCoins?: any[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectAsset, onFocusStateChange, suggestedCoins = [] }) => {
  const { token } = theme.useToken();
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Initialize background cache for typo-tolerant searches
  useEffect(() => {
    initializeCoinsCache();
  }, []);

  // Helper to map and show default suggestions when search query is empty
  const showDefaultSuggestions = useCallback(() => {
    if (!suggestedCoins || suggestedCoins.length === 0) {
      setOptions([]);
      return;
    }
    const mapped = suggestedCoins.slice(0, 15).map((coin) => ({
      value: coin.id,
      label: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {coin.image ? (
              <img src={coin.image} alt={coin.name} style={{ width: 20, height: 20, borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 20, height: 20 }} />
            )}
            <span style={{ fontWeight: 500 }}>{coin.name}</span>
            <span style={{ color: "#8b90a0", fontSize: 12 }}>{coin.symbol.toUpperCase()}</span>
          </div>
          <span style={{ fontSize: 11, color: "#8b90a0" }}>#{coin.market_cap_rank || "N/A"}</span>
        </div>
      ),
    }));
    setOptions(mapped);
  }, [suggestedCoins]);

  // Update suggestions if suggestedCoins load in after focus
  useEffect(() => {
    if (!value.trim() && options.length === 0 && suggestedCoins.length > 0) {
      // populate suggestions if we have focus
      const isFocused = document.activeElement === document.querySelector(".ant-select-selection-search-input");
      if (isFocused) {
        showDefaultSuggestions();
      }
    }
  }, [suggestedCoins, value, options.length, showDefaultSuggestions]);

  const handleSearch = async (searchText: string) => {
    if (!searchText.trim()) {
      showDefaultSuggestions();
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
                {coin.thumb && coin.thumb.startsWith("http") ? (
                  <img src={coin.thumb} alt={coin.name} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                ) : (
                  // Empty space wrapper to align text nicely if image is absent
                  <div style={{ width: 20, height: 20 }} />
                )}
                <span style={{ fontWeight: 500 }}>{coin.name}</span>
                <span style={{ color: "#8b90a0", fontSize: 12 }}>{coin.symbol.toUpperCase()}</span>
              </div>
              {coin.market_cap_rank && coin.market_cap_rank !== 9999 ? (
                <span style={{ fontSize: 11, color: "#8b90a0" }}>#{coin.market_cap_rank}</span>
              ) : null}
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
    <div style={{ width: "100%", maxWidth: 640, display: "flex", alignItems: "center", lineHeight: "normal" }}>
      <AutoComplete
        value={value}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onChange={(data) => setValue(data)}
        defaultActiveFirstOption={true}
        onFocus={() => {
          onFocusStateChange(true);
          if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
          }
          if (!value.trim()) {
            showDefaultSuggestions();
          }
        }}
        onBlur={() => {
          // Slight delay so click triggers select before blur hides list
          setTimeout(() => onFocusStateChange(false), 200);
        }}
        style={{ width: "100%", display: "flex", alignItems: "center" }}
        popupClassName="search-autocomplete-popup"
      >
        <Input
          placeholder="Search assets (e.g. BTC, ETH, Solana)"
          prefix={<SearchOutlined style={{ color: token.colorTextDescription, marginRight: 8 }} />}
          suffix={loading ? <Spin size="small" /> : null}
          onKeyDown={(e) => {
            if (e.key === "Enter" && options.length > 0) {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(options[0].value);
            }
          }}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            color: token.colorText,
            height: 38,
            borderRadius: 6,
            transition: "background 0.3s, border-color 0.3s, color 0.3s"
          }}
        />
      </AutoComplete>
    </div>
  );
};
