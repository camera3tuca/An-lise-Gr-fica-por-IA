import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { MoverItem } from '../types';

interface TopMoversPageProps {
  onSelectTicker: (ticker: string) => void;
}

export const TopMoversPage: React.FC<TopMoversPageProps> = ({ onSelectTicker }) => {
  const [categoria, setCategoria] = useState<string>('Todos');
  const [quantidade, setQuantidade] = useState<number>(5);
  const [gainers, setGainers] = useState<MoverItem[]>([]);
  const [losers, setLosers] = useState<MoverItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'both' | 'gainers' | 'losers'>('both');

  const fetchMovers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/market/movers?categoria=${encodeURIComponent(categoria)}&qtde=${quantidade}`
      );
      if (res.ok) {
        const data = await res.json();
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
      }
    } catch (err) {
      console.error('Erro ao carregar top movers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
  }, [categoria, quantidade]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E25] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#EAF3EE] flex items-center gap-2">
            <span>📊</span> Top Gainers & Losers
          </h2>
          <p className="text-xs md:text-sm text-[#8FA79B] mt-1">
            Maiores altas e baixas recentes do mercado (fechamento anterior x última cotação)
          </p>
        </div>

        <button
          onClick={fetchMovers}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#182920] border border-[#22332B] hover:border-[#00E6A0]/40 text-[#00E6A0] text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Cotações</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-[#8FA79B] block mb-1">Categoria</label>
            <div className="flex rounded-lg bg-[#0D1612] p-1 border border-[#22332B]">
              {['Todos', 'Cripto', 'Ações BR', 'Ações EUA'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    categoria === cat
                      ? 'bg-[#00E6A0]/15 text-[#00E6A0]'
                      : 'text-[#8FA79B] hover:text-[#EAF3EE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8FA79B] block mb-1">
              Quantidade: <strong className="text-[#00E6A0]">{quantidade}</strong> por lado
            </label>
            <input
              type="range"
              min="3"
              max="8"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="accent-[#00E6A0] w-28 bg-[#0D1612] cursor-pointer"
            />
          </div>
        </div>

        {/* View Toggle on Mobile */}
        <div className="flex rounded-lg bg-[#0D1612] p-1 border border-[#22332B] md:hidden">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-2.5 py-1 text-xs rounded ${activeTab === 'both' ? 'bg-[#1E2E25] text-white' : 'text-[#8FA79B]'}`}
          >
            Ambos
          </button>
          <button
            onClick={() => setActiveTab('gainers')}
            className={`px-2.5 py-1 text-xs rounded ${activeTab === 'gainers' ? 'bg-[#00E6A0]/15 text-[#00E6A0]' : 'text-[#8FA79B]'}`}
          >
            Gainers
          </button>
          <button
            onClick={() => setActiveTab('losers')}
            className={`px-2.5 py-1 text-xs rounded ${activeTab === 'losers' ? 'bg-[#FF5A5A]/15 text-[#FF5A5A]' : 'text-[#8FA79B]'}`}
          >
            Losers
          </button>
        </div>
      </div>

      {/* Grid: Gainers & Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        {(activeTab === 'both' || activeTab === 'gainers') && (
          <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 md:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#00E6A0]/10 border border-[#00E6A0]/30 flex items-center justify-center text-[#00E6A0]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#00E6A0]">Top Gainers (Maiores Altas)</h3>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-[#8FA79B]">
                  <div className="w-6 h-6 border-2 border-[#00E6A0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando cotações...
                </div>
              ) : (
                <div className="divide-y divide-[#22332B]/60">
                  {gainers.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between hover:bg-[#18261F]/40 px-2 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => onSelectTicker(item.ticker)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6C8477] w-4">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-sm text-[#EAF3EE] group-hover:text-[#00E6A0] transition-colors flex items-center gap-1">
                            {item.ticker}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-[#EAF3EE]">
                          {item.preco.toFixed(2)}
                        </div>
                        <div className="font-mono font-bold text-xs text-[#00E6A0]">
                          +{item.var_pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[11px] text-[#6C8477] mt-4 pt-3 border-t border-[#22332B]">
              Dica: Clique em qualquer ativo para abrir a análise técnica detalhada.
            </div>
          </div>
        )}

        {/* Top Losers */}
        {(activeTab === 'both' || activeTab === 'losers') && (
          <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 md:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 flex items-center justify-center text-[#FF5A5A]">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#FF5A5A]">Top Losers (Maiores Baixas)</h3>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-[#8FA79B]">
                  <div className="w-6 h-6 border-2 border-[#FF5A5A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando cotações...
                </div>
              ) : (
                <div className="divide-y divide-[#22332B]/60">
                  {losers.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between hover:bg-[#18261F]/40 px-2 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => onSelectTicker(item.ticker)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6C8477] w-4">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-sm text-[#EAF3EE] group-hover:text-[#FF5A5A] transition-colors flex items-center gap-1">
                            {item.ticker}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-[#EAF3EE]">
                          {item.preco.toFixed(2)}
                        </div>
                        <div className="font-mono font-bold text-xs text-[#FF5A5A]">
                          {item.var_pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[11px] text-[#6C8477] mt-4 pt-3 border-t border-[#22332B]">
              Dica: Identifique ativos sobrevendidos com potencial repique técnico.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
