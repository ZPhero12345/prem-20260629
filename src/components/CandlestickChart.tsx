import React, { useRef, useEffect } from "react";
import { theme, Button, Spin } from "antd";
import { createChart, ColorType, CandlestickSeries, TickMarkType } from "lightweight-charts";
import type { UTCTimestamp, Time } from "lightweight-charts";

interface CandlestickChartProps {
  candlestickData: {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  selectedRange: number;
  onRangeChange: (range: number) => void;
  isFetching: boolean;
  hasData: boolean;
  openStatRef: React.RefObject<HTMLSpanElement | null>;
  highStatRef: React.RefObject<HTMLSpanElement | null>;
  lowStatRef: React.RefObject<HTMLSpanElement | null>;
  closeStatRef: React.RefObject<HTMLSpanElement | null>;
  overallOhlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  } | null;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = React.memo(({
  candlestickData,
  selectedRange,
  onRangeChange,
  isFetching,
  hasData,
  openStatRef,
  highStatRef,
  lowStatRef,
  closeStatRef,
  overallOhlc
}) => {
  const { token } = theme.useToken();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Header text DOM Refs to show active price metrics without React state updates
  const openValRef = useRef<HTMLSpanElement>(null);
  const highValRef = useRef<HTMLSpanElement>(null);
  const lowValRef = useRef<HTMLSpanElement>(null);
  const closeValRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candlestickData.length === 0) return;

    const container = chartContainerRef.current;
    
    // Determine background / grid line colors based on the theme
    const isDark = token.colorBgContainer === "#1c1b1b" || token.colorBgContainer.startsWith("#1");
    const textColor = token.colorTextDescription;
    const gridColor = isDark ? "#2a2a2a" : "#e8e8e8";

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColor,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      localization: {
        locale: 'en-US',
      },
      grid: {
        vertLines: { color: gridColor, style: 2 }, // Dashed vertical lines
        horzLines: { color: gridColor, style: 2 }, // Dashed horizontal lines
      },
      crosshair: {
        mode: 0, // Normal crosshair tracking
        vertLine: {
          color: isDark ? "#555" : "#ccc",
          labelBackgroundColor: "#1e1e1e",
        },
        horzLine: {
          color: isDark ? "#555" : "#ccc",
          labelBackgroundColor: "#1e1e1e",
        },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
          const date = new Date((time as number) * 1000);
          // Format based on tick mark type (0: Year, 1: Month, 2: DayOfMonth, 3: Time, 4: TimeWithSeconds)
          if (tickMarkType === TickMarkType.DayOfMonth) {
            return date.toLocaleDateString(locale, { month: "short", day: "numeric" }); // e.g. "Jun 27"
          }
          if (tickMarkType === TickMarkType.Month) {
            return date.toLocaleDateString(locale, { month: "short" }); // e.g. "Jun"
          }
          if (tickMarkType === TickMarkType.Year) {
            return date.toLocaleDateString(locale, { year: "numeric" }); // e.g. "2026"
          }
          return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
        }
      },
      width: container.clientWidth,
      height: container.clientHeight || 350,
    };

    const chart = createChart(container, chartOptions);

    const series = chart.addSeries(CandlestickSeries, {
      upColor: token.colorSuccess,
      downColor: token.colorError,
      borderVisible: false,
      wickUpColor: token.colorSuccess,
      wickDownColor: token.colorError,
    });

    series.setData(candlestickData);
    chart.timeScale().fitContent();

    // Set initial header values to the latest candle
    const latestCandle = candlestickData[candlestickData.length - 1];
    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const updateChartHeader = (open: number, high: number, low: number, close: number) => {
      if (openValRef.current) openValRef.current.textContent = formatCurrency(open);
      if (highValRef.current) highValRef.current.textContent = formatCurrency(high);
      if (lowValRef.current) lowValRef.current.textContent = formatCurrency(low);
      if (closeValRef.current) closeValRef.current.textContent = formatCurrency(close);

      const isGreen = close >= open;
      if (closeValRef.current) closeValRef.current.style.color = isGreen ? token.colorSuccess : token.colorError;
    };

    const updateStatsCard = (open: number, high: number, low: number, close: number) => {
      if (openStatRef.current) openStatRef.current.textContent = formatCurrency(open);
      if (highStatRef.current) highStatRef.current.textContent = formatCurrency(high);
      if (lowStatRef.current) lowStatRef.current.textContent = formatCurrency(low);
      if (closeStatRef.current) closeStatRef.current.textContent = formatCurrency(close);

      const isGreen = close >= open;
      if (closeStatRef.current) closeStatRef.current.style.color = isGreen ? token.colorSuccess : token.colorError;
    };

    const defaultStats = overallOhlc || latestCandle;

    if (latestCandle) {
      updateChartHeader(latestCandle.open, latestCandle.high, latestCandle.low, latestCandle.close);
    }
    if (defaultStats) {
      updateStatsCard(defaultStats.open, defaultStats.high, defaultStats.low, defaultStats.close);
    }

    // Subscribe to crosshair move events to update the DOM metric panel instantly
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        // Reset to default unhovered values
        if (latestCandle) {
          updateChartHeader(latestCandle.open, latestCandle.high, latestCandle.low, latestCandle.close);
        }
        if (defaultStats) {
          updateStatsCard(defaultStats.open, defaultStats.high, defaultStats.low, defaultStats.close);
        }
      } else {
        const data = param.seriesData.get(series);
        if (data) {
          const ohlcData = data as { open: number; high: number; low: number; close: number };
          updateChartHeader(ohlcData.open, ohlcData.high, ohlcData.low, ohlcData.close);
          updateStatsCard(ohlcData.open, ohlcData.high, ohlcData.low, ohlcData.close);
        }
      }
    });

    // Make the chart responsive using ResizeObserver
    const handleResize = () => {
      if (container) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candlestickData, token]);

  const ranges = [
    { label: "1D", value: 1 },
    { label: "7D", value: 7 },
    { label: "1M", value: 30 },
    { label: "3M", value: 90 },
    { label: "6M", value: 180 },
    { label: "1Y", value: 365 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Header Stats Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: token.colorTextDescription }}>
          <span>O: <span ref={openValRef} style={{ color: token.colorSuccess, fontWeight: 600 }}>$0.00</span></span>
          <span>H: <span ref={highValRef} style={{ color: token.colorSuccess, fontWeight: 600 }}>$0.00</span></span>
          <span>L: <span ref={lowValRef} style={{ color: token.colorError, fontWeight: 600 }}>$0.00</span></span>
          <span>C: <span ref={closeValRef} style={{ color: token.colorSuccess, fontWeight: 600 }}>$0.00</span></span>
        </div>
      </div>

      {/* lightweight-charts Rendering Container */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {(isFetching || !hasData) && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(19, 19, 19, 0.65)",
            backdropFilter: "blur(2px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: 8,
            gap: 12,
            padding: 16
          }}>
            <Spin size="default" tip="Loading asset statistics..." />
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Timeframe Controls underneath left chart */}
      <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${token.colorBorder}`, paddingTop: 12, marginTop: 12 }}>
        {ranges.map((r) => (
          <Button
            key={r.value}
            type={selectedRange === r.value ? "primary" : "text"}
            size="small"
            onClick={() => onRangeChange(r.value)}
            style={{
              borderRadius: 4,
              color: selectedRange === r.value ? undefined : token.colorTextDescription
            }}
          >
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
});

CandlestickChart.displayName = "CandlestickChart";
