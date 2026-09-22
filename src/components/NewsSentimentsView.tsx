import React, { useState, useEffect } from 'react';
import { Newspaper, Search, RefreshCw, ExternalLink, ThumbsUp, ThumbsDown, Minus, Filter } from 'lucide-react';
import { NewsItem } from '../types';

export const NewsSentimentsView: React.FC = () => {
  const [query, setQuery] = useState('mercado financeiro');
  const [searchInput, setSearchInput] = useState('mercado financeiro');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState<'ALL' | 'Bullish' | 'Bearish' | 'Neutral'>('ALL');

  const fetchNews = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/news?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
      }
    } catch (e) {
      console.error('Erro ao carregar notícias:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
    }
  };

  const filteredNews = news.filter((n) => {
    if (filterSentiment === 'ALL') return true;
    return n.sentimento === filterSentiment;
  });

  // Sentiment counters
  const bullCount = news.filter((n) => n.sentimento === 'Bullish').length;
  const bearCount = news.filter((n) => n.sentimento === 'Bearish').length;
  const neutralCount = news.filter((n) => n.sentimento === 'Neutral').length;

  const getGlobalSentiment = () => {
    if (bullCount > bearCount && bullCount >= 2) return { label: 'Otimista (Bullish)', color: 'text-[#00E6A0]' };
    if (bearCount > bullCount && bearCount >= 2) return { label: 'Pessimista (Bearish)', color: 'text-[#FF5A5A]' };
    return { label: 'Neutro / Misto', color: 'text-zinc-300' };
  };

  const globalSentiment = getGlobalSentiment();

  return (
    <div className="space-y-4">
      {/* Header & Query Bar */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#00E6A0]" />
            Notícias & Sentimento de Mercado
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Análise algorítmica de manchetes e fluxo de sentimento
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar tema (ex: Ibovespa, Selic, PETR4)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#22332B] focus:border-[#00E6A0] text-xs text-white placeholder-zinc-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D] font-bold text-xs transition cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Global Sentiment Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Sentimento Geral</div>
            <div className={`text-sm font-bold ${globalSentiment.color}`}>{globalSentiment.label}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#14201A] border border-[#22332B] flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-[#00E6A0]" />
          </div>
        </div>

        <div className="bg-[#101914] rounded-xl border border-[#00E6A0]/20 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#00E6A0] font-medium">Otimistas</div>
            <div className="text-base font-mono font-bold text-white">{bullCount} manchetes</div>
          </div>
          <ThumbsUp className="w-4 h-4 text-[#00E6A0]" />
        </div>

        <div className="bg-[#101914] rounded-xl border border-[#FF5A5A]/20 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#FF5A5A] font-medium">Pessimistas</div>
            <div className="text-base font-mono font-bold text-white">{bearCount} manchetes</div>
          </div>
          <ThumbsDown className="w-4 h-4 text-[#FF5A5A]" />
        </div>

        <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Neutras</div>
            <div className="text-base font-mono font-bold text-white">{neutralCount} manchetes</div>
          </div>
          <Minus className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 text-xs">
        <Filter className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-400 text-[11px]">Filtrar por:</span>
        {[
          { key: 'ALL', label: 'Todas' },
          { key: 'Bullish', label: '🟢 Otimistas' },
          { key: 'Bearish', label: '🔴 Pessimistas' },
          { key: 'Neutral', label: '⚪ Neutras' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterSentiment(f.key as any)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
              filterSentiment === f.key
                ? 'bg-[#00E6A0] text-[#0A100D] font-bold shadow-sm'
                : 'bg-[#14201A] text-zinc-400 hover:text-white border border-[#22332B]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-14 text-center text-zinc-400 flex flex-col items-center gap-2 bg-[#101914] rounded-2xl border border-[#22332B]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00E6A0]" />
            <span className="text-xs">Buscando notícias e processando sentimento NLP...</span>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => {
            const isBull = item.sentimento === 'Bullish';
            const isBear = item.sentimento === 'Bearish';
            return (
              <div
                key={idx}
                className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 hover:border-[#00E6A0]/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#00E6A0]">{item.fonte}</span>
                    <span className="text-zinc-400 text-[11px]">· {item.publicado}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-100 hover:text-white leading-snug">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.titulo}
                    </a>
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      isBull
                        ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
                        : isBear
                        ? 'bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {item.sentimento}
                  </span>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#14201A] border border-[#22332B] text-zinc-400 hover:text-white transition"
                    title="Abrir matéria original"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs bg-[#101914] rounded-2xl border border-[#22332B]">
            Nenhuma notícia encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};
