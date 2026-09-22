import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Info,
  SlidersHorizontal,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react';
import { CandlestickChart } from './CandlestickChart';
import { OpportunityItem, ProcessedCandle, SupportResistanceLevels, StopTarget } from '../types';
import { processAllIndicators, calculateSupportResistance } from '../indicators';

interface Props {
  opportunity: OpportunityItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
  onOpenFullAnalysis: (ticker: string, market: 'B3' | 'EUA') => void;
}

export const OpportunityDetailModal: React.FC<Props> = ({
  opportunity,
  isOpen,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
  onOpenFullAnalysis,
}) => {
  const [candles, setCandles] = useState<ProcessedCandle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'3mo' | '6mo' | '1y'>('6mo');
  const [showAverages, setShowAverages] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch candle data for the selected opportunity
  const fetchOpportunityCandles = useCallback(async () => {
    if (!opportunity) return;
    setLoading(true);
    setError(null);

    try {
      const queryTicker = opportunity.fullTicker || opportunity.ticker;
      const res = await fetch(
        `/api/market/history?ticker=${encodeURIComponent(queryTicker)}&period=${period}&interval=1d`
      );

      if (!res.ok) {
        throw new Error(`Não foi possível carregar os dados de ${opportunity.ticker}`);
      }

      const json = await res.json();
      const rawCandles = json.candles || [];
      const processed = processAllIndicators(rawCandles);
      setCandles(processed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar gráfico.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [opportunity, period]);

  useEffect(() => {
    if (isOpen && opportunity) {
      fetchOpportunityCandles();
    }
  }, [isOpen, opportunity, fetchOpportunityCandles]);

  // Keyboard navigation (Escape to close, Left/Right arrows to navigate)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !opportunity) return null;

  // Build stop target and levels for CandlestickChart
  const stopTarget: StopTarget = {
    entrada: opportunity.entrada,
    stop: opportunity.stopLoss,
    alvo: opportunity.alvoLucro,
    atr: opportunity.atr,
    risco: Math.abs(opportunity.entrada - opportunity.stopLoss),
    retorno: Math.abs(opportunity.alvoLucro - opportunity.entrada),
  };

  const levels: SupportResistanceLevels = candles.length > 0
    ? calculateSupportResistance(candles)
    : { suportes: [opportunity.stopLoss], resistencias: [opportunity.alvoLucro], preco: opportunity.preco };

  const isBuy = opportunity.sinal === 'COMPRA FORTE' || opportunity.sinal === 'COMPRA';
  const isStrongBuy = opportunity.sinal === 'COMPRA FORTE';
  const isSell = opportunity.sinal === 'VENDA';

  const stopLossPct = opportunity.preco > 0
    ? ((opportunity.stopLoss - opportunity.preco) / opportunity.preco) * 100
    : 0;

  const alvoLucroPct = opportunity.preco > 0
    ? ((opportunity.alvoLucro - opportunity.preco) / opportunity.preco) * 100
    : 0;

  const handleCopyPlan = () => {
    const text = `🎯 PLANO DE TRADE SWING TRADE - ${opportunity.ticker}
Setup: ${opportunity.setup}
Sinal: ${opportunity.sinal} (Score ${opportunity.score}%)
Entrada: R$ ${opportunity.entrada.toFixed(2)}
Stop Loss: R$ ${opportunity.stopLoss.toFixed(2)} (${stopLossPct.toFixed(1)}%)
Alvo de Ganho: R$ ${opportunity.alvoLucro.toFixed(2)} (+${alvoLucroPct.toFixed(1)}%)
Relação Risco:Retorno: 1:1.5
IFR2: ${opportunity.ifr2} | RSI14: ${opportunity.rsi14} | ATR: R$ ${opportunity.atr.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenFull = () => {
    const market = opportunity.categoria === 'B3' ? 'B3' : 'EUA';
    onOpenFullAnalysis(opportunity.ticker, market);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0B1410] border border-[#1F3A2B] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E3326] bg-[#0E1A14] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Asset Info & Badges */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 flex items-center justify-center text-[#00E6A0] font-black text-sm">
              {opportunity.ticker.slice(0, 4)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {opportunity.ticker}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#16291F] text-zinc-300 border border-[#274434]">
                  {opportunity.categoria}
                </span>
                {opportunity.isRealData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse" />
                    Feed Real
                  </span>
                )}
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isStrongBuy
                      ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm shadow-[#00E6A0]/30'
                      : isBuy
                      ? 'bg-[#00E6A0]/20 text-[#00E6A0] border border-[#00E6A0]/40'
                      : isSell
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {opportunity.sinal}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#1A3124] text-[#00E6A0] border border-[#2E553F]">
                  Confluência: {opportunity.score}%
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{opportunity.nome}</p>
            </div>
          </div>

          {/* Price, Navigation Controls & Close */}
          <div className="flex items-center gap-3">
            {/* Price tag */}
            <div className="text-right pr-2 border-r border-[#1E3326] hidden sm:block">
              <p className="text-base font-black text-white">
                R$ {opportunity.preco.toFixed(2)}
              </p>
              <p
                className={`text-xs font-bold flex items-center justify-end ${
                  opportunity.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-red-400'
                }`}
              >
                {opportunity.var_pct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {opportunity.var_pct >= 0 ? '+' : ''}
                {opportunity.var_pct}%
              </p>
            </div>

            {/* Pagination between opportunities */}
            {(onPrev || onNext) && (
              <div className="flex items-center gap-1 bg-[#14221A] p-1 rounded-xl border border-[#20362A]">
                <button
                  onClick={onPrev}
                  disabled={!onPrev}
                  title="Oportunidade Anterior (Seta Esquerda)"
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#1E3327] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {currentIndex !== undefined && totalCount !== undefined && (
                  <span className="text-[10px] font-bold text-zinc-400 px-2 select-none">
                    {currentIndex + 1} / {totalCount}
                  </span>
                )}
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  title="Próxima Oportunidade (Seta Direita)"
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#1E3327] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#14221A] hover:bg-[#1E3327] text-zinc-400 hover:text-white border border-[#20362A] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Grid: Chart on Left, Trade Plan on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Interactive Candlestick Chart Area (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-3">
              {/* Chart Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0E1712] border border-[#1C2F24]">
                {/* Period Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00E6A0]" />
                    Período:
                  </span>
                  {(['3mo', '6mo', '1y'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        period === p
                          ? 'bg-[#00E6A0] text-[#0A100D]'
                          : 'text-zinc-400 hover:text-white bg-[#14201A]'
                      }`}
                    >
                      {p === '3mo' ? '3 Meses' : p === '6mo' ? '6 Meses' : '1 Ano'}
                    </button>
                  ))}
                </div>

                {/* Overlays Toggle Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setShowAverages(!showAverages)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      showAverages
                        ? 'bg-[#1D3528] text-[#00E6A0] border border-[#00E6A0]/40'
                        : 'bg-[#14201A] text-zinc-400 border border-transparent'
                    }`}
                  >
                    Médias (9/21/50/200)
                  </button>
                  <button
                    onClick={() => setShowBollinger(!showBollinger)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      showBollinger
                        ? 'bg-[#1D3528] text-[#00E6A0] border border-[#00E6A0]/40'
                        : 'bg-[#14201A] text-zinc-400 border border-transparent'
                    }`}
                  >
                    Bollinger
                  </button>
                  <button
                    onClick={() => setShowRSI(!showRSI)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      showRSI
                        ? 'bg-[#1D3528] text-[#00E6A0] border border-[#00E6A0]/40'
                        : 'bg-[#14201A] text-zinc-400 border border-transparent'
                    }`}
                  >
                    IFR / RSI
                  </button>
                </div>
              </div>

              {/* Chart Render Container */}
              <div className="bg-[#0A110D] border border-[#1E3326] rounded-2xl p-3 sm:p-4 shadow-xl relative min-h-[380px] flex flex-col justify-center">
                {loading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 border-3 border-[#00E6A0] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-bold text-white">Carregando dados diários de {opportunity.ticker}...</p>
                    <p className="text-xs text-zinc-500 mt-1">Calculando médias e confluências de preço</p>
                  </div>
                ) : error ? (
                  <div className="py-20 text-center text-red-400 space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto opacity-70" />
                    <p className="text-sm font-semibold">{error}</p>
                    <button
                      onClick={fetchOpportunityCandles}
                      className="px-3 py-1.5 rounded-lg bg-[#14221A] text-white text-xs font-bold hover:bg-[#1E3327] transition"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : candles.length > 0 ? (
                  <>
                    <CandlestickChart
                      candles={candles}
                      showAverages={showAverages}
                      showBollinger={showBollinger}
                      showRSI={showRSI}
                      showMACD={false}
                      showLevels={showLevels}
                      levels={levels}
                      stopTarget={stopTarget}
                    />

                    {/* Chart Legend for Target & Stop */}
                    <div className="mt-2 pt-2 border-t border-[#18281F] flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 font-semibold text-[#00E6A0]">
                          <span className="w-3 h-0.5 bg-[#00E6A0] border-t border-dashed" />
                          Linha Alvo de Ganho (R$ {opportunity.alvoLucro.toFixed(2)})
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-red-400">
                          <span className="w-3 h-0.5 bg-red-400 border-t border-dashed" />
                          Linha Stop Loss Técnico (R$ {opportunity.stopLoss.toFixed(2)})
                        </span>
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/50" />
                          Média SMA 200: R$ {opportunity.sma200.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {candles.length} pregões diários carregados
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-zinc-400">
                    <p>Sem candles disponíveis para o período selecionado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Detailed Trade Plan & Setups (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Setup Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#101E17] to-[#0D1812] border border-[#1E3A2B] shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E6A0] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E6A0]" />
                    Setup Identificado
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
                    Score {opportunity.score}%
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {opportunity.setup}
                </h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  {opportunity.detalhes}
                </p>
              </div>

              {/* Trade Parameters (Entrada, Stop, Alvo, R:R) */}
              <div className="p-4 rounded-xl bg-[#0D1712] border border-[#1B2F23] space-y-3 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#00E6A0]" />
                  Plano Operacional (Gestão de Risco)
                </h4>

                <div className="space-y-2.5 text-xs">
                  {/* Entrada */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#122018] border border-[#1F3628]">
                    <span className="text-zinc-400 font-medium">Preço de Entrada:</span>
                    <span className="font-extrabold text-white text-sm">
                      R$ {opportunity.entrada.toFixed(2)}
                    </span>
                  </div>

                  {/* Stop Loss */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1516] border border-red-900/40">
                    <div>
                      <span className="text-red-400 font-medium block">Stop Loss Técnico:</span>
                      <span className="text-[10px] text-zinc-400">2x ATR abaixo da média</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-red-400 text-sm">
                        R$ {opportunity.stopLoss.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-semibold text-red-400/80 block">
                        {stopLossPct >= 0 ? '+' : ''}{stopLossPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Alvo Lucro */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#102319] border border-[#00E6A0]/30">
                    <div>
                      <span className="text-[#00E6A0] font-medium block">Alvo de Ganho (Take Profit):</span>
                      <span className="text-[10px] text-zinc-400">3x ATR (Projeção Simétrica)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#00E6A0] text-sm">
                        R$ {opportunity.alvoLucro.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-semibold text-[#00E6A0]/80 block">
                        +{alvoLucroPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Relação R/R */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#122018] border border-[#1F3628] text-[11px]">
                    <span className="text-zinc-400">Relação Risco x Retorno:</span>
                    <span className="font-bold text-[#00E6A0]">1 : {opportunity.rr || 1.5}</span>
                  </div>
                </div>
              </div>

              {/* Technical Indicator Snapshots & Guia Pillars */}
              <div className="p-4 rounded-xl bg-[#0D1712] border border-[#1B2F23] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#00E6A0]" />
                    Pilares Técnicos (Metodologia Guia)
                  </h4>
                  {opportunity.classe && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#16271E] text-zinc-300 border border-[#274032]">
                      {opportunity.classe} • {opportunity.setor || 'B3'}
                    </span>
                  )}
                </div>

                {/* Pillar 1: Índice de Sobrevenda (IS) */}
                <div className="p-2.5 rounded-lg bg-[#122018] border border-[#1F3628]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00E6A0]" />
                        Índice de Sobrevenda (IS)
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Média harmônica combinada RSI(14) + Estocástico(14)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${
                        (opportunity.indiceSobrevenda ?? 50) >= 70
                          ? 'text-[#00E6A0]'
                          : (opportunity.indiceSobrevenda ?? 50) <= 30
                          ? 'text-red-400'
                          : 'text-amber-300'
                      }`}>
                        {opportunity.indiceSobrevenda ?? 50} / 100
                      </span>
                    </div>
                  </div>
                  {/* Gauge Bar */}
                  <div className="mt-2 w-full bg-[#0A120E] h-2 rounded-full overflow-hidden border border-[#1D3226]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (opportunity.indiceSobrevenda ?? 50) >= 70
                          ? 'bg-gradient-to-r from-emerald-500 to-[#00E6A0]'
                          : (opportunity.indiceSobrevenda ?? 50) <= 30
                          ? 'bg-gradient-to-r from-red-500 to-amber-500'
                          : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, opportunity.indiceSobrevenda ?? 50))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Sobrecompra (0)</span>
                    <span className="text-zinc-400">Neutro (50)</span>
                    <span className="text-[#00E6A0] font-bold">&gt; 70 Exaustão Vendedora</span>
                  </div>
                </div>

                {/* Pillar 2: RSI & Estocástico Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#122018] border border-[#1F3628]">
                    <span className="text-[10px] text-zinc-400 block">IFR (2 períodos)</span>
                    <span className="font-extrabold text-white text-sm">{opportunity.ifr2}</span>
                    <span className="text-[9px] text-[#00E6A0] block mt-0.5">
                      {opportunity.ifr2 <= 20 ? '🔥 Sobrevenda Larry Connors' : 'Momento Estável'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#122018] border border-[#1F3628]">
                    <span className="text-[10px] text-zinc-400 block">Estocástico %K / %D</span>
                    <span className="font-extrabold text-white text-sm">
                      {opportunity.stochK ?? 50}% <span className="text-zinc-400 font-normal text-xs">/ {opportunity.stochD ?? 50}%</span>
                    </span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      {(opportunity.stochK ?? 50) <= 20 ? 'Sobrevenda Extrema (<20)' : 'Oscilador Neutro'}
                    </span>
                  </div>
                </div>

                {/* Pillar 3: Fibonacci 61.8% Golden Zone */}
                <div className={`p-2.5 rounded-lg border text-xs ${
                  opportunity.isGoldenZone
                    ? 'bg-[#182618] border-[#00E6A0]/50 text-white'
                    : 'bg-[#122018] border-[#1F3628] text-zinc-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[11px] text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Fibonacci 61.8% (Golden Zone)
                    </span>
                    {opportunity.fib618 && (
                      <span className="font-bold text-white text-[11px]">
                        Nível: R$ {opportunity.fib618.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    {opportunity.isGoldenZone
                      ? 'Preço atual em teste exato da Golden Zone de 61.8%, considerado o suporte matemático mais forte da tendência.'
                      : `Região de retração matemática calculada em R$ ${(opportunity.fib618 ?? opportunity.preco * 0.95).toFixed(2)}.`}
                  </p>
                </div>

                {/* Pillar 4: Triple Screen (Alexander Elder) */}
                {opportunity.tripleScreen && (
                  <div className="p-2.5 rounded-lg bg-[#122018] border border-[#1F3628] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-purple-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Triple Screen (Alexander Elder)
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-900/30 text-purple-200 border border-purple-500/30">
                        {opportunity.tripleScreen.status.includes('COMPRA') ? 'Gatilho de Compra' : 'Em Análise'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-300 space-y-0.5 pt-1">
                      <p className="flex items-center gap-1">
                        <span className="text-zinc-500">1ª Tela:</span> {opportunity.tripleScreen.tela1}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-zinc-500">2ª Tela:</span> {opportunity.tripleScreen.tela2}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-zinc-500">3ª Tela:</span> {opportunity.tripleScreen.tela3}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleOpenFull}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] text-[#0A100D] font-extrabold text-xs tracking-wide hover:brightness-110 active:scale-98 transition shadow-lg shadow-[#00E6A0]/20 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Análise Técnica Completa
                </button>

                <button
                  onClick={handleCopyPlan}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#14221A] hover:bg-[#1A2E23] text-zinc-200 border border-[#21382A] font-bold text-xs transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00E6A0]" />
                      <span className="text-[#00E6A0]">Parâmetros do Trade Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copiar Parâmetros do Trade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
