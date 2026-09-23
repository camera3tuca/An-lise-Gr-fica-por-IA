import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { CandlestickChart } from './components/CandlestickChart';
import { SmartInsights } from './components/SmartInsights';
import { SignalsTable } from './components/SignalsTable';
import { RiskManagement } from './components/RiskManagement';
import { PatternsAndLevels } from './components/PatternsAndLevels';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { AiAnalysisSection } from './components/AiAnalysisSection';
import { ChartUploadView } from './components/ChartUploadView';
import { OpportunitiesScannerView } from './components/OpportunitiesScannerView';
import { MarketHistoryResponse } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  processAllIndicators,
  generateSwingSignals,
  calculateStopTarget,
  calculateSmartInsights,
  calculateSupportResistance,
  detectPatterns,
} from './indicators';
import { AlertCircle, RefreshCw, Calendar, Clock, SlidersHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View state — home is the B3 opportunities list
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');

  // Market & Ticker state
  const [marketType, setMarketType] = useState<'B3' | 'EUA'>('B3');
  const [ticker, setTicker] = useState('PETR4');
  const [period, setPeriod] = useState('1y');
  const [interval, setInterval] = useState('1d');

  // Chart Indicators State
  const [showAverages, setShowAverages] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [showLevels, setShowLevels] = useState(true);

  // AI Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Inline AI Analysis (centerpiece per asset)
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLanguage] = useState('Português');

  // Auto Refresh State
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshIntervalSec] = useState(30);

  // Data & Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketHistoryResponse | null>(null);

  const isOnline = useOnlineStatus();

  // Fetch Market Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If B3, append .SA if not already present
      let queryTicker = ticker.trim().toUpperCase();
      if (marketType === 'B3' && !queryTicker.endsWith('.SA')) {
        queryTicker = `${queryTicker}.SA`;
      }

      const res = await fetch(
        `/api/market/history?ticker=${encodeURIComponent(queryTicker)}&period=${period}&interval=${interval}`
      );

      if (!res.ok) {
        throw new Error(`Não foi possível carregar dados de ${queryTicker}`);
      }

      const json = await res.json();
      const rawCandles = json.candles || [];

      // Calculate indicators on the client side to guarantee fresh, responsive recalculations
      const processedCandles = processAllIndicators(rawCandles);
      const { signals, bias, buyCount, sellCount } = generateSwingSignals(processedCandles);
      const stopTarget = calculateStopTarget(processedCandles, bias);
      const insights = calculateSmartInsights(processedCandles);
      const levels = calculateSupportResistance(processedCandles);
      const patterns = detectPatterns(processedCandles);

      const lastCandle = processedCandles[processedCandles.length - 1];
      const prevCandle = processedCandles[processedCandles.length - 2];
      const currentPrice = lastCandle ? lastCandle.close : 0;
      const changePct =
        lastCandle && prevCandle && prevCandle.close > 0
          ? ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100
          : 0;

      setMarketData({
        ticker: queryTicker.replace('.SA', ''),
        isDemo: !!json.isDemo,
        candles: processedCandles,
        currentPrice,
        changePct,
        lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        signals,
        bias,
        buyCount,
        sellCount,
        stopTarget,
        insights,
        levels,
        patterns,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar cotações.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [ticker, marketType, period, interval]);

  // Initial fetch and on dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto Refresh Interval
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = window.setInterval(() => {
      fetchData();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshIntervalSec, fetchData]);

  const handleTickerChange = (newTicker: string, newMarket: 'B3' | 'EUA') => {
    setMarketType(newMarket);
    setTicker(newTicker);
  };

  // Keep a ref to the freshest market data so the AI runner avoids stale closures.
  const marketDataRef = useRef(marketData);
  marketDataRef.current = marketData;

  // Generate the inline AI reading for the currently loaded asset.
  const runAiAnalysis = useCallback(async () => {
    const md = marketDataRef.current;
    if (!md) return;
    setAiLoading(true);
    try {
      const last = md.candles[md.candles.length - 1];
      const payload = {
        ticker: md.ticker,
        language: aiLanguage,
        currentPrice: last?.close,
        rsi: last?.RSI,
        atr: last?.ATR,
        sma200: last?.SMA200,
        sma20: last?.SMA20,
        signals: md.signals.map((s) => `${s.nome}: ${s.sinal} (${s.detalhe})`),
        stop: md.stopTarget?.stop,
        alvo: md.stopTarget?.alvo,
      };
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao gerar análise por IA.');
      const data = await res.json();
      setAiText(data.analysis || data.text || null);
    } catch {
      setAiText(null);
    } finally {
      setAiLoading(false);
    }
  }, [aiLanguage]);

  // Auto-generate the AI reading whenever the asset or timeframe changes
  // (not on auto-refresh or indicator toggles), keeping the IA reading as the
  // centerpiece for whichever asset is open.
  useEffect(() => {
    setAiText(null);
    if (marketData?.ticker) {
      runAiAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketData?.ticker, period, interval]);

  return (
    <div className="min-h-screen bg-[#0A100D] text-[#EAF3EE] flex flex-col pb-16 lg:pb-0">
      {/* Top Header */}
      <Header
        currentTicker={ticker}
        marketType={marketType}
        onTickerChange={handleTickerChange}
        onRefresh={fetchData}
        isLoading={loading}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={setAutoRefreshEnabled}
        lastUpdated={marketData?.lastUpdated || '--:--:--'}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAverages={showAverages}
          setShowAverages={setShowAverages}
          showBollinger={showBollinger}
          setShowBollinger={setShowBollinger}
          showRSI={showRSI}
          setShowRSI={setShowRSI}
          showMACD={showMACD}
          setShowMACD={setShowMACD}
          showLevels={showLevels}
          setShowLevels={setShowLevels}
          onOpenAIModal={() => setIsAIModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 md:p-6 overflow-x-hidden space-y-4">
          {/* Offline Banner */}
          {!isOnline && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
              <span>Modo Offline ativado. Exibindo dados locais pré-carregados.</span>
              <span className="font-bold">PWA Cache</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* TAB 1: Main Analysis */}
          {activeTab === 'analysis' && marketData && (
            <div className="space-y-4">
              {/* Asset Headline Bar */}
              <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                        {marketData.ticker}
                      </h1>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#14201A] border border-[#22332B] text-zinc-400">
                        {marketType === 'B3' ? 'B3 / BRL' : 'NYSE/NASDAQ'}
                      </span>
                      {!marketData.isDemo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse" />
                          Dados Reais B3 / Global
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Demo Feed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Última atualização: {marketData.lastUpdated}
                    </p>
                  </div>

                  <div className="border-l border-[#1E2E25] pl-4">
                    <div className="text-xl md:text-2xl font-black font-mono text-white">
                      {marketData.currentPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: marketType === 'B3' ? 'BRL' : 'USD',
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono font-bold">
                      {marketData.changePct >= 0 ? (
                        <span className="flex items-center text-[#00E6A0]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{marketData.changePct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="flex items-center text-[#FF5A5A]">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {marketData.changePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeframe & Period Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Period */}
                  <div className="flex bg-[#0A100D] p-1 rounded-xl border border-[#22332B] text-xs font-semibold">
                    {[
                      { label: '6 Meses', val: '6mo' },
                      { label: '1 Ano', val: '1y' },
                      { label: '2 Anos', val: '2y' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        onClick={() => setPeriod(p.val)}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          period === p.val
                            ? 'bg-[#00E6A0] text-[#0A100D] font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Interval */}
                  <div className="flex bg-[#0A100D] p-1 rounded-xl border border-[#22332B] text-xs font-semibold">
                    {[
                      { label: 'Diário (1D)', val: '1d' },
                      { label: 'Semanal (1S)', val: '1wk' },
                    ].map((it) => (
                      <button
                        key={it.val}
                        onClick={() => setInterval(it.val)}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          interval === it.val
                            ? 'bg-[#00E6A0] text-[#0A100D] font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {it.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Smart Insights metric cards */}
              <SmartInsights insights={marketData.insights} />

              {/* Candlestick Chart */}
              <CandlestickChart
                data={marketData.candles}
                showAverages={showAverages}
                showBollinger={showBollinger}
                showRSI={showRSI}
                showMACD={showMACD}
                showLevels={showLevels}
                levels={marketData.levels}
                stopTarget={marketData.stopTarget}
              />

              {/* AI graphical reading — centerpiece for the open asset */}
              <AiAnalysisSection
                ticker={marketData.ticker}
                aiText={aiText}
                isLoading={aiLoading}
                onGenerate={runAiAnalysis}
                language={aiLanguage}
              />

              {/* Signals & Risk Management */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7">
                  <SignalsTable
                    signals={marketData.signals}
                    bias={marketData.bias}
                    buyCount={marketData.buyCount}
                    sellCount={marketData.sellCount}
                  />
                </div>
                <div className="lg:col-span-5">
                  <RiskManagement
                    stopTarget={marketData.stopTarget}
                    bias={marketData.bias}
                    currentPrice={marketData.currentPrice}
                  />
                </div>
              </div>

              {/* Patterns and Support/Resistance Levels */}
              <PatternsAndLevels
                patterns={marketData.patterns}
                levels={marketData.levels}
                currentPrice={marketData.currentPrice}
              />
            </div>
          )}

          {/* TAB 2: Varredura de Oportunidades & Scanner */}
          {activeTab === 'scanner' && (
            <OpportunitiesScannerView
              onSelectTicker={(selectedTicker, selectedMarket) => {
                setMarketType(selectedMarket);
                setTicker(selectedTicker);
                setActiveTab('analysis');
              }}
            />
          )}

          {/* TAB: Chart Screenshot Upload with AI Vision */}
          {activeTab === 'upload' && <ChartUploadView />}
        </main>
      </div>

      {/* AI Analysis Modal */}
      {marketData && (
        <AIAnalysisModal
          ticker={marketData.ticker}
          candles={marketData.candles}
          signals={marketData.signals}
          stopTarget={marketData.stopTarget}
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
        />
      )}
    </div>
  );
};
export default App;
