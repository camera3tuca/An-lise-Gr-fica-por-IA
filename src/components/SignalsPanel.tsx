import React from 'react';
import { BiasType, RiskManagement, Signal } from '../types';

interface SignalsPanelProps {
  signals: Signal[];
  vies: BiasType;
  stopAlvo: RiskManagement | null;
}

const BADGE_CONFIG: Record<
  BiasType,
  { label: string; text: string; bg: string; border: string }
> = {
  compra: {
    label: 'Compra',
    text: '#00E6A0',
    bg: '#0A2619',
    border: '#00E6A040',
  },
  venda: {
    label: 'Venda',
    text: '#FF5A5A',
    bg: '#2B1214',
    border: '#FF5A5A40',
  },
  neutro: {
    label: 'Neutro',
    text: '#9AA7A0',
    bg: '#18241F',
    border: '#9AA7A033',
  },
};

export const SignalsPanel: React.FC<SignalsPanelProps> = ({ signals, vies, stopAlvo }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Table: Sinais de Swing Trade */}
      <div className="lg:col-span-2 bg-[#14201A] border border-[#22332B] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#EAF3EE] flex items-center gap-1.5 mb-3">
            <span>📋</span> Sinais de Swing Trade
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#22332B] text-[#8FA79B] font-semibold">
                  <th className="pb-2 pl-2">Setup</th>
                  <th className="pb-2 px-2 text-center">Sinal</th>
                  <th className="pb-2 pr-2">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22332B]/60">
                {signals.map((sig, idx) => {
                  const badge = BADGE_CONFIG[sig.sinal as BiasType] || BADGE_CONFIG.neutro;
                  return (
                    <tr key={idx} className="hover:bg-[#18261F]/40 transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-[#EAF3EE]">{sig.nome}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border"
                          style={{
                            color: badge.text,
                            backgroundColor: badge.bg,
                            borderColor: badge.border,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-[#8FA79B]">{sig.detalhe}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-[#6C8477]">
          * Sinais automáticos baseados em fechamentos anteriores. Não constituem recomendação direta de investimento.
        </div>
      </div>

      {/* Card: Gestão de Risco (ATR) */}
      <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#EAF3EE] flex items-center gap-1.5 mb-2">
            <span>🎯</span> Gestão de Risco (ATR)
          </h3>

          {stopAlvo ? (
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#22332B]">
                <span className="text-xs text-[#8FA79B]">Entrada Sugerida</span>
                <span className="font-mono font-bold text-sm text-[#EAF3EE]">
                  R$ {stopAlvo.entrada.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#22332B]">
                <div className="text-xs">
                  <span className="text-[#FF5A5A] font-semibold">Stop Loss</span>
                  <span className="text-[10px] text-[#8FA79B] block">2x ATR</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#FF5A5A]">
                    R$ {stopAlvo.stop.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#8FA79B] block font-mono">
                    -R$ {stopAlvo.risco.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#22332B]">
                <div className="text-xs">
                  <span className="text-[#00E6A0] font-semibold">Alvo (Gain)</span>
                  <span className="text-[10px] text-[#8FA79B] block">3x ATR</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#00E6A0]">
                    R$ {stopAlvo.alvo.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#8FA79B] block font-mono">
                    +R$ {stopAlvo.retorno.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#8FA79B]">Relação Risco / Retorno</span>
                <span className="font-mono font-bold text-xs text-[#00E6A0] bg-[#00E6A0]/10 px-2 py-0.5 rounded">
                  1 : {(stopAlvo.retorno / (stopAlvo.risco || 1)).toFixed(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8FA79B]">
              <p>Viés neutro ou sem ATR definido.</p>
              <p className="text-[11px] text-[#6C8477] mt-1">
                Aguarde alinhamento de médias ou rompimento para cálculo de R/R.
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#6C8477] mt-4 leading-normal">
          Risco/Retorno ~ 1 : 1.5 (Stop em 2x ATR, Alvo em 3x ATR). Ajuste conforme seu perfil.
        </p>
      </div>
    </div>
  );
};
