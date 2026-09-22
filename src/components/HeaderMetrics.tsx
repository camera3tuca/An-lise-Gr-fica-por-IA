import React from 'react';
import { BiasType } from '../types';

interface HeaderMetricsProps {
  ticker: string;
  currentPrice: number;
  variationPct: number;
  rsi?: number;
  atr?: number;
  vies: BiasType;
  compras: number;
  vendas: number;
  updatedAt: string;
  isDemo: boolean;
}

const BIAS_CONFIG: Record<
  BiasType,
  { label: string; color: string; bg: string; emoji: string }
> = {
  compra: {
    label: 'COMPRA',
    color: '#00E6A0',
    bg: '#0A2619',
    emoji: '🟢',
  },
  venda: {
    label: 'VENDA',
    color: '#FF5A5A',
    bg: '#2B1214',
    emoji: '🔴',
  },
  neutro: {
    label: 'NEUTRO',
    color: '#9AA7A0',
    bg: '#18241F',
    emoji: '⚪',
  },
};

export const HeaderMetrics: React.FC<HeaderMetricsProps> = ({
  ticker,
  currentPrice,
  variationPct,
  rsi,
  atr,
  vies,
  compras,
  vendas,
  updatedAt,
  isDemo,
}) => {
  const bias = BIAS_CONFIG[vies];
  const isPositive = variationPct >= 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#EAF3EE] font-mono">
              {ticker}
            </h2>
            {isDemo && (
              <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                Modo Demonstração (Sintético)
              </span>
            )}
          </div>
          <p className="text-xs text-[#8FA79B]">
            Análise técnica para <strong className="text-[#CDD9D3]">Swing Trade</strong> no gráfico diário
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Cotação */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-[#8FA79B]">Cotação / Fechamento</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-[#EAF3EE]">
              {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                isPositive ? 'text-[#00E6A0] bg-[#00E6A0]/10' : 'text-[#FF5A5A] bg-[#FF5A5A]/10'
              }`}
            >
              {isPositive ? '+' : ''}
              {variationPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Metric 2: RSI (14) */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-[#8FA79B]">RSI (14)</span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-[#EAF3EE]">
              {rsi !== undefined ? rsi.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-[#6C8477] ml-2">
              {rsi !== undefined ? (rsi >= 70 ? 'Sobrecomprado' : rsi <= 30 ? 'Sobrevendido' : 'Neutro') : ''}
            </span>
          </div>
        </div>

        {/* Metric 3: ATR (14) */}
        <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-[#8FA79B]">ATR (14) Volatilidade</span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-[#EAF3EE]">
              {atr !== undefined
                ? atr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            <span className="text-[11px] text-[#6C8477] ml-2">range diário</span>
          </div>
        </div>

        {/* Metric 4: Viés de Swing */}
        <div
          className="border rounded-xl p-3.5 flex flex-col justify-between"
          style={{ backgroundColor: bias.bg, borderColor: `${bias.color}33` }}
        >
          <span className="text-xs text-[#8FA79B]">Viés de Swing</span>
          <div className="mt-0.5">
            <div className="text-xl font-extrabold tracking-wide flex items-center gap-1.5" style={{ color: bias.color }}>
              <span>{bias.emoji}</span>
              <span>{bias.label}</span>
            </div>
            <div className="text-[11px] text-[#8FA79B] mt-0.5 font-medium">
              {compras} compra · {vendas} venda
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[#6C8477]">
        Atualizado em {updatedAt}. Yahoo Finance costuma apresentar atraso de ~15 min na B3.
      </div>
    </div>
  );
};
