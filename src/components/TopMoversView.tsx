import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketMover } from '../types';

interface MoversData {
  gainers: MarketMover[];
  losers: MarketMover[];
  category: string;
}

export const TopMoversView: React.FC = () => {
  const [category, setCategory] = useState<'Todos' | 'Cripto' | 'Ações BR' | 'Ações EUA'>('Todos');
  const [limit, setLimit] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [data, setData] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMovers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/movers?category=${encodeURIComponent(category)}&limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Erro ao buscar maiores altas e baixas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
  }, [category, limit]);

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Top Gainers & Losers
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ativos com maior variação percentual na sessão atual
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Chips */}
          <div className="flex bg-[#0A100D] p-1 rounded-xl border border-[#22332B] text-xs font-semibold">
            {(['Todos', 'Cripto', 'Ações BR', 'Ações EUA'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  category === cat
                    ? 'bg-[#00E6A0] text-[#0A100D] font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Limit Slider */}
          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-[#0A100D] px-3 py-1.5 rounded-xl border border-[#22332B]">
            <span>Qtd:</span>
            <input
              type="range"
              min="3"
              max="8"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-16 accent-[#00E6A0] cursor-pointer"
            />
            <span className="font-mono font-bold text-[#00E6A0]">{limit}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchMovers}
            disabled={loading}
            className="p-2 rounded-xl bg-[#14201A] border border-[#22332B] hover:bg-[#1A2C23] text-zinc-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00E6A0]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Gainers / Losers */}
      <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-2">
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'gainers'
              ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Maiores Altas (Gainers)</span>
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'losers'
              ? 'bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Maiores Baixas (Losers)</span>
        </button>
      </div>

      {/* Table Cards */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-zinc-400 flex flex-col items-center gap-2 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00E6A0]" />
            <span>Consultando dados de mercado ao vivo...</span>
          </div>
        ) : (
          <div className="divide-y divide-[#1B2921]">
            {activeTab === 'gainers' ? (
              data?.gainers && data.gainers.length > 0 ? (
                data.gainers.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 px-2 flex items-center justify-between hover:bg-[#14201A] transition rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono text-xs font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-extrabold text-sm text-white font-mono">{item.ticker}</span>
                        <span className="ml-2 text-[11px] text-zinc-400">
                          {item.ticker.includes('-') ? 'Cripto' : item.ticker.endsWith('.SA') ? 'B3' : 'EUA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-semibold text-zinc-300">
                        {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: item.ticker.endsWith('.SA') ? 'BRL' : 'USD' })}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 min-w-[76px] justify-center">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{item.var_pct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-zinc-400 text-xs">Nenhum dado disponível.</div>
              )
            ) : data?.losers && data.losers.length > 0 ? (
              data.losers.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3 px-2 flex items-center justify-between hover:bg-[#14201A] transition rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono text-xs font-bold text-zinc-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-sm text-white font-mono">{item.ticker}</span>
                      <span className="ml-2 text-[11px] text-zinc-400">
                        {item.ticker.includes('-') ? 'Cripto' : item.ticker.endsWith('.SA') ? 'B3' : 'EUA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-semibold text-zinc-300">
                      {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: item.ticker.endsWith('.SA') ? 'BRL' : 'USD' })}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30 min-w-[76px] justify-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {item.var_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-400 text-xs">Nenhum dado disponível.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
