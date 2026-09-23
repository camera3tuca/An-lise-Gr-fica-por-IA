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
import { TopMoversView } from './components/TopMoversView';
import { NewsSentimentsView } from './components/NewsSentimentsView';
import { ChartUploadView } from './components/ChartUploadView';
import { OpportunitiesScannerView } from './components/OpportunitiesScannerView';
import { CapaOpportunitySelector } from './components/CapaOpportunitySelector';
import { MarketCategoryBar } from './components/MarketCategoryBar';
import { SubscriberAreaModal } from './components/SubscriberAreaModal';
import { MarketHistoryResponse, OpportunityItem } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  processAllIndicators,
  generateSwingSignals,
  calculateStopTarget,
  calculateSmartInsights,
  calculateSupportResistance,
  detectPatterns,
} from './indicators';
import { AlertCircle, RefreshCw, Calendar, Clock, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Sparkles, Target, Radar, Crown, Calculator, Bot } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');

  // Subscriber & Risk Management VIP state
  const [isSubscriberModalOpen, setIsSubscriberModalOpen] = useState(false);
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('sciencebit_pro_active') === 'true';
  });
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('sciencebit_gemini_key') || '';
  });

  // Market & Ticker state (persisted or initialized with intelligent default)
  const [marketType, setMarketType] = useState<'B3' | 'EUA'>(() => {
    const saved = localStorage.getItem('capa_market');
    return (saved === 'EUA' || saved === 'B3') ? saved : 'B3';
  });
  const [ticker, setTicker] = useState(() => {
    return localStorage.getItem('capa_ticker') || 'PETR4';
  });
  const [period, setPeriod] = useState('1y');
  const [interval, setInterval] = useState('1d');

  // Scanner Opportunities for Capa Selection
  const [scannerOpportunities, setScannerOpportunities] = useState<OpportunityItem[]>([]);
  const [loadingScanner, setLoadingScanner] = useState(false);

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
      // If B3, append .SA if not already present; if EUA, ensure no .SA
      let queryTicker = ticker.trim().toUpperCase();
      if (marketType === 'B3' && !queryTicker.endsWith('.SA')) {
        queryTicker = `${queryTicker}.SA`;
      } else if (marketType === 'EUA') {
        queryTicker = queryTicker.replace('.SA', '');
      }

      const res = await fetch(
        `/api/market/history?ticker=${encodeURIComponent(queryTicker)}&market=${marketType}&period=${period}&interval=${interval}`
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

  // Fetch opportunities from scanner to populate the Capa selector
  const fetchScannerOpportunities = useCallback(async () => {
    setLoadingScanner(true);
    try {
      const res = await fetch('/api/market/scanner?category=Todos');
      if (res.ok) {
        const data = await res.json();
        const ops: OpportunityItem[] = data.opportunities || [];
        setScannerOpportunities(ops);

        // Se o usuário ainda não escolheu uma ação salva no localStorage,
        // inicializa a capa com a melhor oportunidade detectada!
        const savedTicker = localStorage.getItem('capa_ticker');
        if (!savedTicker && ops.length > 0) {
          const topOp = ops[0];
          if (topOp) {
            const targetMarket = topOp.categoria === 'EUA' ? 'EUA' : 'B3';
            setTicker(topOp.ticker);
            setMarketType(targetMarket);
            localStorage.setItem('capa_ticker', topOp.ticker);
            localStorage.setItem('capa_market', targetMarket);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar oportunidades para a capa:', err);
    } finally {
      setLoadingScanner(false);
    }
  }, []);

  useEffect(() => {
    fetchScannerOpportunities();
  }, [fetchScannerOpportunities]);

  // Auto Refresh Interval
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = window.setInterval(() => {
      fetchData();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshIntervalSec, fetchData]);

  const handleSelectCapaOpportunity = (newTicker: string, newMarket: 'B3' | 'EUA') => {
    const cleanTicker = newTicker.trim().toUpperCase().replace('.SA', '');
    setMarketType(newMarket);
    setTicker(cleanTicker);
    localStorage.setItem('capa_ticker', cleanTicker);
    localStorage.setItem('capa_market', newMarket);
    setActiveTab('analysis');
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
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {}),
        },
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

  const currentOpportunity = scannerOpportunities.find(
    (o) => o.ticker.toUpperCase() === (marketData?.ticker || ticker).toUpperCase()
  );

  return (
    <div className="min-h-screen bg-[#0A100D] text-[#EAF3EE] flex flex-col pb-16 lg:pb-0">
      {/* Top Header */}
      <Header
        currentTicker={ticker}
        marketType={marketType}
        onTickerChange={handleSelectCapaOpportunity}
        onRefresh={fetchData}
        isLoading={loading}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={setAutoRefreshEnabled}
        lastUpdated={marketData?.lastUpdated || '--:--:--'}
        opportunitiesCount={scannerOpportunities.length}
        onOpenScanner={() => setActiveTab('scanner')}
        onOpenSubscriberArea={() => setIsSubscriberModalOpen(true)}
        isProUser={isProUser}
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
          onOpenSubscriberArea={() => setIsSubscriberModalOpen(true)}
          isProUser={isProUser}
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
              {/* Barra Seletora de Mercados & Categorias: Ações B3, Mercado Americano, BDRs, ETFs */}
              <MarketCategoryBar
                currentTicker={marketData.ticker}
                marketType={marketType}
                onSelectTicker={handleSelectCapaOpportunity}
                opportunities={scannerOpportunities}
                onOpenOpportunitiesModal={() => {
                  const el = document.getElementById('secao-oportunidades-radar');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />

              {/* Asset Headline Bar */}
              <div id="secao-grafico-capa" className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 scroll-mt-20">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                        {marketData.ticker}
                      </h1>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#14201A] border border-[#22332B] text-zinc-400">
                        {marketType === 'B3' ? 'B3 / BRL' : 'NYSE/NASDAQ (USD)'}
                      </span>
                      {currentOpportunity && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E6A0]/20 text-[#00E6A0] border border-[#00E6A0]/40 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#00E6A0]" />
                          Oportunidade Radar: {currentOpportunity.setup} ({currentOpportunity.score}%)
                        </span>
                      )}
                      {!marketData.isDemo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse" />
                          Dados Reais {marketType === 'B3' ? 'B3' : 'Global EUA'}
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

                  {/* Botão Analisar Gráfico com IA */}
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] hover:from-[#00c98c] hover:to-[#009c6c] text-[#0A100D] text-xs font-black transition cursor-pointer shadow-md shadow-[#00E6A0]/20"
                    title="Analisar Gráfico com IA através do Google Gemini 3.8 Flash"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Analisar Gráfico com IA</span>
                  </button>

                  {/* Botão Atalho Calculadora de Risco & Lote */}
                  <button
                    type="button"
                    onClick={() => setIsSubscriberModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer shadow-sm"
                    title="Calcular Tamanho de Lote e Gestão de Risco para este Ativo"
                  >
                    <Calculator className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Calculadora de Risco</span>
                    <span className="sm:hidden">Risco</span>
                  </button>
                </div>
              </div>

              {/* GRÁFICO DE CANDLESTICKS IMEDIATAMENTE ABAIXO DO ATIVO */}
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

              {/* 4 Smart Insights metric cards */}
              <SmartInsights insights={marketData.insights} />

              {/* Seletor & Lista de Oportunidades do Radar de Mercado */}
              <div id="secao-oportunidades-radar">
                <CapaOpportunitySelector
                  currentTicker={marketData.ticker}
                  marketType={marketType}
                  opportunities={scannerOpportunities}
                  isLoadingOpportunities={loadingScanner}
                  onSelectOpportunityForCapa={handleSelectCapaOpportunity}
                  onGoToScanner={() => setActiveTab('scanner')}
                />
              </div>

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
              currentCapaTicker={ticker}
              onSelectTicker={handleSelectCapaOpportunity}
            />
          )}

          {/* TAB 3: Top Movers */}
          {activeTab === 'movers' && <TopMoversView />}

          {/* TAB 3: News & Sentiments */}
          {activeTab === 'news' && <NewsSentimentsView />}

          {/* TAB 4: Chart Screenshot Upload with AI Vision */}
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

      {/* Subscriber VIP & Risk Management Modal */}
      <SubscriberAreaModal
        isOpen={isSubscriberModalOpen}
        onClose={() => setIsSubscriberModalOpen(false)}
        currentTicker={marketData?.ticker || ticker}
        currentPrice={marketData?.currentPrice || 0}
        marketType={marketType}
        calculatedStop={marketData?.stopTarget?.stop}
        calculatedAlvo={marketData?.stopTarget?.alvo}
        atr={marketData?.candles[marketData.candles.length - 1]?.ATR}
        aiAnalysisText={aiText}
        userApiKey={userApiKey}
        onApiKeyChange={(key) => setUserApiKey(key)}
        isProUser={isProUser}
        setIsProUser={setIsProUser}
      />
    </div>
  );
};
export default App;
