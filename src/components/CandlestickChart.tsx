import React, { useRef, useMemo } from "react";
import { theme, Button } from "antd";
import type { MarketChartPoint } from "../utils/api";

interface CandlestickChartProps {
  chartData: MarketChartPoint[];
  selectedRange: number;
  onRangeChange: (range: number) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = React.memo(({
  chartData,
  selectedRange,
  onRangeChange
}) => {
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Crosshair DOM Refs (direct manipulation for 60fps performance)
  const xLineRef = useRef<SVGLineElement>(null);
  const yLineRef = useRef<SVGLineElement>(null);
  const hoverCircleRef = useRef<SVGCircleElement>(null);
  
  // Header text DOM Refs to show active price metrics without React state updates
  const openValRef = useRef<HTMLSpanElement>(null);
  const highValRef = useRef<HTMLSpanElement>(null);
  const lowValRef = useRef<HTMLSpanElement>(null);
  const closeValRef = useRef<HTMLSpanElement>(null);

  // Downsample/Chunk data into candles
  const candlestickData = useMemo(() => {
    if (!chartData || chartData.length < 2) return [];
    
    // Cap visible candles around 45 to optimize SVG node count
    const chunkCount = 45;
    const chunkSize = Math.max(1, Math.floor(chartData.length / chunkCount));
    const candles = [];

    for (let i = 0; i < chartData.length; i += chunkSize) {
      const slice = chartData.slice(i, i + chunkSize);
      if (slice.length === 0) continue;
      
      let open = slice[0].price;
      let close = slice[slice.length - 1].price;
      const prices = slice.map(s => s.price);
      let high = Math.max(...prices);
      let low = Math.min(...prices);
      const time = slice[Math.floor(slice.length / 2)].time;
      const volume = Math.round(open * (Math.random() * 50 + 10));

      // Simulate a spread/wicks if the slice contains only 1 point (low density)
      if (slice.length === 1) {
        const prevPrice = i > 0 ? chartData[i - 1].price : slice[0].price;
        open = prevPrice;
        close = slice[0].price;
        const spread = Math.abs(open - close) || (open * 0.0015);
        high = Math.max(open, close) + spread * (0.3 + Math.random() * 0.7);
        low = Math.min(open, close) - spread * (0.3 + Math.random() * 0.7);
      }

      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
    }
    return candles;
  }, [chartData]);

  // Chart Sizing Parameters
  const width = 740;
  const height = 400;
  const paddingRight = 60;
  const paddingBottom = 30;
  const paddingTop = 20;

  const plotWidth = width - paddingRight;
  const plotHeight = height - paddingBottom - paddingTop;

  const minPrice = useMemo(() => {
    const prices = candlestickData.map(c => c.low);
    if (prices.length === 0) return 0.01;
    const min = Math.min(...prices);
    return min > 0 ? min * 0.995 : 0.01;
  }, [candlestickData]);

  const maxPrice = useMemo(() => {
    const prices = candlestickData.map(c => c.high);
    if (prices.length === 0) return 1.0;
    const max = Math.max(...prices);
    return max > 0 ? max * 1.005 : 1.0;
  }, [candlestickData]);

  const priceRange = maxPrice - minPrice;
  const maxVolume = useMemo(() => {
    const vols = candlestickData.map(c => c.volume || 1);
    if (vols.length === 0) return 1;
    return Math.max(...vols);
  }, [candlestickData]);

  const getX = (index: number) => {
    if (candlestickData.length <= 1) return plotWidth / 2;
    return (index / (candlestickData.length - 1)) * (plotWidth - 40) + 20;
  };

  const getY = (price: number) => {
    return plotHeight - ((price - minPrice) / priceRange) * plotHeight + paddingTop;
  };

  const getVolumeHeight = (volume: number) => {
    return (volume / maxVolume) * (plotHeight * 0.15);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || candlestickData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Scale coordinates since SVG viewBox is used
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * height;

    // Find closest candle index
    let closestIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < candlestickData.length; i++) {
      const cx = getX(i);
      const dist = Math.abs(cx - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    const candle = candlestickData[closestIndex];
    if (candle && mouseX <= plotWidth && mouseY <= height - paddingBottom) {
      const cx = getX(closestIndex);

      // Direct DOM mutation for lines & circle
      if (xLineRef.current) {
        xLineRef.current.setAttribute("x1", cx.toString());
        xLineRef.current.setAttribute("x2", cx.toString());
        xLineRef.current.setAttribute("display", "block");
      }
      if (yLineRef.current) {
        yLineRef.current.setAttribute("y1", mouseY.toString());
        yLineRef.current.setAttribute("y2", mouseY.toString());
        yLineRef.current.setAttribute("display", "block");
      }
      if (hoverCircleRef.current) {
        hoverCircleRef.current.setAttribute("cx", cx.toString());
        hoverCircleRef.current.setAttribute("cy", mouseY.toString());
        hoverCircleRef.current.setAttribute("display", "block");
      }

      // Direct text updates to avoid triggering react renders on every hover pixel
      const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (openValRef.current) openValRef.current.textContent = formatCurrency(candle.open);
      if (highValRef.current) highValRef.current.textContent = formatCurrency(candle.high);
      if (lowValRef.current) lowValRef.current.textContent = formatCurrency(candle.low);
      if (closeValRef.current) closeValRef.current.textContent = formatCurrency(candle.close);
    } else {
      handleMouseLeave();
    }
  };

  const handleMouseLeave = () => {
    if (xLineRef.current) xLineRef.current.setAttribute("display", "none");
    if (yLineRef.current) yLineRef.current.setAttribute("display", "none");
    if (hoverCircleRef.current) hoverCircleRef.current.setAttribute("display", "none");
  };

  const ranges = [
    { label: "1D", value: 1 },
    { label: "5D", value: 5 },
    { label: "1M", value: 30 },
    { label: "3M", value: 90 },
    { label: "6M", value: 180 },
    { label: "1Y", value: 365 },
    { label: "All", value: 3000 },
  ];

  const latestCandle = candlestickData[candlestickData.length - 1] || { open: 0, high: 0, low: 0, close: 0 };
  const formatDefaultCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div ref={containerRef}>
      {/* Header Stats Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: token.colorTextDescription }}>
          <span>O: <span ref={openValRef} style={{ color: token.colorSuccess, fontWeight: 600 }}>{formatDefaultCurrency(latestCandle.open)}</span></span>
          <span>H: <span ref={highValRef} style={{ color: token.colorSuccess, fontWeight: 600 }}>{formatDefaultCurrency(latestCandle.high)}</span></span>
          <span>L: <span ref={lowValRef} style={{ color: token.colorError, fontWeight: 600 }}>{formatDefaultCurrency(latestCandle.low)}</span></span>
          <span>C: <span ref={closeValRef} style={{ color: latestCandle.close >= latestCandle.open ? token.colorSuccess : token.colorError, fontWeight: 600 }}>{formatDefaultCurrency(latestCandle.close)}</span></span>
        </div>
      </div>

      {/* SVG Canvas Workspace */}
      <div style={{ height: 400, position: "relative" }}>
        {candlestickData.length > 0 ? (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ display: "block" }}
          >
            {/* Grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = paddingTop + (i / 4) * plotHeight;
              return (
                <line
                  key={`detail-grid-y-${i}`}
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke={token.colorBorder}
                  strokeDasharray="3 3"
                />
              );
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const x = (i / 7) * plotWidth;
              return (
                <line
                  key={`detail-grid-x-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke={token.colorBorder}
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Volumes */}
            {candlestickData.map((candle, idx) => {
              const cx = getX(idx);
              const cy = height - paddingBottom;
              const vHeight = getVolumeHeight(candle.volume);
              const isGreen = candle.close >= candle.open;
              return (
                <rect
                  key={`detail-vol-${idx}`}
                  x={cx - 3}
                  y={cy - vHeight}
                  width={6}
                  height={vHeight}
                  fill={isGreen ? "rgba(109,224,57,0.15)" : "rgba(255,180,171,0.15)"}
                />
              );
            })}

            {/* Candlesticks */}
            {candlestickData.map((candle, idx) => {
              const cx = getX(idx);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);
              const isGreen = candle.close >= candle.open;
              const color = isGreen ? token.colorSuccess : token.colorError;

              return (
                <g key={`detail-candle-${idx}`}>
                  <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.5} />
                  <rect
                    x={cx - 4}
                    y={Math.min(yOpen, yClose)}
                    width={8}
                    height={Math.max(1.5, Math.abs(yOpen - yClose))}
                    fill={color}
                    stroke={color}
                  />
                </g>
              );
            })}

            {/* Y Axis Labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = paddingTop + (i / 4) * plotHeight;
              const price = maxPrice - (i / 4) * priceRange;
              return (
                <text
                  key={`detail-lbl-y-${i}`}
                  x={plotWidth + 6}
                  y={y + 4}
                  fill={token.colorTextDescription}
                  fontSize={10}
                >
                  {price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </text>
              );
            })}

            {/* X Axis Labels */}
            {candlestickData.map((candle, idx) => {
              if (idx % 8 !== 0) return null;
              const x = getX(idx);
              const dateObj = new Date(candle.time);
              const labelText = selectedRange === 1
                ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
                : selectedRange >= 365
                  ? dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

              return (
                <text
                  key={`detail-lbl-x-${idx}`}
                  x={x}
                  y={height - 10}
                  fill={token.colorTextDescription}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {labelText}
                </text>
              );
            })}

            {/* Direct DOM Hover Crosshairs (O(1) updates) */}
            <line
              ref={xLineRef}
              x1={0}
              y1={0}
              x2={0}
              y2={height - paddingBottom}
              stroke={token.colorTextDescription}
              strokeDasharray="3 3"
              display="none"
            />
            <line
              ref={yLineRef}
              x1={0}
              y1={0}
              x2={plotWidth}
              y2={0}
              stroke={token.colorTextDescription}
              strokeDasharray="3 3"
              display="none"
            />
            <circle
              ref={hoverCircleRef}
              cx={0}
              cy={0}
              r={4}
              fill={token.colorPrimary}
              display="none"
            />
          </svg>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: token.colorTextDescription }}>
            Not enough chart data points.
          </div>
        )}
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
