import React, { useState } from 'react';
import { Search, RefreshCw, WifiOff } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ScienceBitLogo } from './ScienceBitLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface Props {
  currentTicker: string;
  marketType: 'B3' | 'EUA';
  onTickerChange: (ticker: string, market: 'B3' | 'EUA') => void;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  lastUpdated: string;
}

export const Header: React.FC<Props> = ({
  currentTicker,
  marketType,
  onTickerChange,
  onRefresh,
  isLoading,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  lastUpdated,
}) => {
  const isOnline = useOnlineStatus();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const cleanTicker = searchInput.trim().toUpperCase();
    onTickerChange(cleanTicker, marketType);
    setSearchInput('');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0A100D]/90 backdrop-blur-md border-b border-[#1E2E25] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand logo & Ticker active pill */}
        <div className="w-full md:w-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* ScienceBit Brand Logo */}
            <div className="flex items-center px-2 py-1 rounded-lg bg-[#0F1813] border border-[#1F3327]">
              <ScienceBitLogo className="h-7 w-28" variant="dark" showSubtitle={true} />
            </div>

            <div className="border-l border-[#1F3327] pl-3 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs md:text-sm tracking-tight text-white line-clamp-1">
                  Análise gráfica da bolsa de valores por IA
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 shrink-0">
                  SWING TRADE
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Operações de Swing Trade no gráfico diário</p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <PWAInstallButton variant="compact" />
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#14201A] border border-[#22332B] text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00E6A0]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center: Search input with market selector */}
        <div className="w-full md:max-w-md flex items-center gap-2">
          {/* Market Toggle (B3 vs EUA) */}
          <div className="flex bg-[#14201A] p-1 rounded-xl border border-[#22332B] text-xs font-semibold shrink-0">
            <button
              onClick={() => onTickerChange(currentTicker, 'B3')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                marketType === 'B3'
                  ? 'bg-[#00E6A0] text-[#0A100D]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              B3
            </button>
            <button
              onClick={() => onTickerChange(currentTicker, 'EUA')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                marketType === 'EUA'
                  ? 'bg-[#00E6A0] text-[#0A100D]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              EUA
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={marketType === 'B3' ? 'Buscar ativo (ex: PETR4, VALE3)...' : 'Buscar ativo (ex: AAPL, NVDA)...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#14201A] border border-[#22332B] focus:border-[#00E6A0] focus:ring-1 focus:ring-[#00E6A0] text-xs text-white placeholder-zinc-500 outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Right: Auto-Refresh toggle, PWA Install & Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Offline badge if offline */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}

          {/* Auto Refresh Switch */}
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => onToggleAutoRefresh(e.target.checked)}
              className="accent-[#00E6A0] rounded cursor-pointer"
            />
            <span>Tempo real</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14201A] hover:bg-[#1B2B23] border border-[#22332B] text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00E6A0]' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
