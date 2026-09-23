import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Building, Globe, Layers, X, ArrowRight } from 'lucide-react';

interface AssetResult {
  ticker: string;
  nome: string;
  categoria: 'B3' | 'EUA' | 'Cripto';
  classe: 'Ação' | 'BDR' | 'ETF' | 'FII' | 'Cripto';
  setor: string;
}

interface Props {
  currentTicker: string;
  marketType: 'B3' | 'EUA';
  onSelectAsset: (ticker: string, market: 'B3' | 'EUA') => void;
}

export const GlobalAssetSearch: React.FC<Props> = ({
  currentTicker,
  marketType,
  onSelectAsset,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AssetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search API fetch with debounce
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json && Array.isArray(json.results)) {
          setResults(json.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = (item: AssetResult) => {
    const targetMarket: 'B3' | 'EUA' = item.categoria === 'EUA' ? 'EUA' : 'B3';
    onSelectAsset(item.ticker, targetMarket);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const clean = query.trim().toUpperCase();
    const isUsMarket = marketType === 'EUA';
    onSelectAsset(clean, isUsMarket ? 'EUA' : 'B3');
    setQuery('');
    setIsOpen(false);
  };

  const getBadgeStyle = (classe: string, categoria: string) => {
    if (classe === 'BDR') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (classe === 'ETF') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (categoria === 'EUA') {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-[#00E6A0]/20 text-[#00E6A0] border-[#00E6A0]/30';
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={handleCustomSubmit} className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={
            marketType === 'B3'
              ? 'Buscar qualquer ativo (PETR4, NVDC34, BOVA11)...'
              : 'Buscar nos EUA (NVDA, AAPL, SPY, TSLA)...'
          }
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#14221A] border border-[#22382B] focus:border-[#00E6A0] focus:ring-1 focus:ring-[#00E6A0] text-xs text-white placeholder-zinc-500 outline-none transition font-sans shadow-inner"
        />
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0F1913] border border-[#1E3326] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {/* Header of dropdown */}
          <div className="p-2.5 bg-[#0A120E] border-b border-[#182A1F] flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Catálogo Completo B3 & EUA</span>
            <span>{results.length} sugestões</span>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-zinc-400">Buscando no mercado...</div>
          ) : results.length > 0 ? (
            <div className="p-1 space-y-0.5">
              {results.map((item) => {
                const isSelected = item.ticker.toUpperCase() === currentTicker.toUpperCase();
                return (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#15291F] border border-[#00E6A0]/40'
                        : 'hover:bg-[#15231A] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="font-mono font-bold text-xs text-white tracking-tight">
                        {item.ticker}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[170px] sm:max-w-[210px]">
                        {item.nome}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBadgeStyle(item.classe, item.categoria)}`}>
                        {item.classe}
                      </span>
                      <span className="text-[9px] font-semibold text-zinc-500 uppercase">
                        {item.categoria}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-zinc-400">
                Pressione <strong>Enter</strong> para buscar diretamente por "{query.toUpperCase()}"
              </p>
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="px-3 py-1 rounded-lg bg-[#00E6A0] text-[#0A100D] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Carregar ativo livre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
