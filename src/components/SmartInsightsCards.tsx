import React from 'react';
import { SmartInsights } from '../types';

interface SmartInsightsCardsProps {
  insights: SmartInsights;
}

export const SmartInsightsCards: React.FC<SmartInsightsCardsProps> = ({ insights }) => {
  const VERDE = '#00E6A0';
  const VERMELHO = '#FF5A5A';
  const CINZA = '#9AA7A0';
  const AMARELO = '#FFC24B';

  const corTend =
    insights.tendencia === 'Alta' ? VERDE : insights.tendencia === 'Baixa' ? VERMELHO : CINZA;
  const iconeTend = insights.tendencia === 'Alta' ? '↗️' : insights.tendencia === 'Baixa' ? '↘️' : '➡️';

  const corVol =
    insights.volatilidade === 'Baixa'
      ? VERDE
      : insights.volatilidade === 'Alto'
      ? VERMELHO
      : AMARELO;

  const corSent =
    insights.sentimento === 'Otimista'
      ? VERDE
      : insights.sentimento === 'Pessimista'
      ? VERMELHO
      : CINZA;
  const iconeSent =
    insights.sentimento === 'Otimista' ? '🐂' : insights.sentimento === 'Pessimista' ? '🐻' : '😐';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#EAF3EE] flex items-center gap-1.5">
        <span>✨</span> Smart Insights
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tendência */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5">
          <div className="text-xs text-[#8FA79B] flex items-center gap-1">
            <span>{iconeTend}</span> Tendência
          </div>
          <div className="text-xl font-bold mt-1" style={{ color: corTend }}>
            {insights.tendencia}
          </div>
        </div>

        {/* Volatilidade */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5">
          <div className="text-xs text-[#8FA79B] flex items-center gap-1">
            <span>📶</span> Volatilidade
          </div>
          <div className="text-xl font-bold mt-1" style={{ color: corVol }}>
            {insights.volatilidade}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5">
          <div className="text-xs text-[#8FA79B] flex items-center gap-1">
            <span>🔊</span> Volume
          </div>
          <div className="text-xl font-bold mt-1 text-[#9AA7A0]">
            {insights.volume}
          </div>
        </div>

        {/* Sentimento */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5">
          <div className="text-xs text-[#8FA79B] flex items-center gap-1">
            <span>{iconeSent}</span> Sentimento
          </div>
          <div className="text-xl font-bold mt-1" style={{ color: corSent }}>
            {insights.sentimento}
          </div>
        </div>
      </div>
    </div>
  );
};
