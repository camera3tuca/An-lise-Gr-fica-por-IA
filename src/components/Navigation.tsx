import React from 'react';
import {
  TrendingUp,
  Radar,
  BarChart3,
  Newspaper,
  Image as ImageIcon,
  Smartphone,
  Bot,
  Sliders,
  Eye,
} from 'lucide-react';
import { ScienceBitLogo } from './ScienceBitLogo';

export type ActiveTab = 'analysis' | 'scanner' | 'movers' | 'news' | 'upload' | 'playstore';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  // Indicator display toggles
  showAverages: boolean;
  setShowAverages: (val: boolean) => void;
  showBollinger: boolean;
  setShowBollinger: (val: boolean) => void;
  showRSI: boolean;
  setShowRSI: (val: boolean) => void;
  showMACD: boolean;
  setShowMACD: (val: boolean) => void;
  showLevels: boolean;
  setShowLevels: (val: boolean) => void;
  onOpenAIModal: () => void;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
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
  onOpenAIModal,
}) => {
  const tabs: TabItem[] = [
    { id: 'analysis', label: 'Análise Técnica', shortLabel: 'Análise', icon: TrendingUp },
    { id: 'scanner', label: 'Varredura & Oportunidades', shortLabel: 'Varredura', icon: Radar, highlight: true },
    { id: 'movers', label: 'Top Movers', shortLabel: 'Movers', icon: BarChart3 },
    { id: 'news', label: 'Notícias & Sentimento', shortLabel: 'Notícias', icon: Newspaper },
    { id: 'upload', label: 'Enviar Gráfico', shortLabel: 'Print IA', icon: ImageIcon },
    { id: 'playstore', label: 'Google Play Store', shortLabel: 'Play Store', icon: Smartphone },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0D1612] border-r border-[#1E2E25] p-4 shrink-0 min-h-[calc(100vh-61px)] space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-3 mb-2">
            Páginas do App
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#00E6A0] text-[#0A100D] shadow-md shadow-[#00E6A0]/15'
                    : 'text-zinc-300 hover:text-white hover:bg-[#14201A]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A100D]' : tab.highlight ? 'text-[#00E6A0]' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* AI Action Trigger Button */}
        <div className="pt-2">
          <button
            onClick={onOpenAIModal}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00E6A0]/20 to-[#00B37E]/10 border border-[#00E6A0]/40 text-[#00E6A0] hover:bg-[#00E6A0]/25 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Bot className="w-4 h-4" />
            <span>Gerar Leitura por IA</span>
          </button>
        </div>

        {/* Indicator Toggles (Active when on Analysis Tab) */}
        {activeTab === 'analysis' && (
          <div className="space-y-2 pt-2 border-t border-[#1E2E25]">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-1 mb-1">
              <Eye className="w-3 h-3 text-[#00E6A0]" />
              <span>Indicadores no Gráfico</span>
            </div>

            <div className="space-y-1.5 bg-[#101914] p-2.5 rounded-xl border border-[#22332B] text-xs">
              <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white select-none">
                <span>Médias (EMA9, SMA20/50/200)</span>
                <input
                  type="checkbox"
                  checked={showAverages}
                  onChange={(e) => setShowAverages(e.target.checked)}
                  className="accent-[#00E6A0] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white select-none">
                <span>Bandas de Bollinger</span>
                <input
                  type="checkbox"
                  checked={showBollinger}
                  onChange={(e) => setShowBollinger(e.target.checked)}
                  className="accent-[#00E6A0] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white select-none">
                <span>RSI (14) Estocástico</span>
                <input
                  type="checkbox"
                  checked={showRSI}
                  onChange={(e) => setShowRSI(e.target.checked)}
                  className="accent-[#00E6A0] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white select-none">
                <span>MACD (12, 26, 9)</span>
                <input
                  type="checkbox"
                  checked={showMACD}
                  onChange={(e) => setShowMACD(e.target.checked)}
                  className="accent-[#00E6A0] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 text-zinc-300 hover:text-white select-none">
                <span>Suporte & Resistência</span>
                <input
                  type="checkbox"
                  checked={showLevels}
                  onChange={(e) => setShowLevels(e.target.checked)}
                  className="accent-[#00E6A0] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Footer info in sidebar */}
        <div className="mt-auto pt-4 border-t border-[#1E2E25] text-[10px] text-zinc-400 space-y-2">
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#0A120E] border border-[#1E2E25]">
            <ScienceBitLogo className="h-6 w-24" variant="dark" showSubtitle={true} />
          </div>
          <div className="text-center space-y-0.5">
            <p className="font-semibold text-zinc-300">Análise por IA & Swing Trade</p>
            <p className="text-[9px] text-zinc-500">Dados reais de mercado B3 e Globais</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (min touch target >= 44px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1612]/95 backdrop-blur-md border-t border-[#1E2E25] px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] rounded-xl px-2 py-1 transition cursor-pointer ${
                isActive
                  ? 'text-[#00E6A0] font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] tracking-tight">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
