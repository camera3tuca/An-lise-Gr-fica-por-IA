import React from 'react';
import {
  Globe2,
  TrendingUp,
  Layers,
  BarChart2,
  Check,
  Sparkles,
  Flame,
} from 'lucide-react';
import { OpportunityItem } from '../types';

export type SelectedCategory = 'acoes_b3' | 'eua' | 'bdrs' | 'etfs';

interface Props {
  currentTicker: string;
  marketType: 'B3' | 'EUA';
  onSelectTicker: (ticker: string, market: 'B3' | 'EUA') => void;
  opportunities: OpportunityItem[];
  onOpenOpportunitiesModal?: () => void;
}

interface AssetShortcut {
  ticker: string;
  name: string;
  market: 'B3' | 'EUA';
  badge?: string;
}

export const MarketCategoryBar: React.FC<Props> = ({
  currentTicker,
  marketType,
  onSelectTicker,
  opportunities,
  onOpenOpportunitiesModal,
}) => {
  // Determina a categoria ativa baseado no ticker atual e no mercado
  const cleanTicker = currentTicker.trim().toUpperCase().replace('.SA', '');

  const isBDR =
    cleanTicker.endsWith('34') ||
    cleanTicker.endsWith('35') ||
    cleanTicker.endsWith('39') ||
    ['NVDC34', 'AAPL34', 'MSFT34', 'TSLA34', 'AMZO34', 'GOGL34', 'MELI34', 'DISB34', 'BABA34', 'COCA34'].includes(cleanTicker);

  const isETF =
    ['BOVA11', 'SMAL11', 'IVVB11', 'NASD11', 'HASH11', 'GOLD11', 'SPY', 'QQQ'].includes(cleanTicker);

  let activeCategory: SelectedCategory = 'acoes_b3';
  if (marketType === 'EUA' && !isETF) {
    activeCategory = 'eua';
  } else if (isETF) {
    activeCategory = 'etfs';
  } else if (isBDR) {
    activeCategory = 'bdrs';
  } else if (marketType === 'B3') {
    activeCategory = 'acoes_b3';
  }

  // Listas de atalhos por categoria
  const acoesB3Shortcuts: AssetShortcut[] = [
    { ticker: 'PETR4', name: 'Petrobras PN', market: 'B3' },
    { ticker: 'VALE3', name: 'Vale ON', market: 'B3' },
    { ticker: 'ITUB4', name: 'Itaú Unibanco', market: 'B3' },
    { ticker: 'BBAS3', name: 'Banco do Brasil', market: 'B3' },
    { ticker: 'WEGE3', name: 'WEG ON', market: 'B3' },
    { ticker: 'PRIO3', name: 'PRIO ON', market: 'B3' },
    { ticker: 'BBDC4', name: 'Bradesco PN', market: 'B3' },
    { ticker: 'RENT3', name: 'Localiza ON', market: 'B3' },
    { ticker: 'MGLU3', name: 'Magalu ON', market: 'B3' },
    { ticker: 'SUZB3', name: 'Suzano ON', market: 'B3' },
    { ticker: 'EMBR3', name: 'Embraer ON', market: 'B3' },
  ];

  const euaShortcuts: AssetShortcut[] = [
    { ticker: 'NVDA', name: 'NVIDIA Corp.', market: 'EUA' },
    { ticker: 'AAPL', name: 'Apple Inc.', market: 'EUA' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', market: 'EUA' },
    { ticker: 'TSLA', name: 'Tesla Inc.', market: 'EUA' },
    { ticker: 'AMZN', name: 'Amazon.com', market: 'EUA' },
    { ticker: 'META', name: 'Meta Platforms', market: 'EUA' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', market: 'EUA' },
    { ticker: 'AMD', name: 'AMD Tech', market: 'EUA' },
    { ticker: 'NFLX', name: 'Netflix Inc.', market: 'EUA' },
  ];

  const bdrsShortcuts: AssetShortcut[] = [
    { ticker: 'NVDC34', name: 'NVIDIA BDR', market: 'B3' },
    { ticker: 'AAPL34', name: 'Apple BDR', market: 'B3' },
    { ticker: 'MSFT34', name: 'Microsoft BDR', market: 'B3' },
    { ticker: 'TSLA34', name: 'Tesla BDR', market: 'B3' },
    { ticker: 'AMZO34', name: 'Amazon BDR', market: 'B3' },
    { ticker: 'GOGL34', name: 'Alphabet BDR', market: 'B3' },
    { ticker: 'MELI34', name: 'Mercado Livre BDR', market: 'B3' },
    { ticker: 'DISB34', name: 'Disney BDR', market: 'B3' },
    { ticker: 'BABA34', name: 'Alibaba BDR', market: 'B3' },
    { ticker: 'COCA34', name: 'Coca-Cola BDR', market: 'B3' },
  ];

  const etfsShortcuts: AssetShortcut[] = [
    { ticker: 'BOVA11', name: 'Ibovespa ETF', market: 'B3', badge: 'B3' },
    { ticker: 'SMAL11', name: 'Small Caps ETF', market: 'B3', badge: 'B3' },
    { ticker: 'IVVB11', name: 'S&P 500 (R$)', market: 'B3', badge: 'B3' },
    { ticker: 'NASD11', name: 'Nasdaq 100 (R$)', market: 'B3', badge: 'B3' },
    { ticker: 'HASH11', name: 'Cripto ETF', market: 'B3', badge: 'B3' },
    { ticker: 'GOLD11', name: 'Ouro ETF', market: 'B3', badge: 'B3' },
    { ticker: 'SPY', name: 'SPDR S&P 500 (USD)', market: 'EUA', badge: 'EUA' },
    { ticker: 'QQQ', name: 'Invesco QQQ (USD)', market: 'EUA', badge: 'EUA' },
  ];

  // Contagem de oportunidades no scanner por categoria
  const acoesB3Ops = opportunities.filter((o) => o.categoria === 'B3' && o.classe === 'Ação').length;
  const euaOps = opportunities.filter((o) => o.categoria === 'EUA').length;
  const bdrsOps = opportunities.filter((o) => o.classe === 'BDR').length;
  const etfsOps = opportunities.filter((o) => o.classe === 'ETF').length;

  const handleCategoryClick = (category: SelectedCategory) => {
    if (category === 'acoes_b3') {
      onSelectTicker('PETR4', 'B3');
    } else if (category === 'eua') {
      onSelectTicker('NVDA', 'EUA');
    } else if (category === 'bdrs') {
      onSelectTicker('NVDC34', 'B3');
    } else if (category === 'etfs') {
      onSelectTicker('BOVA11', 'B3');
    }
  };

  const getShortcutsForActive = () => {
    switch (activeCategory) {
      case 'eua':
        return euaShortcuts;
      case 'bdrs':
        return bdrsShortcuts;
      case 'etfs':
        return etfsShortcuts;
      case 'acoes_b3':
      default:
        return acoesB3Shortcuts;
    }
  };

  const shortcuts = getShortcutsForActive();

  return (
    <div className="bg-[#0E1712] rounded-2xl border border-[#1E3628] p-3 md:p-3.5 shadow-xl space-y-3">
      {/* 1. Botões de Seleção de Categoria / Mercado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Botão Ações B3 */}
          <button
            type="button"
            onClick={() => handleCategoryClick('acoes_b3')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
              activeCategory === 'acoes_b3'
                ? 'bg-[#00E6A0] text-[#0A100D] border-[#00E6A0] shadow-lg shadow-[#00E6A0]/20'
                : 'bg-[#14221A] text-zinc-300 hover:text-white border-[#22382B] hover:border-[#00E6A0]/40'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>🇧🇷 Ações B3</span>
            {acoesB3Ops > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  activeCategory === 'acoes_b3'
                    ? 'bg-[#0A100D]/20 text-[#0A100D]'
                    : 'bg-[#1D3226] text-[#00E6A0]'
                }`}
              >
                {acoesB3Ops}
              </span>
            )}
          </button>

          {/* Botão Mercado Americano (EUA) */}
          <button
            type="button"
            onClick={() => handleCategoryClick('eua')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
              activeCategory === 'eua'
                ? 'bg-[#00E6A0] text-[#0A100D] border-[#00E6A0] shadow-lg shadow-[#00E6A0]/20'
                : 'bg-[#14221A] text-zinc-300 hover:text-white border-[#22382B] hover:border-[#00E6A0]/40'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>🇺🇸 Mercado Americano</span>
            {euaOps > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  activeCategory === 'eua'
                    ? 'bg-[#0A100D]/20 text-[#0A100D]'
                    : 'bg-[#1D3226] text-[#00E6A0]'
                }`}
              >
                {euaOps}
              </span>
            )}
          </button>

          {/* Botão BDRs */}
          <button
            type="button"
            onClick={() => handleCategoryClick('bdrs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
              activeCategory === 'bdrs'
                ? 'bg-[#00E6A0] text-[#0A100D] border-[#00E6A0] shadow-lg shadow-[#00E6A0]/20'
                : 'bg-[#14221A] text-zinc-300 hover:text-white border-[#22382B] hover:border-[#00E6A0]/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🌐 BDRs (B3)</span>
            {bdrsOps > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  activeCategory === 'bdrs'
                    ? 'bg-[#0A100D]/20 text-[#0A100D]'
                    : 'bg-[#1D3226] text-[#00E6A0]'
                }`}
              >
                {bdrsOps}
              </span>
            )}
          </button>

          {/* Botão ETFs */}
          <button
            type="button"
            onClick={() => handleCategoryClick('etfs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
              activeCategory === 'etfs'
                ? 'bg-[#00E6A0] text-[#0A100D] border-[#00E6A0] shadow-lg shadow-[#00E6A0]/20'
                : 'bg-[#14221A] text-zinc-300 hover:text-white border-[#22382B] hover:border-[#00E6A0]/40'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 ETFs (B3 & Global)</span>
            {etfsOps > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  activeCategory === 'etfs'
                    ? 'bg-[#0A100D]/20 text-[#0A100D]'
                    : 'bg-[#1D3226] text-[#00E6A0]'
                }`}
              >
                {etfsOps}
              </span>
            )}
          </button>
        </div>

        {/* Lado Direito: Acesso rápido a Oportunidades */}
        {onOpenOpportunitiesModal && (
          <button
            type="button"
            onClick={onOpenOpportunitiesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172A20] hover:bg-[#1E382A] border border-[#234330] text-[#00E6A0] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Radar de Oportunidades ({opportunities.length})</span>
          </button>
        )}
      </div>

      {/* 2. Barra de Botões com Ativos Populares da Categoria Selecionada */}
      <div className="pt-2 border-t border-[#182C20] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap shrink-0">
          Atalhos Rápidos:
        </span>

        <div className="flex items-center gap-1.5">
          {shortcuts.map((item) => {
            const isSelected = cleanTicker === item.ticker.replace('.SA', '');
            return (
              <button
                key={item.ticker}
                type="button"
                onClick={() => onSelectTicker(item.ticker, item.market)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#00E6A0] text-[#0A100D] font-black shadow-md shadow-[#00E6A0]/20 ring-1 ring-[#00E6A0]'
                    : 'bg-[#121E17] hover:bg-[#1A2D22] text-zinc-300 hover:text-white border border-[#203628] hover:border-[#00E6A0]/40'
                }`}
                title={`${item.ticker} - ${item.name}`}
              >
                {isSelected && <Check className="w-3 h-3 text-[#0A100D]" />}
                <span className="font-bold">{item.ticker}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 rounded ${
                      isSelected
                        ? 'bg-[#0A100D]/20 text-[#0A100D] font-extrabold'
                        : 'bg-[#182820] text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
