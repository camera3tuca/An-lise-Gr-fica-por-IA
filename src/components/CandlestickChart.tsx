import React, { useState, useRef, useMemo } from 'react';
import { ProcessedCandle, SupportResistanceLevels, StopTarget } from '../types';

interface Props {
  data?: ProcessedCandle[];
  candles?: ProcessedCandle[];
  showAverages: boolean;
  showBollinger: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showLevels: boolean;
  levels: SupportResistanceLevels;
  stopTarget?: StopTarget | null;
  stopAlvo?: StopTarget | null;
}

export const CandlestickChart: React.FC<Props> = ({
  data,
  candles,
  showAverages,
  showBollinger,
  showRSI,
  showMACD,
  showLevels,
  levels,
  stopTarget,
  stopAlvo,
}) => {
  const chartData = data || candles || [];
  const activeStopTarget = stopTarget ?? stopAlvo ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [viewCount, setViewCount] = useState<number>(60); // default show last 60 bars

  // Visible window of candles
  const visibleData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (viewCount === 0 || viewCount >= chartData.length) return chartData;
    return chartData.slice(-viewCount);
  }, [chartData, viewCount]);

  // Dimension settings
  const width = 1000;
  const priceHeight = 340;
  const volumeHeight = 70;
  const rsiHeight = showRSI ? 85 : 0;
  const macdHeight = showMACD ? 85 : 0;
  const gap = 14;

  const totalHeight =
    priceHeight +
    volumeHeight +
    (showRSI ? rsiHeight + gap : 0) +
    (showMACD ? macdHeight + gap : 0) +
    gap +
    30; // bottom time axis

  // Calculate Price Range (Min/Max) including active overlays
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleData.length === 0) {
      return { minPrice: 0, maxPrice: 100, maxVolume: 1000 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const c of visibleData) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;

      if (showBollinger) {
        if (c.bb_inferior && c.bb_inferior < min) min = c.bb_inferior;
        if (c.bb_superior && c.bb_superior > max) max = c.bb_superior;
      }
      if (showAverages) {
        if (c.SMA20 && c.SMA20 < min) min = c.SMA20;
        if (c.SMA20 && c.SMA20 > max) max = c.SMA20;
        if (c.SMA200 && c.SMA200 < min) min = c.SMA200;
        if (c.SMA200 && c.SMA200 > max) max = c.SMA200;
      }
    }

    if (showLevels && levels) {
      for (const s of levels.suportes) {
        if (s < min && s > min * 0.7) min = s;
      }
      for (const r of levels.resistencias) {
        if (r > max && r < max * 1.3) max = r;
      }
    }

    if (activeStopTarget) {
      if (activeStopTarget.stop < min) min = activeStopTarget.stop;
      if (activeStopTarget.alvo > max) max = activeStopTarget.alvo;
    }

    // Add 4% padding
    const range = max - min || 1;
    return {
      minPrice: min - range * 0.04,
      maxPrice: max + range * 0.04,
      maxVolume: maxVol * 1.15 || 1,
    };
  }, [visibleData, showBollinger, showAverages, showLevels, levels, activeStopTarget]);

  // Chart layout geometry
  const leftMargin = 12;
  const rightMargin = 72; // price axis width
  const plotWidth = width - leftMargin - rightMargin;

  const n = visibleData.length;
  const step = n > 0 ? plotWidth / n : 1;
  const candleWidth = Math.max(2, Math.min(14, step * 0.72));

  // Coordinate mappers
  const getX = (idx: number) => leftMargin + (idx + 0.5) * step;
  const getYPrice = (price: number) => {
    const norm = (price - minPrice) / (maxPrice - minPrice || 1);
    return priceHeight - norm * priceHeight + 10;
  };
  const getYVolume = (vol: number) => {
    const norm = vol / (maxVolume || 1);
    const startY = priceHeight + gap;
    return startY + volumeHeight - norm * volumeHeight;
  };

  // RSI y coordinate
  const rsiStartY = priceHeight + gap + volumeHeight + gap;
  const getYRSI = (rsiVal: number) => {
    const clamped = Math.max(0, Math.min(100, rsiVal));
    return rsiStartY + rsiHeight - (clamped / 100) * rsiHeight;
  };

  // MACD y coordinate
  const macdStartY = rsiStartY + (showRSI ? rsiHeight + gap : 0);
  const { minMacd, maxMacd } = useMemo(() => {
    let minM = -0.5;
    let maxM = 0.5;
    for (const c of visibleData) {
      if (c.macd !== undefined) {
        if (c.macd < minM) minM = c.macd;
        if (c.macd > maxM) maxM = c.macd;
      }
      if (c.macd_sinal !== undefined) {
        if (c.macd_sinal < minM) minM = c.macd_sinal;
        if (c.macd_sinal > maxM) maxM = c.macd_sinal;
      }
      if (c.macd_hist !== undefined) {
        if (c.macd_hist < minM) minM = c.macd_hist;
        if (c.macd_hist > maxM) maxM = c.macd_hist;
      }
    }
    const maxAbs = Math.max(Math.abs(minM), Math.abs(maxM)) * 1.15 || 1;
    return { minMacd: -maxAbs, maxMacd: maxAbs };
  }, [visibleData]);

  const getYMacd = (val: number) => {
    const norm = (val - minMacd) / (maxMacd - minMacd || 1);
    return macdStartY + macdHeight - norm * macdHeight;
  };

  // Generate polyline points for continuous indicators
  const buildPolyline = (getter: (c: ProcessedCandle) => number | undefined) => {
    const points: string[] = [];
    for (let i = 0; i < visibleData.length; i++) {
      const val = getter(visibleData[i]);
      if (val !== undefined && !isNaN(val)) {
        points.push(`${getX(i).toFixed(1)},${getYPrice(val).toFixed(1)}`);
      }
    }
    return points.join(' ');
  };

  // Bollinger filled band path
  const bollingerBandPath = useMemo(() => {
    if (!showBollinger || visibleData.length === 0) return '';
    const upperPoints: { x: number; y: number }[] = [];
    const lowerPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < visibleData.length; i++) {
      const c = visibleData[i];
      if (c.bb_superior !== undefined && c.bb_inferior !== undefined) {
        upperPoints.push({ x: getX(i), y: getYPrice(c.bb_superior) });
        lowerPoints.push({ x: getX(i), y: getYPrice(c.bb_inferior) });
      }
    }

    if (upperPoints.length === 0) return '';

    let d = `M ${upperPoints[0].x} ${upperPoints[0].y}`;
    for (let i = 1; i < upperPoints.length; i++) {
      d += ` L ${upperPoints[i].x} ${upperPoints[i].y}`;
    }
    for (let i = lowerPoints.length - 1; i >= 0; i--) {
      d += ` L ${lowerPoints[i].x} ${lowerPoints[i].y}`;
    }
    d += ' Z';
    return d;
  }, [visibleData, showBollinger, minPrice, maxPrice]);

  // Hover handlers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    const relX = svgX - leftMargin;
    const idx = Math.floor(relX / step);
    if (idx >= 0 && idx < n) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 0 || n === 0) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = touch.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    const relX = svgX - leftMargin;
    const idx = Math.floor(relX / step);
    if (idx >= 0 && idx < n) {
      setHoverIndex(idx);
    }
  };

  const activeCandle = hoverIndex !== null ? visibleData[hoverIndex] : visibleData[visibleData.length - 1];

  // Price grid lines
  const priceGridValues = useMemo(() => {
    const count = 5;
    const arr = [];
    for (let i = 0; i <= count; i++) {
      arr.push(minPrice + ((maxPrice - minPrice) * i) / count);
    }
    return arr;
  }, [minPrice, maxPrice]);

  return (
    <div className="w-full bg-[#101914] rounded-2xl border border-[#22332B] p-3 md:p-5 flex flex-col gap-3 shadow-xl">
      {/* Chart Top Bar: Controls & Current Value HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E25] pb-3 text-xs">
        {/* Active Candle Metrics HUD */}
        {activeCandle && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-300 font-mono text-xs">
            <span className="text-[#00E6A0] font-semibold">
              {activeCandle.date}
            </span>
            <span>A: <strong className="text-white">{activeCandle.open.toFixed(2)}</strong></span>
            <span>MÁX: <strong className="text-white">{activeCandle.high.toFixed(2)}</strong></span>
            <span>MÍN: <strong className="text-white">{activeCandle.low.toFixed(2)}</strong></span>
            <span>F: <strong className={activeCandle.close >= activeCandle.open ? 'text-[#00E6A0]' : 'text-[#FF5A5A]'}>{activeCandle.close.toFixed(2)}</strong></span>
            <span>VOL: <strong className="text-zinc-200">{(activeCandle.volume / 1000).toFixed(0)}k</strong></span>
            {activeCandle.RSI && <span>RSI: <strong className="text-[#B388FF]">{activeCandle.RSI.toFixed(1)}</strong></span>}
            {activeCandle.ATR && <span>ATR: <strong className="text-[#FFC24B]">{activeCandle.ATR.toFixed(2)}</strong></span>}
          </div>
        )}

        {/* Zoom Window Selector */}
        <div className="flex items-center gap-1 bg-[#0A100D] p-1 rounded-xl border border-[#22332B] ml-auto">
          <span className="text-[10px] text-zinc-400 font-medium px-2">Zoom:</span>
          {[
            { label: '30b', count: 30 },
            { label: '60b', count: 60 },
            { label: '120b', count: 120 },
            { label: 'Tudo', count: 0 },
          ].map((z) => (
            <button
              key={z.label}
              onClick={() => setViewCount(z.count)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewCount === z.count
                  ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Financial Canvas */}
      <div ref={containerRef} className="w-full overflow-hidden select-none touch-pan-y">
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto block"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="volBullGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E6A0" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00E6A0" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="volBearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5A5A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF5A5A" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Background grid lines for Price */}
          {priceGridValues.map((p, idx) => {
            const y = getYPrice(p);
            return (
              <g key={idx}>
                <line
                  x1={leftMargin}
                  y1={y}
                  x2={width - rightMargin}
                  y2={y}
                  stroke="#1B2822"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - rightMargin + 8}
                  y={y + 4}
                  fill="#758A80"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Support and Resistance Lines */}
          {showLevels && levels && (
            <>
              {levels.resistencias.map((res, i) => (
                <g key={`res-${i}`}>
                  <line
                    x1={leftMargin}
                    y1={getYPrice(res)}
                    x2={width - rightMargin}
                    y2={getYPrice(res)}
                    stroke="#FF5A5A"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.75"
                  />
                  <text
                    x={leftMargin + 4}
                    y={getYPrice(res) - 4}
                    fill="#FF5A5A"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    R {res.toFixed(2)}
                  </text>
                </g>
              ))}
              {levels.suportes.map((sup, i) => (
                <g key={`sup-${i}`}>
                  <line
                    x1={leftMargin}
                    y1={getYPrice(sup)}
                    x2={width - rightMargin}
                    y2={getYPrice(sup)}
                    stroke="#00E6A0"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.75"
                  />
                  <text
                    x={leftMargin + 4}
                    y={getYPrice(sup) - 4}
                    fill="#00E6A0"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    S {sup.toFixed(2)}
                  </text>
                </g>
              ))}
            </>
          )}

          {/* Stop and Target Lines */}
          {activeStopTarget && (
            <>
              {/* Target */}
              <line
                x1={leftMargin}
                y1={getYPrice(activeStopTarget.alvo)}
                x2={width - rightMargin}
                y2={getYPrice(activeStopTarget.alvo)}
                stroke="#00E6A0"
                strokeWidth="1.6"
                strokeDasharray="2 2"
              />
              <text
                x={width - rightMargin - 45}
                y={getYPrice(activeStopTarget.alvo) - 4}
                fill="#00E6A0"
                fontSize="10"
                fontWeight="bold"
              >
                ALVO {activeStopTarget.alvo.toFixed(2)}
              </text>

              {/* Stop */}
              <line
                x1={leftMargin}
                y1={getYPrice(activeStopTarget.stop)}
                x2={width - rightMargin}
                y2={getYPrice(activeStopTarget.stop)}
                stroke="#FF5A5A"
                strokeWidth="1.6"
                strokeDasharray="2 2"
              />
              <text
                x={width - rightMargin - 45}
                y={getYPrice(activeStopTarget.stop) - 4}
                fill="#FF5A5A"
                fontSize="10"
                fontWeight="bold"
              >
                STOP {activeStopTarget.stop.toFixed(2)}
              </text>
            </>
          )}

          {/* Bollinger Bands Shaded Area & Lines */}
          {showBollinger && bollingerBandPath && (
            <>
              <path d={bollingerBandPath} fill="rgba(120,120,120,0.08)" />
              <polyline
                points={buildPolyline((c) => c.bb_superior)}
                fill="none"
                stroke="rgba(140, 160, 150, 0.5)"
                strokeWidth="1"
              />
              <polyline
                points={buildPolyline((c) => c.bb_inferior)}
                fill="none"
                stroke="rgba(140, 160, 150, 0.5)"
                strokeWidth="1"
              />
            </>
          )}

          {/* Candlesticks (Wicks + Bodies) */}
          {visibleData.map((c, i) => {
            const x = getX(i);
            const isBullish = c.close >= c.open;
            const color = isBullish ? '#00E6A0' : '#FF5A5A';

            const yHigh = getYPrice(c.high);
            const yLow = getYPrice(c.low);
            const yOpen = getYPrice(c.open);
            const yClose = getYPrice(c.close);

            const topY = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={topY}
                  width={candleWidth}
                  height={bodyHeight}
                  rx="1.5"
                  fill={color}
                />
              </g>
            );
          })}

          {/* Moving Average Overlays */}
          {showAverages && (
            <>
              <polyline
                points={buildPolyline((c) => c.EMA9)}
                fill="none"
                stroke="#FB8C00"
                strokeWidth="1.4"
              />
              <polyline
                points={buildPolyline((c) => c.SMA20)}
                fill="none"
                stroke="#1E88E5"
                strokeWidth="1.4"
              />
              <polyline
                points={buildPolyline((c) => c.SMA50)}
                fill="none"
                stroke="#8E24AA"
                strokeWidth="1.4"
              />
              <polyline
                points={buildPolyline((c) => c.SMA200)}
                fill="none"
                stroke="#546E7A"
                strokeWidth="1.4"
              />
            </>
          )}

          {/* Subplot 1: Volume Section */}
          <g>
            <text
              x={leftMargin}
              y={priceHeight + gap + 14}
              fill="#758A80"
              fontSize="10"
              fontWeight="bold"
            >
              VOLUME
            </text>
            <line
              x1={leftMargin}
              y1={priceHeight + gap}
              x2={width - rightMargin}
              y2={priceHeight + gap}
              stroke="#1F3027"
              strokeWidth="1"
            />
            {visibleData.map((c, i) => {
              const x = getX(i);
              const isBullish = c.close >= c.open;
              const yVol = getYVolume(c.volume);
              const height = priceHeight + gap + volumeHeight - yVol;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - candleWidth / 2}
                  y={yVol}
                  width={candleWidth}
                  height={Math.max(1, height)}
                  fill={isBullish ? 'url(#volBullGrad)' : 'url(#volBearGrad)'}
                  opacity="0.85"
                />
              );
            })}
          </g>

          {/* Subplot 2: RSI Section */}
          {showRSI && (
            <g>
              <line
                x1={leftMargin}
                y1={rsiStartY}
                x2={width - rightMargin}
                y2={rsiStartY}
                stroke="#1F3027"
                strokeWidth="1"
              />
              <text
                x={leftMargin}
                y={rsiStartY + 14}
                fill="#B388FF"
                fontSize="10"
                fontWeight="bold"
              >
                RSI (14)
              </text>

              {/* 70 / 30 reference levels */}
              <line
                x1={leftMargin}
                y1={getYRSI(70)}
                x2={width - rightMargin}
                y2={getYRSI(70)}
                stroke="#FF5A5A"
                strokeDasharray="3 3"
                strokeWidth="0.8"
                opacity="0.6"
              />
              <text
                x={width - rightMargin + 6}
                y={getYRSI(70) + 3}
                fill="#FF5A5A"
                fontSize="9"
              >
                70
              </text>

              <line
                x1={leftMargin}
                y1={getYRSI(30)}
                x2={width - rightMargin}
                y2={getYRSI(30)}
                stroke="#00E6A0"
                strokeDasharray="3 3"
                strokeWidth="0.8"
                opacity="0.6"
              />
              <text
                x={width - rightMargin + 6}
                y={getYRSI(30) + 3}
                fill="#00E6A0"
                fontSize="9"
              >
                30
              </text>

              {/* RSI Curve */}
              {(() => {
                const points: string[] = [];
                for (let i = 0; i < visibleData.length; i++) {
                  const rsi = visibleData[i].RSI;
                  if (rsi !== undefined) {
                    points.push(`${getX(i)},${getYRSI(rsi)}`);
                  }
                }
                return (
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="#B388FF"
                    strokeWidth="1.6"
                  />
                );
              })()}
            </g>
          )}

          {/* Subplot 3: MACD Section */}
          {showMACD && (
            <g>
              <line
                x1={leftMargin}
                y1={macdStartY}
                x2={width - rightMargin}
                y2={macdStartY}
                stroke="#1F3027"
                strokeWidth="1"
              />
              <text
                x={leftMargin}
                y={macdStartY + 14}
                fill="#1E88E5"
                fontSize="10"
                fontWeight="bold"
              >
                MACD (12, 26, 9)
              </text>
              <line
                x1={leftMargin}
                y1={getYMacd(0)}
                x2={width - rightMargin}
                y2={getYMacd(0)}
                stroke="#334B3D"
                strokeWidth="1"
              />

              {/* Histogram bars */}
              {visibleData.map((c, i) => {
                if (c.macd_hist === undefined) return null;
                const x = getX(i);
                const zeroY = getYMacd(0);
                const valY = getYMacd(c.macd_hist);
                const isPositive = c.macd_hist >= 0;
                const h = Math.abs(zeroY - valY);
                return (
                  <rect
                    key={`hist-${i}`}
                    x={x - candleWidth / 2}
                    y={isPositive ? valY : zeroY}
                    width={candleWidth}
                    height={Math.max(1, h)}
                    fill={isPositive ? '#00E6A0' : '#FF5A5A'}
                    opacity="0.65"
                  />
                );
              })}

              {/* MACD Line */}
              {(() => {
                const points: string[] = [];
                for (let i = 0; i < visibleData.length; i++) {
                  const val = visibleData[i].macd;
                  if (val !== undefined) {
                    points.push(`${getX(i)},${getYMacd(val)}`);
                  }
                }
                return (
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="#1E88E5"
                    strokeWidth="1.4"
                  />
                );
              })()}

              {/* Signal Line */}
              {(() => {
                const points: string[] = [];
                for (let i = 0; i < visibleData.length; i++) {
                  const val = visibleData[i].macd_sinal;
                  if (val !== undefined) {
                    points.push(`${getX(i)},${getYMacd(val)}`);
                  }
                }
                return (
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="#FB8C00"
                    strokeWidth="1.4"
                  />
                );
              })()}
            </g>
          )}

          {/* Hover Crosshair & Date labels */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n && (
            <g>
              {/* Vertical crosshair */}
              <line
                x1={getX(hoverIndex)}
                y1={10}
                x2={getX(hoverIndex)}
                y2={totalHeight - 30}
                stroke="#00E6A0"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              {/* Date tag at bottom */}
              <rect
                x={getX(hoverIndex) - 38}
                y={totalHeight - 24}
                width="76"
                height="20"
                rx="4"
                fill="#14201A"
                stroke="#00E6A0"
                strokeWidth="1"
              />
              <text
                x={getX(hoverIndex)}
                y={totalHeight - 10}
                textAnchor="middle"
                fill="#EAF3EE"
                fontSize="10"
                fontFamily="monospace"
              >
                {visibleData[hoverIndex].date}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend Indicator Footnotes */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400 border-t border-[#1E2E25] pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {showAverages && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#FB8C00] inline-block" /> EMA9
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#1E88E5] inline-block" /> SMA20
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#8E24AA] inline-block" /> SMA50
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#546E7A] inline-block" /> SMA200
              </span>
            </>
          )}
          {showBollinger && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 bg-zinc-500/20 border border-zinc-500/60 inline-block" /> Bandas Bollinger
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500">
          *Passe o mouse ou toque para inspecionar cada barra.
        </span>
      </div>
    </div>
  );
};
