import React, { useState, useMemo } from 'react';
import {
  Radar,
  Sparkles,
  ChevronRight,
  Check,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
  Target,
  ExternalLink,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { OpportunityItem } from '../types';

interface Props {
  currentTicker: string;
  marketType: 'B3' | 'EUA';
  opportunities: OpportunityItem[];
  isLoadingOpportunities: boolean;
  onSelectOpportunityForCapa: (ticker: string, market: 'B3' | 'EUA') => void;
  onGoToScanner: () => void;
}

type FilterCategory = 'TODOS' | 'COMPRA_FORTE' | 'B3' | 'EUA' | 'BDR' | 'ETF' | 'SOBREVENDA';

export const CapaOpportunitySelector: React.FC<Props> = ({
  currentTicker,
  marketType,
  opportunities,
  isLoadingOpportunities,
  onSelectOpportunityForCapa,
  onGoToScanner,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('TODOS');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllInline, setShowAllInline] = useState(false);

  // Encontrar se o ticker atual na capa faz parte da lista de oportunidades
  const currentOpportunity = useMemo(() => {
    return opportunities.find(
      (op) => op.ticker.toUpperCase() === currentTicker.toUpperCase()
    );
  }, [opportunities, currentTicker]);

  // Lista ordenada pelas melhores oportunidades (Score decrescente)
  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => b.score - a.score);
  }, [opportunities]);

  // Filtrar oportunidades para a exibição na lista da capa
  const filteredList = useMemo(() => {
    return sortedOpportunities.filter((op) => {
      if (activeFilter === 'COMPRA_FORTE' && op.sinal !== 'COMPRA FORTE') return false;
      if (activeFilter === 'B3' && (op.categoria === 'EUA' || op.classe === 'BDR' || op.classe === 'ETF')) return false;
      if (activeFilter === 'EUA' && op.categoria !== 'EUA') return false;
      if (activeFilter === 'BDR' && op.classe !== 'BDR') return false;
      if (activeFilter === 'ETF' && op.classe !== 'ETF') return false;
      if (activeFilter === 'SOBREVENDA' && (op.indiceSobrevenda ?? 0) < 70 && op.ifr2 > 25) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          op.ticker.toLowerCase().includes(q) ||
          op.nome.toLowerCase().includes(q) ||
          op.setup.toLowerCase().includes(q) ||
          (op.setor && op.setor.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sortedOpportunities, activeFilter, searchFilter]);

  // Quantidade visível no modo inline: padrão top 6 ou todas
  const displayedOpportunities = showAllInline ? filteredList : filteredList.slice(0, 6);

  const handleSelect = (ticker: string, categoria: string) => {
    const targetMarket: 'B3' | 'EUA' = categoria === 'EUA' ? 'EUA' : 'B3';
    onSelectOpportunityForCapa(ticker, targetMarket);
    setIsModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById('secao-grafico-capa');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const comprasFortesCount = useMemo(() => {
    return opportunities.filter((o) => o.sinal === 'COMPRA FORTE').length;
  }, [opportunities]);

  return (
    <section className="bg-[#0E1712] rounded-2xl border border-[#1E3628] shadow-xl overflow-hidden">
      {/* Header Principal da Seção de Oportunidades */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#101E17] via-[#12221A] to-[#0D1920] border-b border-[#1E3426]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Título & Badge de Status */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 flex items-center justify-center shrink-0">
              <Radar className="w-6 h-6 text-[#00E6A0] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Melhores Oportunidades do Mercado</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-ping" />
                  Radar Ao Vivo
                </span>
                {comprasFortesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    {comprasFortesCount} Compras Fortes
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 mt-1">
                {currentOpportunity ? (
                  <>
                    Ativo exibido no gráfico: <strong className="text-white font-mono">{currentOpportunity.ticker}</strong> ({currentOpportunity.nome}) — Setup:{' '}
                    <span className="text-[#00E6A0] font-bold">{currentOpportunity.setup}</span> (Score {currentOpportunity.score}%).
                  </>
                ) : (
                  <>
                    Selecione qualquer oportunidade da lista abaixo para carregar o estudo gráfico completo de IA na capa.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Botões de Ação & Controles da Lista */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Toggle Cards / Tabela */}
            <div className="flex items-center bg-[#14221A] border border-[#22382B] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-[#00E6A0] text-[#0A100D] font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-[#00E6A0] text-[#0A100D] font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Visualização em Tabela Resumida"
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Tabela</span>
              </button>
            </div>

            {/* Modal com todas as oportunidades */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#14221A] hover:bg-[#1A2E23] border border-[#22382B] text-zinc-200 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Abrir busca completa de oportunidades"
            >
              <Search className="w-3.5 h-3.5 text-[#00E6A0]" />
              <span className="hidden sm:inline">Buscar</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#00E6A0]/20 text-[#00E6A0] text-[10px] font-black">
                {opportunities.length}
              </span>
            </button>

            {/* Botão para Scanner Completo */}
            <button
              type="button"
              onClick={onGoToScanner}
              className="px-3 py-1.5 rounded-xl bg-[#14221A] hover:bg-[#1A2E23] border border-[#22382B] text-zinc-300 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1"
              title="Ir para a aba de Varredura Completa"
            >
              <span className="hidden md:inline">Scanner Completo</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Botão de Recolher / Expandir a Lista da Capa */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl bg-[#14221A] hover:bg-[#1C3225] border border-[#22382B] text-zinc-300 hover:text-white transition cursor-pointer"
              title={isCollapsed ? 'Expandir Lista de Oportunidades' : 'Recolher Lista de Oportunidades'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-[#00E6A0]" />
              ) : (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos (quando não colapsado) */}
        {!isCollapsed && (
          <div className="mt-4 pt-3 border-t border-[#182C20] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 whitespace-nowrap mr-1">
                <Filter className="w-3 h-3 text-[#00E6A0]" />
                Filtrar:
              </span>

              {[
                { id: 'TODOS' as FilterCategory, label: `Todas (${opportunities.length})` },
                {
                  id: 'COMPRA_FORTE' as FilterCategory,
                  label: `Compra Forte (${comprasFortesCount})`,
                },
                {
                  id: 'B3' as FilterCategory,
                  label: `Ações B3 (${opportunities.filter((o) => o.categoria === 'B3' && o.classe === 'Ação').length})`,
                },
                {
                  id: 'EUA' as FilterCategory,
                  label: `EUA (${opportunities.filter((o) => o.categoria === 'EUA').length})`,
                },
                {
                  id: 'BDR' as FilterCategory,
                  label: `BDRs (${opportunities.filter((o) => o.classe === 'BDR').length})`,
                },
                {
                  id: 'ETF' as FilterCategory,
                  label: `ETFs (${opportunities.filter((o) => o.classe === 'ETF').length})`,
                },
                {
                  id: 'SOBREVENDA' as FilterCategory,
                  label: `Sobrevenda IS (${opportunities.filter((o) => (o.indiceSobrevenda ?? 0) >= 70 || o.ifr2 <= 25).length})`,
                },
              ].map((filterItem) => {
                const isActive = activeFilter === filterItem.id;
                return (
                  <button
                    key={filterItem.id}
                    type="button"
                    onClick={() => setActiveFilter(filterItem.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm'
                        : 'bg-[#121E17] hover:bg-[#182B20] text-zinc-300 hover:text-white border border-[#203628]'
                    }`}
                  >
                    {filterItem.label}
                  </button>
                );
              })}
            </div>

            {/* Aviso da quantidade exibida */}
            <div className="text-[11px] text-zinc-400 text-right whitespace-nowrap">
              Exibindo {displayedOpportunities.length} de {filteredList.length} oportunidades
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo da Lista de Oportunidades (quando não colapsado) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5">
          {isLoadingOpportunities ? (
            <div className="py-12 text-center text-zinc-400 space-y-3">
              <Radar className="w-8 h-8 text-[#00E6A0] animate-spin mx-auto" />
              <p className="text-sm font-semibold">Carregando oportunidades da varredura...</p>
            </div>
          ) : displayedOpportunities.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 space-y-2">
              <Target className="w-7 h-7 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold">Nenhuma oportunidade encontrada com este filtro.</p>
              <button
                onClick={() => setActiveFilter('TODOS')}
                className="text-xs font-bold text-[#00E6A0] hover:underline cursor-pointer"
              >
                Limpar filtros e ver todas
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Modo 1: Cards Grid Responsivo */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {displayedOpportunities.map((op) => {
                const isSelected = op.ticker.toUpperCase() === currentTicker.toUpperCase();
                const isStrongBuy = op.sinal === 'COMPRA FORTE';

                return (
                  <div
                    key={op.ticker}
                    onClick={() => handleSelect(op.ticker, op.categoria)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#13261C] border-[#00E6A0] shadow-lg shadow-[#00E6A0]/10 ring-1 ring-[#00E6A0]/50'
                        : 'bg-[#101B15] hover:bg-[#14231B] border-[#1C3225] hover:border-[#00E6A0]/60'
                    }`}
                  >
                    {/* Tarja lateral indicadora de ativo na capa */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#00E6A0]" />
                    )}

                    <div>
                      {/* Topo do Card: Ticker, Nome, Cotação & Variação */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-lg font-black text-white group-hover:text-[#00E6A0] transition tracking-tight">
                              {op.ticker}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/50">
                              {op.classe || op.categoria}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#16271E] text-zinc-400 border border-[#23382B]">
                              {op.categoria === 'EUA' ? 'EUA' : 'B3'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[190px]">
                            {op.nome}
                          </p>
                        </div>

                        {/* Preço e Variação */}
                        <div className="text-right">
                          <p className="font-mono font-black text-white text-sm">
                            {op.categoria === 'EUA' ? '$' : 'R$'}{' '}
                            {op.preco.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                              op.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-rose-400'
                            }`}
                          >
                            {op.var_pct >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {op.var_pct >= 0 ? '+' : ''}
                            {op.var_pct}%
                          </p>
                        </div>
                      </div>

                      {/* Sinal, Score & Setup */}
                      <div className="mt-2.5 pt-2.5 border-t border-[#17271E] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isStrongBuy
                                ? 'bg-[#00E6A0]/15 text-[#00E6A0] border-[#00E6A0]/40'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            }`}
                          >
                            {isStrongBuy && <Flame className="w-3 h-3 text-[#00E6A0]" />}
                            {op.sinal}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400">Confluência:</span>
                            <span className="text-xs font-black text-white font-mono">
                              {op.score}%
                            </span>
                          </div>
                        </div>

                        {/* Barra de Score */}
                        <div className="w-full h-1 bg-[#15231A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-[#00E6A0] rounded-full"
                            style={{ width: `${Math.min(100, Math.max(10, op.score))}%` }}
                          />
                        </div>

                        {/* Nome do Setup Técnico */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-200 truncate pt-0.5">
                          <Sparkles className="w-3 h-3 text-[#00E6A0] shrink-0" />
                          <span className="truncate">{op.setup}</span>
                        </div>
                      </div>

                      {/* Gerenciamento de Risco: Stop Loss & Alvo */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] bg-[#0A120E] p-2 rounded-lg border border-[#16271E]">
                        <div>
                          <span className="text-zinc-500 text-[10px]">Stop Loss:</span>
                          <p className="font-mono font-bold text-rose-400 text-xs">
                            {op.categoria === 'EUA' ? '$' : 'R$'} {op.stopLoss.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[10px]">Alvo Gain (1:1.5):</span>
                          <p className="font-mono font-bold text-[#00E6A0] text-xs">
                            {op.categoria === 'EUA' ? '$' : 'R$'} {op.alvoLucro.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Seleção para a Capa */}
                    <div className="mt-3 pt-2 border-t border-[#17271E]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(op.ticker, op.categoria);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1B3626] text-[#00E6A0] border border-[#00E6A0]/50 shadow-sm'
                            : 'bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D] shadow-md shadow-[#00E6A0]/15 active:scale-98'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00E6A0]" />
                            <span>Ativo em Análise na Capa</span>
                          </>
                        ) : (
                          <>
                            <Radar className="w-3.5 h-3.5" />
                            <span>Analisar no Gráfico da Capa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Modo 2: Tabela Compacta de Melhores Oportunidades */
            <div className="overflow-x-auto border border-[#1C3225] rounded-xl bg-[#0B1410]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A2E22] bg-[#0F1B15] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Ativo</th>
                    <th className="py-2.5 px-3">Preço & Var%</th>
                    <th className="py-2.5 px-3">Setup Técnico</th>
                    <th className="py-2.5 px-3">Sinal & Score</th>
                    <th className="py-2.5 px-3">Stop Loss</th>
                    <th className="py-2.5 px-3">Alvo Gain</th>
                    <th className="py-2.5 px-3 text-center">Ação na Capa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17271E] text-xs">
                  {displayedOpportunities.map((op) => {
                    const isSelected = op.ticker.toUpperCase() === currentTicker.toUpperCase();
                    return (
                      <tr
                        key={op.ticker}
                        onClick={() => handleSelect(op.ticker, op.categoria)}
                        className={`hover:bg-[#13231B] transition cursor-pointer ${
                          isSelected ? 'bg-[#152B1E]/80 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-white">{op.ticker}</span>
                            <span className="text-[9px] px-1 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
                              {op.classe || op.categoria}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#00E6A0] text-[#0A100D]">
                                Capa
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 block truncate max-w-[140px]">
                            {op.nome}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          <div className="font-bold text-white">
                            {op.categoria === 'EUA' ? '$' : 'R$'} {op.preco.toFixed(2)}
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              op.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-rose-400'
                            }`}
                          >
                            {op.var_pct >= 0 ? '+' : ''}
                            {op.var_pct}%
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="text-xs font-semibold text-zinc-200 block truncate max-w-[190px]">
                            {op.setup}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            IFR2: {op.ifr2} | RSI14: {op.rsi14}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              op.sinal === 'COMPRA FORTE'
                                ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
                                : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                            }`}
                          >
                            {op.sinal}
                          </span>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            Score {op.score}%
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-rose-400 text-xs">
                          {op.categoria === 'EUA' ? '$' : 'R$'} {op.stopLoss.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[#00E6A0] text-xs font-bold">
                          {op.categoria === 'EUA' ? '$' : 'R$'} {op.alvoLucro.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(op.ticker, op.categoria);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#183323] text-[#00E6A0] border border-[#00E6A0]/40'
                                : 'bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D]'
                            }`}
                          >
                            {isSelected ? 'Na Capa' : 'Analisar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé da Seção: Alternar entre Top 6 e Ver Todas */}
          {filteredList.length > 6 && (
            <div className="mt-3 pt-3 border-t border-[#182C20] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowAllInline(!showAllInline)}
                className="text-[#00E6A0] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {showAllInline ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Mostrar apenas as 6 Melhores
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Ver todas as {filteredList.length} melhores oportunidades nesta tela
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
              >
                Busca Avançada com Filtros
                <ChevronRight className="w-3.5 h-3.5 text-[#00E6A0]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Busca Completa de Oportunidades */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D1612] border border-[#1E3527] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E3025] flex items-center justify-between bg-[#101B15]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 flex items-center justify-center">
                  <Radar className="w-5 h-5 text-[#00E6A0]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Todas as Oportunidades do Radar
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Clique em qualquer oportunidade para carregá-la na capa com gráfico e análise de IA.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#14201A] text-zinc-400 hover:text-white border border-[#22332B] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-3.5 sm:p-4 bg-[#0A120E] border-b border-[#192A20] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar por ticker, empresa ou setup..."
                    className="w-full bg-[#132019] border border-[#22362A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E6A0]"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 whitespace-nowrap">
                    <Filter className="w-3 h-3 text-[#00E6A0]" />
                    Filtrar:
                  </span>
                  {[
                    { id: 'TODOS' as FilterCategory, label: `Todas (${opportunities.length})` },
                    {
                      id: 'COMPRA_FORTE' as FilterCategory,
                      label: `Compra Forte (${comprasFortesCount})`,
                    },
                    {
                      id: 'B3' as FilterCategory,
                      label: `Ações B3`,
                    },
                    {
                      id: 'EUA' as FilterCategory,
                      label: `EUA`,
                    },
                    {
                      id: 'BDR' as FilterCategory,
                      label: `BDRs`,
                    },
                    {
                      id: 'ETF' as FilterCategory,
                      label: `ETFs`,
                    },
                    {
                      id: 'SOBREVENDA' as FilterCategory,
                      label: `Sobrevenda IS`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        activeFilter === f.id
                          ? 'bg-[#00E6A0] text-[#0A100D]'
                          : 'bg-[#14201A] text-zinc-300 hover:text-white border border-[#203327]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body: Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5">
              {filteredList.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 space-y-2">
                  <Target className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold">Nenhuma oportunidade corresponde aos filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredList.map((op) => {
                    const isCurrent = op.ticker.toUpperCase() === currentTicker.toUpperCase();

                    return (
                      <div
                        key={op.ticker}
                        onClick={() => handleSelect(op.ticker, op.categoria)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-[#15271D] border-[#00E6A0] shadow-md shadow-[#00E6A0]/10'
                            : 'bg-[#101A14] hover:bg-[#15231B] border-[#1E3327] hover:border-[#00E6A0]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-black text-white group-hover:text-[#00E6A0] transition">
                                  {op.ticker}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/50">
                                  {op.classe || op.categoria}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00E6A0] text-[#0A100D] flex items-center gap-1 shadow-sm">
                                    <Check className="w-3 h-3" />
                                    Ativa na Capa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[220px]">
                                {op.nome}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-mono font-bold text-white text-sm">
                                {op.categoria === 'EUA' ? '$' : 'R$'} {op.preco.toFixed(2)}
                              </p>
                              <p
                                className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                                  op.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-red-400'
                                }`}
                              >
                                {op.var_pct >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {op.var_pct >= 0 ? '+' : ''}
                                {op.var_pct}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-[#17271E] flex items-center justify-between gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                op.sinal === 'COMPRA FORTE'
                                  ? 'bg-[#00E6A0]/15 text-[#00E6A0] border-[#00E6A0]/30'
                                  : 'bg-[#15231A] text-zinc-300 border-[#23382B]'
                              }`}
                            >
                              {op.setup}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400">Score:</span>
                              <span className="text-xs font-black text-white font-mono">
                                {op.score}%
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] bg-[#0B130F] p-2 rounded-lg border border-[#16251C]">
                            <div>
                              <span className="text-zinc-500">Stop Loss:</span>{' '}
                              <span className="font-semibold text-red-400 font-mono">
                                {op.categoria === 'EUA' ? '$' : 'R$'} {op.stopLoss.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Alvo Lucro:</span>{' '}
                              <span className="font-semibold text-[#00E6A0] font-mono">
                                {op.categoria === 'EUA' ? '$' : 'R$'} {op.alvoLucro.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(op.ticker, op.categoria);
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isCurrent
                                ? 'bg-[#1C3325] text-[#00E6A0] border border-[#00E6A0]/40'
                                : 'bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D] shadow-md shadow-[#00E6A0]/15'
                            }`}
                          >
                            {isCurrent ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Já Selecionada na Capa</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Exibir esta Ação na Capa</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-[#101B15] border-t border-[#1E3025] flex items-center justify-between text-xs text-zinc-400">
              <span>{filteredList.length} oportunidades no radar</span>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  onGoToScanner();
                }}
                className="text-[#00E6A0] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Abrir Scanner Detalhado
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
