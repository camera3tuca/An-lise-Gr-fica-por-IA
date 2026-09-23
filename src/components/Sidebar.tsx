import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Newspaper,
  Image as ImageIcon,
  RefreshCw,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MarketType, PageId, PeriodType, TimeframeType } from '../types';

export const LANGUAGES = [
  'Português (Brasil)',
  'English',
  'Español',
  'Deutsch',
  'Français',
  'Italiano',
  'العربية',
];

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  // Analysis params
  market: MarketType;
  setMarket: (m: MarketType) => void;
  tickerInput: string;
  setTickerInput: (t: string) => void;
  period: PeriodType;
  setPeriod: (p: PeriodType) => void;
  timeframe: TimeframeType;
  setTimeframe: (t: TimeframeType) => void;
  autoRefresh: boolean;
  setAutoRefresh: (a: boolean) => void;
  refreshSeconds: number;
  setRefreshSeconds: (s: number) => void;
  // Chart indicators
  showAverages: boolean;
  setShowAverages: (v: boolean) => void;
  showBollinger: boolean;
  setShowBollinger: (v: boolean) => void;
  showRSI: boolean;
  setShowRSI: (v: boolean) => void;
  showMACD: boolean;
  setShowMACD: (v: boolean) => void;
  showLevels: boolean;
  setShowLevels: (v: boolean) => void;
  // AI
  aiLanguage: string;
  setAiLanguage: (l: string) => void;
  onGenerateAiAnalysis: () => void;
  isAiLoading: boolean;
  onRefreshData: () => void;
  isDataLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  market,
  setMarket,
  tickerInput,
  setTickerInput,
  period,
  setPeriod,
  timeframe,
  setTimeframe,
  autoRefresh,
  setAutoRefresh,
  refreshSeconds,
  setRefreshSeconds,
  showAverages,
  setShowAverages,
  showBollinger,
  setShowBollinger,
  showRSI,
  setShowRSI,
  showMACD,
  setShowMACD,
  showLevels,
  setShowLevels,
  aiLanguage,
  setAiLanguage,
  onGenerateAiAnalysis,
  isAiLoading,
  onRefreshData,
  isDataLoading,
}) => {
  return (
    <aside
      id="app-sidebar"
      className="w-72 md:w-80 bg-[#0E1713] border-r border-[#1E2E25] flex flex-col h-screen shrink-0 overflow-y-auto text-[#CDD9D3] text-sm select-none"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1E2E25] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00E6A0]/10 border border-[#00E6A0]/30 flex items-center justify-center text-[#00E6A0]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#EAF3EE] tracking-tight">Chart AI Plus</h1>
            <p className="text-[11px] text-[#8FA79B]">Swing Trade & IA</p>
          </div>
        </div>
      </div>

      {/* Navigation Pages */}
      <div className="p-3 border-b border-[#1E2E25]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6C8477] px-2 mb-1.5">
          Navegação
        </div>
        <nav className="space-y-1">
          <button
            id="nav-analysis"
            onClick={() => setActivePage('analysis')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${
              activePage === 'analysis'
                ? 'bg-[#182920] text-[#00E6A0] border border-[#00E6A0]/25'
                : 'text-[#CDD9D3] hover:bg-[#14221A] hover:text-[#EAF3EE]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📈 Análise Técnica</span>
          </button>
          <button
            id="nav-movers"
            onClick={() => setActivePage('movers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${
              activePage === 'movers'
                ? 'bg-[#182920] text-[#00E6A0] border border-[#00E6A0]/25'
                : 'text-[#CDD9D3] hover:bg-[#14221A] hover:text-[#EAF3EE]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Top Gainers & Losers</span>
          </button>
          <button
            id="nav-news"
            onClick={() => setActivePage('news')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${
              activePage === 'news'
                ? 'bg-[#182920] text-[#00E6A0] border border-[#00E6A0]/25'
                : 'text-[#CDD9D3] hover:bg-[#14221A] hover:text-[#EAF3EE]'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>📰 News & Sentiments</span>
          </button>
          <button
            id="nav-upload"
            onClick={() => setActivePage('upload')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${
              activePage === 'upload'
                ? 'bg-[#182920] text-[#00E6A0] border border-[#00E6A0]/25'
                : 'text-[#CDD9D3] hover:bg-[#14221A] hover:text-[#EAF3EE]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>🖼️ Enviar Gráfico</span>
          </button>
        </nav>
      </div>

      {/* Dynamic Controls based on Page */}
      {activePage === 'analysis' ? (
        <div className="p-3 space-y-4">
          {/* Section: Parâmetros */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#6C8477] px-2 mb-2">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Parâmetros
              </span>
              <button
                id="btn-refresh-data"
                onClick={onRefreshData}
                disabled={isDataLoading}
                className="hover:text-[#00E6A0] transition-colors p-1"
                title="Atualizar dados agora"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-[#00E6A0]' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 px-1">
              <div>
                <label className="text-xs text-[#8FA79B] block mb-1">Mercado</label>
                <select
                  id="select-market"
                  value={market}
                  onChange={(e) => {
                    const newMarket = e.target.value as MarketType;
                    setMarket(newMarket);
                    if (newMarket.startsWith('B3') && tickerInput === 'AAPL') {
                      setTickerInput('PETR4');
                    } else if (!newMarket.startsWith('B3') && tickerInput === 'PETR4') {
                      setTickerInput('AAPL');
                    }
                  }}
                  className="w-full bg-[#14201A] border border-[#22332B] rounded-lg px-2.5 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
                >
                  <option value="B3 (Brasil)">B3 (Brasil)</option>
                  <option value="EUA / Outros">EUA / Outros</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8FA79B] block mb-1">Ticker</label>
                <div className="flex gap-1.5">
                  <input
                    id="input-ticker"
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    placeholder={market.startsWith('B3') ? 'PETR4, VALE3...' : 'AAPL, NVDA...'}
                    className="w-full bg-[#14201A] border border-[#22332B] rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0] uppercase"
                  />
                  <button
                    id="btn-load-ticker"
                    onClick={onRefreshData}
                    className="bg-[#182920] border border-[#22332B] hover:border-[#00E6A0]/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#00E6A0] transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#8FA79B] block mb-1">Histórico</label>
                  <select
                    id="select-period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="w-full bg-[#14201A] border border-[#22332B] rounded-lg px-2 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
                  >
                    <option value="6mo">6 meses</option>
                    <option value="1y">1 ano</option>
                    <option value="2y">2 anos</option>
                    <option value="5y">5 anos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#8FA79B] block mb-1">Tempo gráfico</label>
                  <select
                    id="select-timeframe"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                    className="w-full bg-[#14201A] border border-[#22332B] rounded-lg px-2 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
                  >
                    <option value="1d">Diário (swing)</option>
                    <option value="1wk">Semanal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Tempo Real */}
          <div className="pt-2 border-t border-[#1E2E25]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6C8477] px-2 mb-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Tempo real
            </div>
            <div className="space-y-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="checkbox-auto-refresh"
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-[#CDD9D3]">Atualizar automaticamente</span>
              </label>

              {autoRefresh && (
                <div className="pl-6 pt-1">
                  <div className="flex justify-between text-[11px] text-[#8FA79B] mb-1">
                    <span>A cada:</span>
                    <span className="font-mono text-[#00E6A0] font-semibold">{refreshSeconds}s</span>
                  </div>
                  <input
                    id="slider-refresh-seconds"
                    type="range"
                    min="15"
                    max="300"
                    step="15"
                    value={refreshSeconds}
                    onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                    className="w-full accent-[#00E6A0] bg-[#14201A] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Indicadores no Gráfico */}
          <div className="pt-2 border-t border-[#1E2E25]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6C8477] px-2 mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Indicadores no gráfico
            </div>
            <div className="space-y-1.5 px-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#EAF3EE]">
                <input
                  id="checkbox-show-averages"
                  type="checkbox"
                  checked={showAverages}
                  onChange={(e) => setShowAverages(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0"
                />
                <span>Médias móveis (SMA/EMA)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#EAF3EE]">
                <input
                  id="checkbox-show-bollinger"
                  type="checkbox"
                  checked={showBollinger}
                  onChange={(e) => setShowBollinger(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0"
                />
                <span>Bandas de Bollinger</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#EAF3EE]">
                <input
                  id="checkbox-show-rsi"
                  type="checkbox"
                  checked={showRSI}
                  onChange={(e) => setShowRSI(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0"
                />
                <span>RSI (14)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#EAF3EE]">
                <input
                  id="checkbox-show-macd"
                  type="checkbox"
                  checked={showMACD}
                  onChange={(e) => setShowMACD(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0"
                />
                <span>MACD (12, 26, 9)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-[#EAF3EE]">
                <input
                  id="checkbox-show-levels"
                  type="checkbox"
                  checked={showLevels}
                  onChange={(e) => setShowLevels(e.target.checked)}
                  className="rounded bg-[#14201A] border-[#22332B] text-[#00E6A0] focus:ring-0"
                />
                <span>Suporte / Resistência</span>
              </label>
            </div>
          </div>

          {/* Section: Leitura por IA */}
          <div className="pt-2 border-t border-[#1E2E25]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6C8477] px-2 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00E6A0]" /> Leitura por IA
            </div>
            <div className="space-y-2 px-1">
              <div>
                <label className="text-xs text-[#8FA79B] block mb-1">Idioma da análise</label>
                <select
                  id="select-ai-language"
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full bg-[#14201A] border border-[#22332B] rounded-lg px-2.5 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="btn-generate-ai-analysis"
                onClick={onGenerateAiAnalysis}
                disabled={isAiLoading || isDataLoading}
                className="w-full mt-1 bg-[#00E6A0] hover:bg-[#00c98b] text-[#08130D] font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Analisando Gráfico com IA...' : '🤖 Analisar Gráfico com IA'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-xs text-[#8FA79B]">
          <p className="leading-relaxed">
            Selecione uma página para explorar ferramentas de mercado e inteligência artificial para Swing Trade.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-auto p-3 border-t border-[#1E2E25] text-[11px] text-[#6C8477] text-center">
        Chart AI Plus · Swing Trade Diário
      </div>
    </aside>
  );
};
