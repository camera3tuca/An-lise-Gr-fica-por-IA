import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface AiAnalysisSectionProps {
  ticker: string;
  aiText: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  language: string;
}

export const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({
  ticker,
  aiText,
  isLoading,
  onGenerate,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!aiText) return;
    navigator.clipboard.writeText(aiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22332B] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00E6A0]/10 border border-[#00E6A0]/30 flex items-center justify-center text-[#00E6A0]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#EAF3EE]">
              Leitura Técnica por IA · {ticker}
            </h3>
            <p className="text-[11px] text-[#8FA79B]">
              Relatório estruturado em {language} via Gemini 3.8 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {aiText && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs bg-[#18261F] hover:bg-[#1E3027] border border-[#22332B] text-[#CDD9D3] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00E6A0]" />
                  <span className="text-[#00E6A0]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-[#00E6A0] hover:bg-[#00c98b] text-[#08130D] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Gerando...' : aiText ? 'Atualizar Leitura' : 'Gerar Análise'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#00E6A0] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA79B]">
            Processando indicadores, histórico e contexto macro via IA...
          </p>
        </div>
      ) : aiText ? (
        <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#CDD9D3] space-y-3 whitespace-pre-line bg-[#0D1612] p-4 rounded-xl border border-[#1E2E25]">
          {aiText}
        </div>
      ) : (
        <div className="py-10 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-[#00E6A0]/40 mx-auto" />
          <p className="text-xs text-[#8FA79B]">
            Clique em <strong>Gerar Análise</strong> para receber uma leitura completa dos 4 pilares:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-[#6C8477]">
            <span className="bg-[#14201A] border border-[#22332B] px-2.5 py-1 rounded-full">
              1. Volume & Interesse
            </span>
            <span className="bg-[#14201A] border border-[#22332B] px-2.5 py-1 rounded-full">
              2. RSI & MACD
            </span>
            <span className="bg-[#14201A] border border-[#22332B] px-2.5 py-1 rounded-full">
              3. Volatilidade & Stop/Alvo
            </span>
            <span className="bg-[#14201A] border border-[#22332B] px-2.5 py-1 rounded-full">
              4. Suportes & Resistências
            </span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 pt-2 text-[11px] text-[#6C8477] border-t border-[#22332B]/60">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Aviso Legal: A leitura por IA é um modelo probabilístico baseado em análise gráfica e não representa recomendação financeira, garantia de ganhos ou conselho de investimento individual. Opere sempre com gestão de risco.
        </span>
      </div>
    </div>
  );
};
