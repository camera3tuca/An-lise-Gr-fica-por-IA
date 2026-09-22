import React from 'react';
import { ChartPattern, SupportResistance } from '../types';

interface PatternsPanelProps {
  patterns: ChartPattern[];
  levels: SupportResistance;
  currentPrice: number;
}

export const PatternsPanel: React.FC<PatternsPanelProps> = ({
  patterns,
  levels,
  currentPrice,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Detecção de Padrões */}
      <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#EAF3EE] flex items-center gap-1.5 mb-3">
          <span>🔺</span> Detecção de Padrões
        </h3>

        <div className="space-y-2.5">
          {patterns.map((pat, idx) => {
            const isOtimista = pat.vies === 'Otimista';
            const isPessimista = pat.vies === 'Pessimista';
            const color = isOtimista ? '#00E6A0' : isPessimista ? '#FF5A5A' : '#9AA7A0';
            const bg = isOtimista ? '#0A2619' : isPessimista ? '#2B1214' : '#18241F';

            return (
              <div
                key={idx}
                className="p-3 rounded-lg border flex items-start gap-3 transition-colors"
                style={{ backgroundColor: bg, borderColor: `${color}30` }}
              >
                <span className="text-base mt-0.5">
                  {isOtimista ? '🟢' : isPessimista ? '🔴' : '⚪'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#EAF3EE]">{pat.nome}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color, backgroundColor: `${color}15` }}
                    >
                      {pat.vies}
                    </span>
                  </div>
                  <p className="text-xs text-[#8FA79B] mt-1 leading-relaxed">{pat.detalhe}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suporte / Resistência */}
      <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#EAF3EE] flex items-center gap-1.5 mb-3">
          <span>📐</span> Suporte / Resistência (Pivôs)
        </h3>

        <div className="space-y-3">
          {/* Resistências */}
          <div>
            <div className="text-[11px] font-semibold text-[#FF5A5A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>🔻</span> Resistências (Acima da cotação)
            </div>
            {levels.resistencias.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {levels.resistencias.map((res: number, i: number) => {
                  const dist = ((res - currentPrice) / currentPrice) * 100;
                  return (
                    <div
                      key={`res-${i}`}
                      className="bg-[#1E1617] border border-[#FF5A5A]/25 rounded-lg p-2 text-center"
                    >
                      <div className="text-[10px] text-[#8FA79B]">R{i + 1}</div>
                      <div className="text-xs font-bold font-mono text-[#FF5A5A]">
                        R$ {res.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#FF5A5A]/80 font-mono">
                        +{dist.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6C8477]">Nenhuma resistência recente identificada próxima.</p>
            )}
          </div>

          {/* Preço Atual */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D1612] border border-[#22332B] rounded-lg text-xs">
            <span className="text-[#8FA79B]">Cotação Atual de Referência</span>
            <span className="font-mono font-bold text-[#EAF3EE]">R$ {currentPrice.toFixed(2)}</span>
          </div>

          {/* Suportes */}
          <div>
            <div className="text-[11px] font-semibold text-[#00E6A0] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>🔺</span> Suportes (Abaixo da cotação)
            </div>
            {levels.suportes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {levels.suportes.map((sup: number, i: number) => {
                  const dist = ((sup - currentPrice) / currentPrice) * 100;
                  return (
                    <div
                      key={`sup-${i}`}
                      className="bg-[#0E1E17] border border-[#00E6A0]/25 rounded-lg p-2 text-center"
                    >
                      <div className="text-[10px] text-[#8FA79B]">S{i + 1}</div>
                      <div className="text-xs font-bold font-mono text-[#00E6A0]">
                        R$ {sup.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#00E6A0]/80 font-mono">
                        {dist.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6C8477]">Nenhum suporte recente identificado próximo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
