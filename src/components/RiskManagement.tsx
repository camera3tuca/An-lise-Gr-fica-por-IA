import React from 'react';
import { Target, ShieldAlert, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { StopTarget, BiasType } from '../types';

interface Props {
  stopTarget: StopTarget | null;
  bias: BiasType;
  currentPrice: number;
}

export const RiskManagement: React.FC<Props> = ({
  stopTarget,
  bias,
  currentPrice,
}) => {
  if (!stopTarget || bias === 'neutro') {
    return (
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col items-center justify-center text-center py-8">
        <Scale className="w-8 h-8 text-zinc-500 mb-2" />
        <h4 className="text-sm font-bold text-zinc-300">Gestão de Risco Neutra</h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Nenhum sinal direcional claro no momento. O cálculo de Stop/Alvo por ATR é ativado quando o viés técnico consolidado for de COMPRA ou VENDA.
        </p>
      </div>
    );
  }

  const isBuy = bias === 'compra';
  const ratio = (stopTarget.retorno / (stopTarget.risco || 1)).toFixed(1);

  return (
    <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#1E2E25] pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#00E6A0]" />
          <div>
            <h3 className="text-sm font-bold text-white">Gestão de Risco (ATR)</h3>
            <p className="text-[11px] text-zinc-400">
              Cálculo baseado na volatilidade média de 14 períodos
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#14201A] border border-[#22332B] text-zinc-300">
          Relação 1 : {ratio}
        </span>
      </div>

      {/* Grid of Key Prices */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {/* Entrada */}
        <div className="bg-[#0A100D] p-3 rounded-xl border border-[#1E2E25]">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            Entrada Ref.
          </div>
          <div className="text-sm md:text-base font-mono font-bold text-white">
            {stopTarget.entrada.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Preço atual</div>
        </div>

        {/* Stop Loss (2x ATR) */}
        <div className="bg-[#0A100D] p-3 rounded-xl border border-[#FF5A5A]/30">
          <div className="text-[10px] uppercase tracking-wider text-[#FF5A5A] font-semibold flex items-center justify-center gap-1 mb-1">
            <ShieldAlert className="w-3 h-3" />
            Stop (2x ATR)
          </div>
          <div className="text-sm md:text-base font-mono font-bold text-[#FF5A5A]">
            {stopTarget.stop.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#FF5A5A]/80 mt-0.5">
            - {stopTarget.risco.toFixed(2)} ({((stopTarget.risco / stopTarget.entrada) * 100).toFixed(1)}%)
          </div>
        </div>

        {/* Alvo Ganho (3x ATR) */}
        <div className="bg-[#0A100D] p-3 rounded-xl border border-[#00E6A0]/30">
          <div className="text-[10px] uppercase tracking-wider text-[#00E6A0] font-semibold flex items-center justify-center gap-1 mb-1">
            <Target className="w-3 h-3" />
            Alvo (3x ATR)
          </div>
          <div className="text-sm md:text-base font-mono font-bold text-[#00E6A0]">
            {stopTarget.alvo.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#00E6A0]/80 mt-0.5">
            + {stopTarget.retorno.toFixed(2)} ({((stopTarget.retorno / stopTarget.entrada) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Visual Risk-Reward Bar */}
      <div className="bg-[#0A100D] p-3.5 rounded-xl border border-[#1E2E25]">
        <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1 text-[#FF5A5A]">
            <ArrowDownRight className="w-3.5 h-3.5" /> Risco Máx: {stopTarget.risco.toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-[#00E6A0]">
            <ArrowUpRight className="w-3.5 h-3.5" /> Retorno Alvo: {stopTarget.retorno.toFixed(2)}
          </span>
        </div>
        {/* Progress ratio */}
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-[#FF5A5A]" style={{ width: '40%' }} />
          <div className="h-full bg-[#00E6A0]" style={{ width: '60%' }} />
        </div>
        <p className="text-[10px] text-zinc-400 text-center mt-2">
          ATR (14) = <strong>{stopTarget.atr.toFixed(2)}</strong>. Estratégia assimétrica: stop em 2 desvios de volatilidade e alvo em 3 desvios.
        </p>
      </div>
    </div>
  );
};
