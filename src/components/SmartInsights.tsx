import React from 'react';
import { TrendingUp, TrendingDown, Minus, Gauge, BarChart2, Compass } from 'lucide-react';
import { SmartInsights as SmartInsightsType } from '../types';

interface Props {
  insights: SmartInsightsType;
}

export const SmartInsights: React.FC<Props> = ({ insights }) => {
  const getTrendIcon = (t: string) => {
    if (t === 'Alta') return <TrendingUp className="w-4 h-4 text-[#00E6A0]" />;
    if (t === 'Baixa') return <TrendingDown className="w-4 h-4 text-[#FF5A5A]" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  const getSentimentBadge = (s: string) => {
    if (s === 'Otimista') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
          Otimista
        </span>
      );
    }
    if (s === 'Pessimista') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30">
          Pessimista
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-700/20 text-zinc-400 border border-zinc-700/40">
        Neutro
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Tendência */}
      <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider">Tendência</span>
          {getTrendIcon(insights.tendencia)}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white tracking-tight">{insights.tendencia}</span>
          <span className="text-[10px] text-zinc-400">Médio Prazo</span>
        </div>
      </div>

      {/* 2. Volatilidade */}
      <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider">Volatilidade</span>
          <Gauge className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white tracking-tight">{insights.volatilidade}</span>
          <span className="text-[10px] text-zinc-400">Base ATR</span>
        </div>
      </div>

      {/* 3. Volume */}
      <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider">Volume</span>
          <BarChart2 className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white tracking-tight">{insights.volume}</span>
          <span className="text-[10px] text-zinc-400">vs Média 20</span>
        </div>
      </div>

      {/* 4. Sentimento */}
      <div className="bg-[#101914] rounded-xl border border-[#22332B] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider">Sentimento</span>
          <Compass className="w-4 h-4 text-[#00E6A0]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">{insights.sentimento}</span>
          {getSentimentBadge(insights.sentimento)}
        </div>
      </div>
    </div>
  );
};
