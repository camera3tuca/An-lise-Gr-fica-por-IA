import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Radar,
  RefreshCw,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Flame,
  Info,
  Eye,
  BarChart2,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Check,
} from 'lucide-react';
import { OpportunityItem, ScannerSummary } from '../types';
import { OpportunityDetailModal } from './OpportunityDetailModal';

interface Props {
  onSelectTicker: (ticker: string, market: 'B3' | 'EUA') => void;
}

const SECTOR_BADGES: Record<string, { badgeClass: string; dotColor: string }> = {
  'Financeiro & Bancos': { badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  'Petróleo & Gás': { badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dotColor: 'bg-amber-400' },
  'Mineração & Materiais': { badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30', dotColor: 'bg-orange-400' },
  'Tecnologia': { badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dotColor: 'bg-indigo-400' },
  'Consumo & Varejo': { badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dotColor: 'bg-rose-400' },
  'Energia & Saneamento': { badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', dotColor: 'bg-yellow-400' },
  'Saúde': { badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30', dotColor: 'bg-teal-400' },
  'Transporte & Indústria': { badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dotColor: 'bg-sky-400' },
  'Telecom & Mídia': { badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dotColor: 'bg-purple-400' },
  'ETFs & Índices': { badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30', dotColor: 'bg-blue-400' },
  'Fundos Imobiliários': { badgeClass: 'bg-lime-500/15 text-lime-300 border-lime-500/30', dotColor: 'bg-lime-400' },
  'Criptoativos': { badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', dotColor: 'bg-cyan-400' },
};

function getSectorStyle(sector?: string) {
  if (!sector) return { badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700', dotColor: 'bg-zinc-400' };
  return SECTOR_BADGES[sector] || { badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700', dotColor: 'bg-zinc-400' };
}

export const OpportunitiesScannerView: React.FC<Props> = ({ onSelectTicker }) => {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [summary, setSummary] = useState<ScannerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | 'B3' | 'EUA' | 'Cripto'>('Todos');
  const [classFilter, setClassFilter] = useState<'Todas' | 'Ação' | 'BDR' | 'ETF' | 'FII' | 'Cripto'>('Todas');
  const [sectorFilter, setSectorFilter] = useState<string>('Todos');
  const [signalFilter, setSignalFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // AI reading over the whole scanned universe
  const [aiScanText, setAiScanText] = useState<string | null>(null);
  const [aiScanLoading, setAiScanLoading] = useState(false);

  // Guide panel toggle state
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Selected Opportunity for the Chart & Details Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchScannerData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/market/scanner?category=Todos${force ? '&force=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Falha ao obter varredura de mercado');
      }
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setSummary(data.summary || null);
      setLastUpdated(data.lastUpdated || new Date().toLocaleTimeString('pt-BR'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar varredura.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScannerData(false);
  }, [fetchScannerData]);

  // Ask the AI to review the scanned universe and highlight the best setups.
  const runAiScan = useCallback(async () => {
    setAiScanLoading(true);
    try {
      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'Português', limit: 12 }),
      });
      const data = await res.json();
      if (data.needsScan) {
        setAiScanText('Rode a varredura primeiro (botão "Escanear Agora") para a IA analisar as oportunidades.');
      } else {
        setAiScanText(data.analysis || 'A IA não retornou análise.');
      }
    } catch {
      setAiScanText('Não foi possível gerar a análise por IA agora.');
    } finally {
      setAiScanLoading(false);
    }
  }, []);

  // Unique sectors from current opportunities
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.setor) set.add(o.setor);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Filter opportunities based on category, class, sector, signal and text search
  const filteredOpportunities = opportunities.filter((op) => {
    if (categoryFilter !== 'Todos' && op.categoria !== categoryFilter) {
      return false;
    }
    if (classFilter !== 'Todas' && op.classe !== classFilter) {
      return false;
    }
    if (sectorFilter !== 'Todos' && op.setor !== sectorFilter) {
      return false;
    }
    if (signalFilter === 'COMPRAS' && !(op.sinal === 'COMPRA FORTE' || op.sinal === 'COMPRA')) {
      return false;
    }
    if (signalFilter === 'COMPRA_FORTE' && op.sinal !== 'COMPRA FORTE') {
      return false;
    }
    if (signalFilter === 'IS_SOBREVENDA' && (op.indiceSobrevenda ?? 0) < 70) {
      return false;
    }
    if (signalFilter === 'GOLDEN_ZONE' && !op.isGoldenZone) {
      return false;
    }
    if (signalFilter === 'IFR2' && !op.setup.toLowerCase().includes('ifr2')) {
      return false;
    }
    if (signalFilter === 'PULLBACK' && !op.setup.toLowerCase().includes('pullback')) {
      return false;
    }
    if (signalFilter === 'VENDAS' && op.sinal !== 'VENDA') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        op.ticker.toLowerCase().includes(q) ||
        op.nome.toLowerCase().includes(q) ||
        op.setup.toLowerCase().includes(q) ||
        (op.setor && op.setor.toLowerCase().includes(q)) ||
        (op.classe && op.classe.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Top highlight cards
  const topOpportunity = opportunities[0];
  const topSobrevenda = opportunities.find((o) => (o.indiceSobrevenda ?? 0) >= 70);
  const topGoldenZone = opportunities.find((o) => o.isGoldenZone);

  const handleOpenOpportunityDetail = (op: OpportunityItem) => {
    setSelectedOpportunity(op);
    setIsDetailModalOpen(true);
  };

  const handleNextOpportunity = () => {
    if (!selectedOpportunity || filteredOpportunities.length === 0) return;
    const currentIndex = filteredOpportunities.findIndex(
      (o) => o.ticker === selectedOpportunity.ticker
    );
    if (currentIndex < filteredOpportunities.length - 1) {
      setSelectedOpportunity(filteredOpportunities[currentIndex + 1]);
    } else {
      setSelectedOpportunity(filteredOpportunities[0]);
    }
  };

  const handlePrevOpportunity = () => {
    if (!selectedOpportunity || filteredOpportunities.length === 0) return;
    const currentIndex = filteredOpportunities.findIndex(
      (o) => o.ticker === selectedOpportunity.ticker
    );
    if (currentIndex > 0) {
      setSelectedOpportunity(filteredOpportunities[currentIndex - 1]);
    } else {
      setSelectedOpportunity(filteredOpportunities[filteredOpportunities.length - 1]);
    }
  };

  const countComprasFortes = opportunities.filter((o) => o.sinal === 'COMPRA FORTE').length;
  const countSobrevenda = opportunities.filter((o) => (o.indiceSobrevenda ?? 0) >= 70).length;
  const countGoldenZone = opportunities.filter((o) => o.isGoldenZone).length;
  const countCompras = opportunities.filter((o) => o.sinal === 'COMPRA' || o.sinal === 'COMPRA FORTE').length;
  const countIFR2 = opportunities.filter((o) => o.setup.toLowerCase().includes('ifr2')).length;
  const countVendas = opportunities.filter((o) => o.sinal === 'VENDA').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Scanner Header & Guia Button */}
      <div className="bg-gradient-to-r from-[#0E1A14] via-[#12231A] to-[#0A1828] border border-[#1E3A2B] rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00E6A0]/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-[#00E6A0]/15 border border-[#00E6A0]/30 flex items-center justify-center">
                <Radar className="w-4 h-4 text-[#00E6A0]" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#00E6A0] bg-[#00E6A0]/10 px-2.5 py-0.5 rounded-full border border-[#00E6A0]/20">
                Varredura Swing Trade em Tempo Real
              </span>
              <span className="text-[11px] font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-800/40">
                B3 • Ações • BDRs • ETFs • FIIs
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Scanner de Todas as Oportunidades
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Varredura algorítmica baseada em <strong>Índice de Sobrevenda (IS)</strong>, <strong>Estocástico</strong>, <strong>Retração de Fibonacci (Golden Zone 61.8%)</strong> e <strong>Triple Screen de Alexander Elder</strong>. Clique em qualquer ativo para abrir imediatamente o gráfico com planos de Stop e Alvo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            {lastUpdated && (
              <div className="text-left sm:text-right text-[11px] text-zinc-400">
                <p>Última Varredura:</p>
                <p className="font-semibold text-white">{lastUpdated}</p>
              </div>
            )}

            {/* Guia Toggle Button */}
            <button
              id="btn-toggle-guide"
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
              title="Exibir ou ocultar metodologia de varredura quantitativa"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Guia Metodológico</span>
              {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Analyze all opportunities with AI */}
            <button
              onClick={runAiScan}
              disabled={aiScanLoading || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#14201A] border border-[#00E6A0]/40 text-[#00E6A0] font-bold text-xs tracking-wide hover:bg-[#00E6A0]/10 active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="A IA revisa todos os ativos varridos e destaca os melhores setups"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiScanLoading ? 'animate-pulse' : ''}`} />
              {aiScanLoading ? 'Analisando...' : 'Analisar com IA'}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchScannerData(true)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] text-[#0A100D] font-bold text-xs tracking-wide hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-[#00E6A0]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Escaneando...' : 'Escanear Agora'}
            </button>
          </div>
        </div>

        {/* Guia Expandable Section */}
        {isGuideOpen && (
          <div className="mt-5 pt-4 border-t border-[#1C3627] animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-[#00E6A0]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Guia Técnico de Metodologias da Varredura
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Card 1: Índice de Sobrevenda */}
              <div className="bg-[#0B1510]/80 p-3 rounded-xl border border-blue-500/30 shadow-sm">
                <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Índice de Sobrevenda (IS)
                </h4>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  Média harmônica combinada do <strong>RSI(14)</strong> e <strong>Estocástico(14)</strong>. Valores <strong className="text-[#00E6A0]">&gt; 70</strong> indicam exaustão vendedora e alto potencial de repique técnico.
                </p>
              </div>

              {/* Card 2: RSI & Estocástico */}
              <div className="bg-[#0B1510]/80 p-3 rounded-xl border border-emerald-500/30 shadow-sm">
                <h4 className="font-bold text-[#00E6A0] mb-1 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#00E6A0]" />
                  RSI &amp; Estocástico
                </h4>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  <strong>RSI &lt; 30</strong> e <strong>Estocástico &lt; 20</strong> confirmam sobrevenda técnica extrema. Cruzamentos das linhas %K e %D para cima geram gatilho imediato de compra.
                </p>
              </div>

              {/* Card 3: Fibonacci 61.8% Golden Zone */}
              <div className="bg-[#0B1510]/80 p-3 rounded-xl border border-amber-500/30 shadow-sm">
                <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Fibonacci (61.8% Golden Zone)
                </h4>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  A retração de <strong>61.8%</strong> representa a mais forte região de suporte matemático para continuação da tendência primária de alta em papéis fortes.
                </p>
              </div>

              {/* Card 4: Triple Screen */}
              <div className="bg-[#0B1510]/80 p-3 rounded-xl border border-purple-500/30 shadow-sm">
                <h4 className="font-bold text-purple-400 mb-1 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Triple Screen (Alexander Elder)
                </h4>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  <strong>1ª Tela</strong> (Maré: EMA13), <strong>2ª Tela</strong> (Onda: oscilador contra a maré) e <strong>3ª Tela</strong> (Execução: Buy Stop no topo do candle anterior).
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#162B1F] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-zinc-400">
              <span>Metodologias quantitativas aplicadas aos ativos da B3 (Ações, BDRs, ETFs e FIIs).</span>
              <span className="text-[#00E6A0] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00E6A0]" />
                Risco Controlado: Stop Loss Técnico (2x ATR) e Alvo Simétrico (1:1.5)
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI reading over the scanned universe */}
      {(aiScanText || aiScanLoading) && (
        <div className="bg-[#14201A] border border-[#22332B] rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#22332B] pb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E6A0]/10 border border-[#00E6A0]/30 flex items-center justify-center text-[#00E6A0]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Panorama das Oportunidades por IA</h3>
              <p className="text-[11px] text-[#8FA79B]">
                A IA revisa os ativos varridos e destaca os melhores setups · Gemini 3.8 Flash
              </p>
            </div>
          </div>
          {aiScanLoading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-7 h-7 border-2 border-[#00E6A0] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8FA79B]">A IA está analisando as oportunidades varridas...</p>
            </div>
          ) : (
            <div className="text-xs leading-relaxed text-[#CDD9D3] whitespace-pre-line bg-[#0D1612] p-4 rounded-xl border border-[#1E2E25]">
              {aiScanText}
            </div>
          )}
        </div>
      )}

      {/* Highlights Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Top Confluence */}
        {topOpportunity && (
          <div
            onClick={() => handleOpenOpportunityDetail(topOpportunity)}
            className="group cursor-pointer bg-[#0D1612] hover:bg-[#121F19] border border-[#1F3327] hover:border-[#00E6A0]/50 rounded-xl p-4 transition-all duration-200 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00E6A0]">
                <Flame className="w-3.5 h-3.5 text-[#00E6A0]" />
                Maior Confluência
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
                Score {topOpportunity.score}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-[#00E6A0] transition">
                  {topOpportunity.ticker}
                </h3>
                <p className="text-[11px] text-zinc-400">{topOpportunity.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {topOpportunity.preco.toFixed(2)}
                </p>
                <p className={`text-[11px] font-semibold flex items-center justify-end ${
                  topOpportunity.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-red-400'
                }`}>
                  {topOpportunity.var_pct >= 0 ? '+' : ''}{topOpportunity.var_pct}%
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1F3327] flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px] truncate max-w-[190px]">
                {topOpportunity.setup}
              </span>
              <span className="text-[11px] font-bold text-[#00E6A0] flex items-center gap-1 group-hover:underline">
                <Eye className="w-3 h-3" /> Ver Gráfico &amp; Detalhes
              </span>
            </div>
          </div>
        )}

        {/* Card 2: Exaustão Vendedora (IS > 70) */}
        {topSobrevenda && (
          <div
            onClick={() => handleOpenOpportunityDetail(topSobrevenda)}
            className="group cursor-pointer bg-[#0D1612] hover:bg-[#121F19] border border-[#1F3327] hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Exaustão Vendedora (IS)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                IS: {topSobrevenda.indiceSobrevenda} / 100
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition">
                  {topSobrevenda.ticker}
                </h3>
                <p className="text-[11px] text-zinc-400">{topSobrevenda.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {topSobrevenda.preco.toFixed(2)}
                </p>
                <p className="text-[11px] font-semibold text-blue-300">
                  RSI: {topSobrevenda.rsi14} | Stoch: {topSobrevenda.stochK ?? 20}%
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1F3327] flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px] truncate max-w-[190px]">
                {topSobrevenda.setup}
              </span>
              <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1 group-hover:underline">
                <Eye className="w-3 h-3" /> Ver Gráfico &amp; Detalhes
              </span>
            </div>
          </div>
        )}

        {/* Card 3: Fibonacci 61.8% Golden Zone */}
        {topGoldenZone ? (
          <div
            onClick={() => handleOpenOpportunityDetail(topGoldenZone)}
            className="group cursor-pointer bg-[#0D1612] hover:bg-[#121F19] border border-[#1F3327] hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Golden Zone (61.8% Fibo)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Fibo R$ {topGoldenZone.fib618?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition">
                  {topGoldenZone.ticker}
                </h3>
                <p className="text-[11px] text-zinc-400">{topGoldenZone.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {topGoldenZone.preco.toFixed(2)}
                </p>
                <p className="text-[11px] font-semibold text-[#00E6A0]">
                  Alvo: R$ {topGoldenZone.alvoLucro.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1F3327] flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px] truncate max-w-[190px]">
                {topGoldenZone.setup}
              </span>
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 group-hover:underline">
                <Eye className="w-3 h-3" /> Ver Gráfico &amp; Detalhes
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D1612] border border-[#1F3327] rounded-xl p-4 flex flex-col justify-between shadow-md">
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <Target className="w-3.5 h-3.5 text-[#00E6A0]" />
                Estatísticas da Varredura
              </span>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-[#13201A] p-2 rounded-lg border border-[#1F3327]">
                  <p className="text-xs text-zinc-400">Ativos</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{opportunities.length}</p>
                </div>
                <div className="bg-[#13201A] p-2 rounded-lg border border-[#1F3327]">
                  <p className="text-xs text-[#00E6A0]">Compras</p>
                  <p className="text-base font-extrabold text-[#00E6A0] mt-0.5">
                    {countCompras}
                  </p>
                </div>
                <div className="bg-[#13201A] p-2 rounded-lg border border-[#1F3327]">
                  <p className="text-xs text-red-400">Vendas</p>
                  <p className="text-base font-extrabold text-red-400 mt-0.5">{countVendas}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#00E6A0]" />
              Filtro ativo de risco: Risco/Retorno mínimo de 1:1.5
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar with Sectors and Classes */}
      <div className="bg-[#0D1612] border border-[#1E2E25] rounded-xl p-3.5 space-y-3 shadow-md">
        {/* Row 1: Category & Asset Class & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            {(['Todos', 'B3', 'EUA', 'Cripto'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm shadow-[#00E6A0]/20'
                    : 'text-zinc-400 hover:text-white bg-[#14201A] hover:bg-[#1A2C23]'
                }`}
              >
                {cat === 'Todos' ? `Todos os Mercados (${opportunities.length})` : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ticker, nome, setor ou setup..."
              className="w-full bg-[#14201A] border border-[#22332B] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E6A0]"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Row 2: Classes de Ativos & Filtro de Setor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#17271E]">
          {/* Asset Classes pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3 h-3 text-[#38BDF8]" />
              Classe:
            </span>
            {(['Todas', 'Ação', 'BDR', 'ETF', 'FII', 'Cripto'] as const).map((cl) => (
              <button
                key={cl}
                onClick={() => setClassFilter(cl)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                  classFilter === cl
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-[#121E18] text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {cl}
              </button>
            ))}
          </div>

          {/* Sector Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">
              Setor:
            </span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#14201A] border border-[#22332B] rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-[#00E6A0] cursor-pointer"
            >
              <option value="Todos">Todos os Setores ({opportunities.length})</option>
              {availableSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} ({opportunities.filter((o) => o.setor === sec).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Signal Quick Filter Chips (incluindo IS e Golden Zone) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#17271E]">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1 whitespace-nowrap">
            <Filter className="w-3 h-3 text-[#00E6A0]" />
            Metodologia:
          </span>
          {[
            { id: 'TODOS', label: `Todos (${opportunities.length})` },
            { id: 'IS_SOBREVENDA', label: `Exaustão IS > 70 (${countSobrevenda})` },
            { id: 'GOLDEN_ZONE', label: `Golden Zone 61.8% (${countGoldenZone})` },
            { id: 'COMPRA_FORTE', label: `Compras Fortes (${countComprasFortes})` },
            { id: 'COMPRAS', label: `Todas as Compras (${countCompras})` },
            { id: 'IFR2', label: `Setup IFR2 (${countIFR2})` },
            { id: 'VENDAS', label: `Vendas (${countVendas})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSignalFilter(chip.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                signalFilter === chip.id
                  ? 'bg-[#1D3528] text-[#00E6A0] border border-[#00E6A0]/40'
                  : 'bg-[#121E18] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F1C16] border border-[#1C3627] text-xs text-zinc-300">
        <span className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-[#00E6A0] shrink-0" />
          <span>
            <strong>Dica:</strong> Clique em qualquer ativo da lista para abrir o <strong>gráfico interativo com linhas de Entrada, Stop Loss e Alvo de Lucro</strong>, além de todos os indicadores técnicos da varredura.
          </span>
        </span>
        <span className="text-[11px] font-bold text-[#00E6A0] shrink-0 hidden sm:inline">
          {filteredOpportunities.length} oportunidades filtradas
        </span>
      </div>

      {/* Opportunities Table */}
      <div className="bg-[#0D1612] border border-[#1E2E25] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E2E25] bg-[#0A120E] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Ativo & Setor</th>
                <th className="py-3 px-4">Preço Atual</th>
                <th className="py-3 px-4">Setup Detectado</th>
                <th className="py-3 px-4">Pilares Técnicos (Guia)</th>
                <th className="py-3 px-4">Sinal & Score</th>
                <th className="py-3 px-4">Stop Loss (2x ATR)</th>
                <th className="py-3 px-4">Alvo Gain (1:1.5)</th>
                <th className="py-3 px-4 text-center">Gráfico & Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2820] text-xs">
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    <p className="text-sm font-semibold">Nenhuma oportunidade encontrada para os filtros selecionados.</p>
                    <p className="text-xs text-zinc-500 mt-1">Experimente alterar a classe, setor ou filtro de metodologia.</p>
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((op) => {
                  const isBuy = op.sinal === 'COMPRA FORTE' || op.sinal === 'COMPRA';
                  const isStrongBuy = op.sinal === 'COMPRA FORTE';
                  const isSell = op.sinal === 'VENDA';
                  const sectorStyle = getSectorStyle(op.setor);

                  return (
                    <tr
                      key={op.ticker}
                      className="hover:bg-[#121F18] transition-colors group cursor-pointer"
                      onClick={() => handleOpenOpportunityDetail(op)}
                    >
                      {/* Ativo & Setor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-white group-hover:text-[#00E6A0] transition">
                            {op.ticker}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/50">
                            {op.classe || op.categoria}
                          </span>
                          {op.isRealData && (
                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-[#00E6A0]/10 text-[#00E6A0]">
                              Real
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[140px] mt-0.5">{op.nome}</p>
                        {op.setor && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border ${sectorStyle.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sectorStyle.dotColor}`} />
                              {op.setor}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Preço & Variação */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-white">R$ {op.preco.toFixed(2)}</p>
                        <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                          op.var_pct >= 0 ? 'text-[#00E6A0]' : 'text-red-400'
                        }`}>
                          {op.var_pct >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {op.var_pct >= 0 ? '+' : ''}{op.var_pct}%
                        </p>
                      </td>

                      {/* Setup Detectado */}
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          op.setup.includes('IFR2')
                            ? 'bg-[#0066FF]/15 text-[#38BDF8] border-[#0066FF]/30'
                            : op.setup.includes('Pullback')
                            ? 'bg-[#00E6A0]/15 text-[#00E6A0] border-[#00E6A0]/30'
                            : 'bg-[#192A20] text-zinc-300 border-[#273E31]'
                        }`}>
                          {op.setup}
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 max-w-[200px]">
                          {op.detalhes}
                        </p>
                      </td>

                      {/* Pilares Técnicos (Guia) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {/* IS Indicator */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 font-semibold">IS:</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              (op.indiceSobrevenda ?? 0) >= 70
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'text-zinc-300'
                            }`}>
                              {op.indiceSobrevenda ?? 50}/100
                            </span>
                            {(op.indiceSobrevenda ?? 0) >= 70 && (
                              <span className="text-[9px] text-blue-400 font-extrabold uppercase">Exaustão</span>
                            )}
                          </div>

                          {/* Fibonacci 61.8% */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400 font-semibold">Fibo:</span>
                            {op.isGoldenZone ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Golden 61.8%
                              </span>
                            ) : op.fib618 ? (
                              <span className="text-[10px] text-zinc-400">R$ {op.fib618.toFixed(2)}</span>
                            ) : (
                              <span className="text-[10px] text-zinc-500">-</span>
                            )}
                          </div>

                          {/* Triple Screen Alexander Elder */}
                          {op.tripleScreen && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-zinc-400">Elder:</span>
                              <span className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                                op.tripleScreen.tela1.toLowerCase().includes('alta') || op.tripleScreen.status === 'COMPRA'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {op.tripleScreen.tela1.toLowerCase().includes('alta') ? 'Maré Alta' : op.tripleScreen.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sinal & Score */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isStrongBuy
                            ? 'bg-[#00E6A0] text-[#0A100D] shadow-sm shadow-[#00E6A0]/30 animate-pulse'
                            : isBuy
                            ? 'bg-[#00E6A0]/20 text-[#00E6A0] border border-[#00E6A0]/40'
                            : isSell
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {op.sinal}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-12 h-1.5 bg-[#192A20] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                op.score >= 85
                                  ? 'bg-gradient-to-r from-[#00E6A0] to-emerald-400'
                                  : op.score >= 70
                                  ? 'bg-[#0066FF]'
                                  : 'bg-zinc-500'
                              }`}
                              style={{ width: `${op.score}%` }}
                            />
                          </div>
                          <span className="font-bold text-[10px] text-zinc-300">{op.score}%</span>
                        </div>
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-red-400">R$ {op.stopLoss.toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-400">
                          {(((op.stopLoss - op.preco) / op.preco) * 100).toFixed(1)}%
                        </p>
                      </td>

                      {/* Alvo Gain */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-[#00E6A0]">R$ {op.alvoLucro.toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-400">
                          +{(((op.alvoLucro - op.preco) / op.preco) * 100).toFixed(1)}%
                        </p>
                      </td>

                      {/* Ação: Ver Gráfico e Detalhes */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOpportunityDetail(op);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#192A20] hover:bg-[#00E6A0] text-zinc-200 hover:text-[#0A100D] text-[11px] font-bold transition cursor-pointer group-hover:bg-[#00E6A0] group-hover:text-[#0A100D] shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Gráfico</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Guide on Setups */}
      <div className="bg-[#0D1612] border border-[#1E2E25] rounded-xl p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-[#00E6A0]" />
          Como Funciona o Scanner de Oportunidades Swing Trade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
          <div className="p-3 rounded-lg bg-[#14201A] border border-[#22332B]">
            <p className="font-bold text-[#38BDF8] mb-1">1. Setup IFR2 (Larry Connors)</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Desenvolvido pelo lendário trader Larry Connors. Seleciona ativos em forte tendência primária de alta (Preço &gt; SMA 200) que sofreram um recuo pontual severo (IFR 2 &le; 20). Proporciona entradas favoráveis no início de repiques altistas.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#14201A] border border-[#22332B]">
            <p className="font-bold text-[#00E6A0] mb-1">2. Pullback na Média Exponencial (EMA 21)</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Em tendências consolidadas, o preço tende a respirar e testar a média de 21 períodos como suporte dinâmico antes de retomar a alta. Excelente ponto de entrada com baixo risco financeiro.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#14201A] border border-[#22332B]">
            <p className="font-bold text-amber-300 mb-1">3. Gestão de Risco com Volatilidade Real (ATR)</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              O cálculo de Stop Loss (2x ATR) e Alvo de Lucro (3x ATR) garante que a ordem fique fora do ruído habitual do ativo e mantenha uma expectativa matemática positiva (relação ganho/perda de 1.5 ou superior).
            </p>
          </div>
        </div>
      </div>

      {/* Modal with Interactive Candlestick Chart & Complete Details */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onNext={handleNextOpportunity}
        onPrev={handlePrevOpportunity}
        currentIndex={
          selectedOpportunity
            ? filteredOpportunities.findIndex((o) => o.ticker === selectedOpportunity.ticker)
            : 0
        }
        totalCount={filteredOpportunities.length}
        onOpenFullAnalysis={onSelectTicker}
      />
    </div>
  );
};

