import React from 'react';
import { RefreshCw, WifiOff, Radar, Crown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ScienceBitLogo } from './ScienceBitLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { GlobalAssetSearch } from './GlobalAssetSearch';

interface Props {
  currentTicker: string;
  marketType: 'B3' | 'EUA';
  onTickerChange: (ticker: string, market: 'B3' | 'EUA') => void;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  lastUpdated: string;
  opportunitiesCount?: number;
  onOpenScanner?: () => void;
  onOpenSubscriberArea?: () => void;
  isProUser?: boolean;
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
  opportunitiesCount,
  onOpenScanner,
  onOpenSubscriberArea,
  isProUser = false,
}) => {
  const isOnline = useOnlineStatus();

  const handleSwitchMarket = (targetMarket: 'B3' | 'EUA') => {
    if (targetMarket === marketType) return;
    if (targetMarket === 'EUA') {
      const isB3Ticker = /\d/.test(currentTicker);
      const nextTicker = isB3Ticker ? 'NVDA' : currentTicker;
      onTickerChange(nextTicker, 'EUA');
    } else {
      const isUsTicker = !/\d/.test(currentTicker);
      const nextTicker = isUsTicker ? 'PETR4' : currentTicker;
      onTickerChange(nextTicker, 'B3');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0A100D]/95 backdrop-blur-md border-b border-[#1E2E25] px-3 sm:px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity & Subtitle */}
        <div className="w-full md:w-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* ScienceBit Brand Logo */}
            <div className="flex items-center px-2 py-1 rounded-lg bg-[#0F1813] border border-[#1F3327]">
              <ScienceBitLogo className="h-7 w-28" variant="dark" showSubtitle={true} />
            </div>

            <div className="border-l border-[#1F3327] pl-3 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs md:text-sm tracking-tight text-white line-clamp-1">
                  Análise Técnica de Alta Precisão
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 shrink-0">
                  B3 & EUA
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Todos os ativos globais com Inteligência Artificial</p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            {onOpenSubscriberArea && (
              <button
                type="button"
                onClick={onOpenSubscriberArea}
                className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300"
                title="Terminal Pro & Assinantes"
              >
                <Crown className="w-4 h-4 text-amber-400" />
              </button>
            )}
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

        {/* Center: Search input with market selector and autocomplete */}
        <div className="w-full md:max-w-lg flex items-center gap-2">
          {/* Market Toggle (B3 vs EUA) */}
          <div className="flex bg-[#14201A] p-0.5 rounded-xl border border-[#22332B] text-xs font-semibold shrink-0">
            <button
              onClick={() => handleSwitchMarket('B3')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                marketType === 'B3'
                  ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              B3
            </button>
            <button
              onClick={() => handleSwitchMarket('EUA')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                marketType === 'EUA'
                  ? 'bg-[#00E6A0] text-[#0A100D]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              EUA
            </button>
          </div>

          {/* Global Autocomplete Asset Search */}
          <div className="flex-1">
            <GlobalAssetSearch
              currentTicker={currentTicker}
              marketType={marketType}
              onSelectAsset={(ticker, market) => onTickerChange(ticker, market)}
            />
          </div>
        </div>

        {/* Right: Subscriber VIP Button, Auto-Refresh toggle, PWA Install & Status */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Botão de Assinantes VIP / Pro */}
          {onOpenSubscriberArea && (
            <button
              type="button"
              onClick={onOpenSubscriberArea}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm ${
                isProUser
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  : 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border-amber-500/40 text-amber-300'
              }`}
              title="Terminal Pro & Área de Assinantes"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{isProUser ? 'Área VIP' : 'Assinantes Pro'}</span>
            </button>
          )}

          {/* Opportunities quick link */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E6A0]/10 hover:bg-[#00E6A0]/20 border border-[#00E6A0]/30 text-xs font-bold text-[#00E6A0] transition cursor-pointer"
              title="Abrir Varredura Completa de Oportunidades"
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Radar</span>
              {typeof opportunitiesCount === 'number' && opportunitiesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#00E6A0] text-[#0A100D] text-[10px] font-black leading-none">
                  {opportunitiesCount}
                </span>
              )}
            </button>
          )}

          {/* Offline badge if offline */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}

          {/* Auto Refresh Switch */}
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => onToggleAutoRefresh(e.target.checked)}
              className="accent-[#00E6A0] rounded cursor-pointer"
            />
            <span>Auto</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14201A] hover:bg-[#1B2B23] border border-[#22332B] text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00E6A0]' : ''}`} />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};
