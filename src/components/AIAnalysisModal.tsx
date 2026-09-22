import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, X, Check, Copy } from 'lucide-react';
import { ProcessedCandle, SwingSignal, StopTarget } from '../types';

interface Props {
  ticker: string;
  candles: ProcessedCandle[];
  signals: SwingSignal[];
  stopTarget: StopTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAnalysisModal: React.FC<Props> = ({
  ticker,
  candles,
  signals,
  stopTarget,
  isOpen,
  onClose,
}) => {
  const [language, setLanguage] = useState<'Português' | 'English' | 'Español'>('Português');
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const lastCandle = candles[candles.length - 1];
      const payload = {
        ticker,
        language,
        currentPrice: lastCandle?.close,
        rsi: lastCandle?.RSI,
        atr: lastCandle?.ATR,
        sma200: lastCandle?.SMA200,
        sma20: lastCandle?.SMA20,
        signals: signals.map((s) => `${s.nome}: ${s.sinal} (${s.detalhe})`),
        stop: stopTarget?.stop,
        alvo: stopTarget?.alvo,
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Falha ao comunicar com o serviço de IA.');
      }

      const data = await res.json();
      setAnalysisText(data.analysis || data.text || 'Análise gerada com sucesso.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao gerar análise.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#101914] border border-[#22332B] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E2E25]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#00E6A0]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Leitura Técnica com IA · {ticker}
                <Sparkles className="w-3.5 h-3.5 text-[#00E6A0]" />
              </h3>
              <p className="text-[11px] text-zinc-400">Google Gemini 3.8 Flash</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-[#0A100D] border border-[#22332B] text-zinc-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-[#00E6A0]"
            >
              <option value="Português">Português</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#14201A] text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 text-xs md:text-sm">
          {!analysisText && !loading && (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#14201A] border border-[#22332B] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#00E6A0]" />
              </div>
              <h4 className="text-base font-bold text-white">Análise Inteligente de Cenário</h4>
              <p className="text-xs text-zinc-400 max-w-md">
                Clique abaixo para processar todos os indicadores, fractais e sinais de {ticker} através do modelo multimodal Gemini 3.8 Flash.
              </p>
              <button
                onClick={handleGenerateAI}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] hover:from-[#00c98c] hover:to-[#009c6c] text-[#0A100D] font-bold text-xs shadow-lg shadow-[#00E6A0]/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Gerar Análise Completa</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-14 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#00E6A0] animate-spin" />
              <p className="text-xs font-semibold text-zinc-300">
                Processando dados técnicos com Google Gemini...
              </p>
              <span className="text-[11px] text-zinc-400">
                Avaliando médias, momentum RSI, expansão de volatilidade e assimetria de risco.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] text-xs">
              {error}
            </div>
          )}

          {analysisText && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                  Relatório Técnico Estruturado
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-[#00E6A0] hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#0A100D] border border-[#1E2E25] font-sans text-zinc-200 leading-relaxed whitespace-pre-line text-xs md:text-sm">
                {analysisText}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1E2E25] bg-[#0D1612] flex items-center justify-between">
          <span className="text-[10px] text-zinc-400">
            Aviso: Material educacional. Não constitui recomendação de investimento.
          </span>
          {analysisText && (
            <button
              onClick={handleGenerateAI}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#14201A] hover:bg-[#1C2C24] border border-[#22332B] text-xs text-zinc-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
