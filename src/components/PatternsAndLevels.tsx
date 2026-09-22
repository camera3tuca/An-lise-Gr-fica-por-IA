import React from 'react';
import { PatternItem, SupportResistanceLevels } from '../types';
import { Layers, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

interface Props {
  patterns: PatternItem[];
  levels: SupportResistanceLevels;
  currentPrice: number;
}

export const PatternsAndLevels: React.FC<Props> = ({
  patterns,
  levels,
  currentPrice,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Detecção de Padrões Gráficos */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-3">
          <Sparkles className="w-4 h-4 text-[#00E6A0]" />
          <h3 className="text-sm font-bold text-white">Padrões Gráficos Clássicos</h3>
        </div>

        <div className="space-y-2.5 flex-1">
          {patterns.map((p, idx) => {
            const isBull = p.vies === 'Otimista';
            const isBear = p.vies === 'Pessimista';
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#0A100D] border border-[#1E2E25] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{p.nome}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isBull
                        ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
                        : isBear
                        ? 'bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {p.vies}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.detalhe}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Suporte & Resistência (Fractais) */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Níveis de Suporte & Resistência</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* Resistências (acima) */}
          <div className="p-3 rounded-xl bg-[#0A100D] border border-[#FF5A5A]/20 flex flex-col gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#FF5A5A] tracking-wider">
              <ArrowUp className="w-3.5 h-3.5" /> Resistências
            </div>
            {levels.resistencias.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Sem resistências próximas</p>
            ) : (
              <div className="space-y-1.5">
                {levels.resistencias.map((r, i) => {
                  const pct = currentPrice > 0 ? (((r - currentPrice) / currentPrice) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#14201A] border border-[#22332B]"
                    >
                      <span className="font-mono font-bold text-white">{r.toFixed(2)}</span>
                      <span className="text-[10px] text-[#FF5A5A] font-medium">+{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suportes (abaixo) */}
          <div className="p-3 rounded-xl bg-[#0A100D] border border-[#00E6A0]/20 flex flex-col gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#00E6A0] tracking-wider">
              <ArrowDown className="w-3.5 h-3.5" /> Suportes
            </div>
            {levels.suportes.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Sem suportes próximos</p>
            ) : (
              <div className="space-y-1.5">
                {levels.suportes.map((s, i) => {
                  const pct = currentPrice > 0 ? (((currentPrice - s) / currentPrice) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#14201A] border border-[#22332B]"
                    >
                      <span className="font-mono font-bold text-white">{s.toFixed(2)}</span>
                      <span className="text-[10px] text-[#00E6A0] font-medium">-{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
