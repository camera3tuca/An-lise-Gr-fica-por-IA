import React from 'react';
import { SwingSignal, BiasType } from '../types';
import { CheckCircle2, XCircle, MinusCircle, ShieldCheck } from 'lucide-react';

interface Props {
  signals: SwingSignal[];
  bias: BiasType;
  buyCount: number;
  sellCount: number;
}

export const SignalsTable: React.FC<Props> = ({
  signals,
  bias,
  buyCount,
  sellCount,
}) => {
  const getBiasBadge = () => {
    if (bias === 'compra') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
          <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-pulse" />
          COMPRA
        </span>
      );
    }
    if (bias === 'venda') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/30">
          <span className="w-2 h-2 rounded-full bg-[#FF5A5A] animate-pulse" />
          VENDA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-zinc-700/20 text-zinc-300 border border-zinc-700/40">
        <span className="w-2 h-2 rounded-full bg-zinc-400" />
        NEUTRO
      </span>
    );
  };

  const getSignalBadge = (sinal: BiasType) => {
    if (sinal === 'compra') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/25">
          <CheckCircle2 className="w-3 h-3" />
          Compra
        </span>
      );
    }
    if (sinal === 'venda') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#FF5A5A]/15 text-[#FF5A5A] border border-[#FF5A5A]/25">
          <XCircle className="w-3 h-3" />
          Venda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/30">
        <MinusCircle className="w-3 h-3" />
        Neutro
      </span>
    );
  };

  return (
    <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col gap-4">
      {/* Header with consolidated bias */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2E25] pb-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#00E6A0]" />
          <div>
            <h3 className="text-sm font-bold text-white">Sinais de Swing Trade</h3>
            <p className="text-[11px] text-zinc-400">Varredura técnica de setups clássicos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Viés Consolidado</div>
            <div className="text-xs font-mono text-zinc-400">
              <span className="text-[#00E6A0] font-bold">{buyCount} compras</span> ·{' '}
              <span className="text-[#FF5A5A] font-bold">{sellCount} vendas</span>
            </div>
          </div>
          {getBiasBadge()}
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1E2E25] text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              <th className="pb-2.5 pr-4">Setup</th>
              <th className="pb-2.5 px-4">Sinal</th>
              <th className="pb-2.5 pl-4">Detalhe Técnico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2820]">
            {signals.map((sig, idx) => (
              <tr key={idx} className="hover:bg-[#14201A]/60 transition">
                <td className="py-2.5 pr-4 font-semibold text-zinc-200 whitespace-nowrap">
                  {sig.nome}
                </td>
                <td className="py-2.5 px-4 whitespace-nowrap">
                  {getSignalBadge(sig.sinal)}
                </td>
                <td className="py-2.5 pl-4 text-zinc-300 leading-relaxed">
                  {sig.detalhe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
