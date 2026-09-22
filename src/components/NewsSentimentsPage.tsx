import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';
import { NewsItem } from '../types';

export const NewsSentimentsPage: React.FC = () => {
  const [query, setQuery] = useState<string>('Ibovespa');
  const [searchTerm, setSearchTerm] = useState<string>('Ibovespa');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'Bullish' | 'Bearish' | 'Neutral'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sentimentSummary, setSentimentSummary] = useState<{
    geral: 'Bullish' | 'Bearish' | 'Neutral';
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
  }>({
    geral: 'Neutral',
    bullishCount: 0,
    bearishCount: 0,
    neutralCount: 0,
  });

  const fetchNews = async (targetQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/news?query=${encodeURIComponent(targetQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const items: NewsItem[] = data.news || [];
        setNews(items);

        const bull = items.filter((n) => n.sentimento === 'Bullish').length;
        const bear = items.filter((n) => n.sentimento === 'Bearish').length;
        const neut = items.filter((n) => n.sentimento === 'Neutral').length;

        let geral: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (bull > bear) geral = 'Bullish';
        else if (bear > bull) geral = 'Bearish';

        setSentimentSummary({
          geral,
          bullishCount: bull,
          bearishCount: bear,
          neutralCount: neut,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar notícias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(searchTerm);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
    }
  };

  const filteredNews = news.filter((item) => {
    if (filter === 'all') return true;
    return item.sentimento === filter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="border-b border-[#1E2E25] pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#EAF3EE] flex items-center gap-2">
          <span>📰</span> News & Sentiments
        </h2>
        <p className="text-xs md:text-sm text-[#8FA79B] mt-1">
          Últimas notícias financeiras via RSS com análise algorítmica de sentimento de mercado
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8FA79B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ativo ou tema (ex: PETR4, Ibovespa, Dólar, Selic, Fed)..."
            className="w-full bg-[#14201A] border border-[#22332B] rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#00E6A0] hover:bg-[#00c98b] text-[#08130D] font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Buscar</span>
        </button>
      </form>

      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Card 1: Sentimento Geral */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 sm:col-span-2 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8FA79B]">Sentimento Geral do Feed</span>
            <div className="text-xl font-bold mt-1 flex items-center gap-2">
              <span>
                {sentimentSummary.geral === 'Bullish'
                  ? '🐂'
                  : sentimentSummary.geral === 'Bearish'
                  ? '🐻'
                  : '😐'}
              </span>
              <span
                className={
                  sentimentSummary.geral === 'Bullish'
                    ? 'text-[#00E6A0]'
                    : sentimentSummary.geral === 'Bearish'
                    ? 'text-[#FF5A5A]'
                    : 'text-[#9AA7A0]'
                }
              >
                {sentimentSummary.geral === 'Bullish'
                  ? 'Otimista (Bullish)'
                  : sentimentSummary.geral === 'Bearish'
                  ? 'Pessimista (Bearish)'
                  : 'Neutro (Equilibrado)'}
              </span>
            </div>
            <span className="text-[11px] text-[#6C8477]">
              Baseado no vocabulário e manchetes recentes de &quot;{searchTerm}&quot;
            </span>
          </div>
        </div>

        {/* Card 2: Bullish Count */}
        <div className="bg-[#0A2619] border border-[#00E6A0]/25 rounded-xl p-3 text-center flex flex-col justify-center">
          <span className="text-xs text-[#00E6A0] font-semibold">🐂 Notícias Positivas</span>
          <span className="text-2xl font-bold font-mono text-[#00E6A0] mt-1">
            {sentimentSummary.bullishCount}
          </span>
        </div>

        {/* Card 3: Bearish Count */}
        <div className="bg-[#2B1214] border border-[#FF5A5A]/25 rounded-xl p-3 text-center flex flex-col justify-center">
          <span className="text-xs text-[#FF5A5A] font-semibold">🐻 Notícias Negativas</span>
          <span className="text-2xl font-bold font-mono text-[#FF5A5A] mt-1">
            {sentimentSummary.bearishCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-2 text-xs">
        <span className="text-[#8FA79B] mr-2">Filtrar:</span>
        {(['all', 'Bullish', 'Bearish', 'Neutral'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              filter === f
                ? 'bg-[#182920] text-[#00E6A0] border border-[#00E6A0]/30'
                : 'text-[#8FA79B] hover:text-[#EAF3EE]'
            }`}
          >
            {f === 'all'
              ? 'Todas as notícias'
              : f === 'Bullish'
              ? '🐂 Otimistas'
              : f === 'Bearish'
              ? '🐻 Pessimistas'
              : '😐 Neutras'}
          </button>
        ))}
      </div>

      {/* News Feed List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#00E6A0] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA79B]">Buscando notícias e calculando sentimentos...</p>
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="space-y-3">
          {filteredNews.map((item, idx) => {
            const isBull = item.sentimento === 'Bullish';
            const isBear = item.sentimento === 'Bearish';
            const badgeColor = isBull ? '#00E6A0' : isBear ? '#FF5A5A' : '#9AA7A0';
            const badgeBg = isBull ? '#0A2619' : isBear ? '#2B1214' : '#18241F';

            return (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#14201A] border border-[#22332B] hover:border-[#00E6A0]/30 p-4 rounded-xl transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#8FA79B]">{item.fonte}</span>
                      <span className="text-[10px] text-[#6C8477]">• {item.publicado}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#EAF3EE] group-hover:text-[#00E6A0] transition-colors leading-snug">
                      {item.titulo}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                      style={{
                        color: badgeColor,
                        backgroundColor: badgeBg,
                        borderColor: `${badgeColor}33`,
                      }}
                    >
                      {item.sentimento}
                    </span>
                    <ExternalLink className="w-4 h-4 text-[#6C8477] group-hover:text-[#00E6A0] transition-colors" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-[#8FA79B]">
          <MessageSquare className="w-8 h-8 text-[#6C8477] mx-auto mb-2" />
          Nenhuma notícia encontrada para este filtro.
        </div>
      )}
    </div>
  );
};
