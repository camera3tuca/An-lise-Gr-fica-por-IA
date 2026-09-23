import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  Key,
  Calculator,
  FileDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Percent,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { ScienceBitLogo } from './ScienceBitLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTicker: string;
  currentPrice: number;
  marketType: 'B3' | 'EUA';
  calculatedStop?: number;
  calculatedAlvo?: number;
  atr?: number;
  aiAnalysisText?: string | null;
  onApiKeyChange?: (key: string) => void;
  userApiKey?: string;
  isProUser: boolean;
  setIsProUser: (val: boolean) => void;
}

export const SubscriberAreaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTicker,
  currentPrice,
  marketType,
  calculatedStop,
  calculatedAlvo,
  atr,
  aiAnalysisText,
  onApiKeyChange,
  userApiKey = '',
  isProUser,
  setIsProUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calculator' | 'keys' | 'plans' | 'report'>('calculator');
  const [apiKeyInput, setApiKeyInput] = useState(userApiKey);
  const [keySaved, setKeySaved] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Position Sizing Calculator state
  const isBRL = marketType === 'B3';
  const currencySymbol = isBRL ? 'R$' : 'US$';
  const defaultCapital = isBRL ? 50000 : 10000;

  const [totalCapital, setTotalCapital] = useState<number>(defaultCapital);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 30);
  const [stopPrice, setStopPrice] = useState<number>(
    calculatedStop || (currentPrice ? currentPrice * 0.95 : 28.5)
  );
  const [targetPrice, setTargetPrice] = useState<number>(
    calculatedAlvo || (currentPrice ? currentPrice * 1.1 : 33)
  );

  useEffect(() => {
    if (currentPrice && currentPrice > 0) {
      setEntryPrice(currentPrice);
      if (calculatedStop) setStopPrice(calculatedStop);
      if (calculatedAlvo) setTargetPrice(calculatedAlvo);
    }
  }, [currentPrice, calculatedStop, calculatedAlvo]);

  useEffect(() => {
    setApiKeyInput(userApiKey);
  }, [userApiKey]);

  if (!isOpen) return null;

  // Position Sizing Calculations
  const riskAmount = (totalCapital * (riskPercent / 100));
  const riskPerShare = Math.abs(entryPrice - stopPrice);
  const rawShares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;

  // For B3, standard lot is 100 shares
  const b3StandardLots = Math.floor(rawShares / 100);
  const b3Fractional = rawShares % 100;
  const recommendedShares = isBRL
    ? rawShares >= 100
      ? b3StandardLots * 100
      : rawShares
    : rawShares;

  const totalPositionValue = recommendedShares * entryPrice;
  const totalActualRisk = recommendedShares * riskPerShare;
  const rewardPerShare = Math.abs(targetPrice - entryPrice);
  const totalPotentialReward = recommendedShares * rewardPerShare;
  const riskRewardRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(2) : '0';
  const percentOfCapital = totalCapital > 0 ? ((totalPositionValue / totalCapital) * 100).toFixed(1) : '0';

  const handleSaveApiKey = () => {
    const clean = apiKeyInput.trim();
    localStorage.setItem('sciencebit_gemini_key', clean);
    if (onApiKeyChange) onApiKeyChange(clean);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === 'VIPPRO' || code === 'TRADERELITE' || code === 'SCIENCEBIT' || code === 'B3EUA') {
      setIsProUser(true);
      localStorage.setItem('sciencebit_pro_active', 'true');
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Código inválido ou expirado. Tente VIPPRO ou SCIENCEBIT.');
    }
  };

  const handleCopyReport = () => {
    const reportContent = `# RELATÓRIO EXECUTIVO DE SWING TRADE — SCIENCEBIT PRO
Ativo: ${currentTicker} | Mercado: ${marketType} | Cotação: ${currencySymbol} ${entryPrice.toFixed(2)}
Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}

---
## 1. GESTÃO DE RISCO E DIMENSIONAMENTO DE LOTE
- Capital Total: ${currencySymbol} ${totalCapital.toLocaleString('pt-BR')}
- Risco Tolerado por Trade: ${riskPercent}% (${currencySymbol} ${riskAmount.toFixed(2)})
- Ponto de Entrada: ${currencySymbol} ${entryPrice.toFixed(2)}
- Stop Loss Técnico: ${currencySymbol} ${stopPrice.toFixed(2)} (-${((Math.abs(entryPrice - stopPrice) / entryPrice) * 100).toFixed(2)}%)
- Alvo Técnico Projetado: ${currencySymbol} ${targetPrice.toFixed(2)} (+${((Math.abs(targetPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%)
- Quantidade Sugerida: ${recommendedShares} ações ${isBRL && rawShares >= 100 ? `(${b3StandardLots} lotes padrão)` : ''}
- Exposição Financeira: ${currencySymbol} ${totalPositionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentOfCapital}% da carteira)
- Lucro Potencial Projetado: ${currencySymbol} ${totalPotentialReward.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Relação Risco x Retorno: 1 para ${riskRewardRatio}

---
## 2. ANÁLISE TÉCNICA E TESE DE INVESTIMENTO
${aiAnalysisText || 'Análise técnica baseada em médias móveis exponenciais, ATR(14) e bandas de volatilidade.'}

---
Aviso Legal: Material educativo para controle de risco. Não é recomendação de investimento.`;

    navigator.clipboard.writeText(reportContent);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0E1612] border border-[#1E3025] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1A2C21] flex items-center justify-between bg-gradient-to-r from-[#101F17] via-[#0E1612] to-[#12221A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Terminal Pro & Área de Assinantes
                </h2>
                {isProUser ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#00E6A0]/20 border border-[#00E6A0]/40 text-[#00E6A0] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Assinante Ativo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    Plano Free Trader
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Dimensionamento de risco institucional, chave Gemini privada e dossiê de Swing Trade
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#14201A] text-zinc-400 hover:text-white border border-[#22332B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 bg-[#0A120E] border-b border-[#1A2C21] overflow-x-auto scrollbar-none">
          {[
            { id: 'calculator', label: 'Calculadora de Risco & Lote', icon: Calculator },
            { id: 'report', label: 'Dossiê do Ativo (PDF/Texto)', icon: FileDown },
            { id: 'keys', label: 'Chave Gemini Pessoal (VIP)', icon: Key },
            { id: 'plans', label: 'Planos & Ativação Pro', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-[#00E6A0] text-[#00E6A0] bg-[#122018]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#101914]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#0B140F]">
          {/* TAB 1: CALCULADORA DE POSITION SIZING & GESTÃO DE RISCO */}
          {activeSubTab === 'calculator' && (
            <div className="space-y-6">
              <div className="bg-[#121E17] p-4 rounded-2xl border border-[#203628] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#00E6A0]" />
                    Dimensionamento Matemático de Posição — {currentTicker} ({marketType})
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Evite a ruína matemática: nunca arrisque mais de 1% a 2% da sua carteira total por operação.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-[#17281F] border border-[#233C2D] text-xs font-mono font-bold text-white shrink-0">
                  Preço Base: {currencySymbol} {entryPrice.toFixed(2)}
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[#101B14] p-3.5 rounded-xl border border-[#1E3025]">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Capital da Conta ({currencySymbol})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={totalCapital}
                      onChange={(e) => setTotalCapital(Math.max(100, Number(e.target.value)))}
                      className="w-full bg-[#15231B] border border-[#22382B] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#00E6A0]"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Patrimônio total operável</span>
                </div>

                <div className="bg-[#101B14] p-3.5 rounded-xl border border-[#1E3025]">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Risco Máximo por Trade (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(Math.max(0.1, Number(e.target.value)))}
                      className="w-full bg-[#15231B] border border-[#22382B] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-[#00E6A0]"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Perda tolerada: {currencySymbol} {riskAmount.toFixed(2)}
                  </span>
                </div>

                <div className="bg-[#101B14] p-3.5 rounded-xl border border-[#1E3025]">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Stop Loss Técnico ({currencySymbol})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(Number(e.target.value))}
                      className="w-full bg-[#15231B] border border-[#22382B] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-[#FF5A5A] focus:outline-none focus:border-[#FF5A5A]"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Distância: {currencySymbol} {riskPerShare.toFixed(2)} (
                    {entryPrice > 0 ? ((riskPerShare / entryPrice) * 100).toFixed(2) : 0}%)
                  </span>
                </div>

                <div className="bg-[#101B14] p-3.5 rounded-xl border border-[#1E3025]">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Alvo de Lucro ({currencySymbol})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full bg-[#15231B] border border-[#22382B] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-[#00E6A0] focus:outline-none focus:border-[#00E6A0]"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Distância: {currencySymbol} {rewardPerShare.toFixed(2)} (
                    {entryPrice > 0 ? ((rewardPerShare / entryPrice) * 100).toFixed(2) : 0}%)
                  </span>
                </div>
              </div>

              {/* Position Sizing Output Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-gradient-to-br from-[#12231A] to-[#0E1B14] p-4 rounded-2xl border border-[#203D2D] shadow-md">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Tamanho da Posição Recomendada</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#00E6A0]/20 text-[#00E6A0] text-[9px]">Lote Exato</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {recommendedShares.toLocaleString('pt-BR')}{' '}
                    <span className="text-xs font-semibold text-zinc-400">ações</span>
                  </div>
                  {isBRL && rawShares >= 100 && (
                    <div className="text-xs text-[#00E6A0] mt-1 font-semibold">
                      {b3StandardLots} {b3StandardLots === 1 ? 'lote padrão' : 'lotes padrão'} (100 ações)
                      {b3Fractional > 0 ? ` + ${b3Fractional} fracionárias` : ''}
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Exposição financeira total:{' '}
                    <strong className="text-white font-mono">
                      {currencySymbol} {totalPositionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    ({percentOfCapital}% da carteira).
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1F1414] to-[#140D0D] p-4 rounded-2xl border border-[#3D2020] shadow-md">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Risco Monetário Máximo</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#FF5A5A]/20 text-[#FF5A5A] text-[9px]">Perda no Stop</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#FF5A5A]">
                    {currencySymbol} {totalActualRisk.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Se atingir o stop em {currencySymbol} {stopPrice.toFixed(2)}, você perderá exatamente{' '}
                    <strong className="text-zinc-200">
                      {((totalActualRisk / totalCapital) * 100).toFixed(2)}%
                    </strong>{' '}
                    do patrimônio total, preservando sua banca para os próximos trades.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#102318] to-[#0A1710] p-4 rounded-2xl border border-[#1D402B] shadow-md">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Retorno Potencial no Alvo</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#00E6A0]/20 text-[#00E6A0] text-[9px]">
                      R:R 1 para {riskRewardRatio}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#00E6A0]">
                    {currencySymbol} {totalPotentialReward.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Relação Risco x Retorno de <strong className="text-white">1 para {riskRewardRatio}</strong>. Para
                    cada {currencySymbol} 1 arriscado, a operação busca {currencySymbol} {riskRewardRatio} de lucro.
                  </p>
                </div>
              </div>

              {Number(percentOfCapital) > 40 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Atenção à Concentração:</strong> Esta única operação exigirá {percentOfCapital}% do seu
                    patrimônio total. Em carteiras profissionais de Swing Trade, costuma-se diversificar entre 4 a 8 ativos
                    simultâneos (12% a 25% por posição).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOSSIÊ EXECUTIVO DE SWING TRADE */}
          {activeSubTab === 'report' && (
            <div className="space-y-4">
              <div className="bg-[#121E17] p-4 rounded-2xl border border-[#203628] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Dossiê de Swing Trade & Análise Executiva
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Exporte a tese completa, confluências técnicas e o gerenciamento de risco de {currentTicker}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-xl bg-[#00E6A0] text-[#0A100D] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer hover:bg-[#00c98c]"
                >
                  {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReport ? 'Copiado!' : 'Copiar Dossiê'}</span>
                </button>
              </div>

              <div className="bg-[#090F0C] p-4 rounded-2xl border border-[#1E3025] font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {`=============================================================
RELATÓRIO INSTITUCIONAL DE SWING TRADE — SCIENCEBIT PRO
=============================================================
ATIVO: ${currentTicker} | MERCADO: ${marketType} | COTAÇÃO: ${currencySymbol} ${entryPrice.toFixed(2)}
DATA: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}

1. PARÂMETROS OPERACIONAIS RECOMENDADOS
-------------------------------------------------------------
- Entrada Tática: ${currencySymbol} ${entryPrice.toFixed(2)}
- Stop Loss:      ${currencySymbol} ${stopPrice.toFixed(2)} (-${((Math.abs(entryPrice - stopPrice) / entryPrice) * 100).toFixed(2)}%)
- Alvo Projetado: ${currencySymbol} ${targetPrice.toFixed(2)} (+${((Math.abs(targetPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%)
- Relação R:R:    1 para ${riskRewardRatio}
- Lote Sugerido:  ${recommendedShares} ações (Exposição: ${currencySymbol} ${totalPositionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- Perda Máxima:   ${currencySymbol} ${totalActualRisk.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${((totalActualRisk / totalCapital) * 100).toFixed(2)}% da conta)

2. ANÁLISE DO MODELO DE INTELIGÊNCIA ARTIFICIAL
-------------------------------------------------------------
${aiAnalysisText || 'Gere a leitura de IA na aba principal para embutir o relatório completo de inteligência analítica neste documento.'}

=============================================================
AVISO LEGAL: Conteúdo estritamente educacional para gestão de risco.`}
              </div>
            </div>
          )}

          {/* TAB 3: CHAVE GEMINI PESSOAL (VIP) */}
          {activeSubTab === 'keys' && (
            <div className="space-y-4">
              <div className="bg-[#121E17] p-4 rounded-2xl border border-[#203628]">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  Conexão Direta com sua Google Gemini API Key
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Para traders profissionais que necessitam de velocidade de resposta máxima, execução ilimitada sem
                  qualquer fila de espera pública ou limites compartilhados. A chave é salva apenas no seu navegador
                  e utilizada para assinar as requisições de análise técnica e de visão computacional.
                </p>
              </div>

              <div className="bg-[#101B14] p-4 rounded-2xl border border-[#1E3025] space-y-3">
                <label className="text-xs font-bold text-zinc-300 block">
                  Sua Google Gemini API Key (Opcional para Assinantes VIP):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                    className="flex-1 bg-[#15231B] border border-[#22382B] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00E6A0]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 rounded-xl bg-[#00E6A0] text-[#0A100D] font-bold text-xs transition cursor-pointer hover:bg-[#00c98c] shrink-0"
                  >
                    {keySaved ? 'Chave Salva!' : 'Salvar Chave'}
                  </button>
                </div>
                {keySaved && (
                  <p className="text-xs text-[#00E6A0] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Chave configurada com sucesso para as análises!
                  </p>
                )}
                <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-1">
                  <span>Não tem uma chave? Você pode obter gratuitamente no</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00E6A0] hover:underline flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLANOS & ATIVAÇÃO PRO */}
          {activeSubTab === 'plans' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plano Free */}
                <div className="bg-[#101914] p-5 rounded-3xl border border-[#1E2E25] flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#18261F] text-zinc-400 uppercase tracking-wider">
                      Plano Grátis
                    </span>
                    <h4 className="text-xl font-black text-white">Free Trader</h4>
                    <p className="text-xs text-zinc-400">
                      Acesso aos gráficos em tempo real de B3 e EUA com indicadores clássicos.
                    </p>
                    <div className="text-2xl font-black text-white font-mono">R$ 0</div>

                    <ul className="space-y-2 pt-3 border-t border-[#1C2C22] text-xs text-zinc-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Gráficos de Candlesticks em tempo real
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Indicadores técnicos (Médias, Bollinger, RSI, MACD)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Varredura de mercado básica
                      </li>
                      <li className="flex items-center gap-2 text-zinc-500">
                        <X className="w-4 h-4 text-zinc-600" /> Relatórios executivos de IA ilimitados
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-[#14201A] text-zinc-500 font-bold text-xs cursor-default"
                    >
                      {isProUser ? 'Plano Anterior' : 'Plano Atual'}
                    </button>
                  </div>
                </div>

                {/* Plano Pro */}
                <div className="bg-gradient-to-b from-[#13261C] to-[#0E1A13] p-5 rounded-3xl border-2 border-[#00E6A0]/40 flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00E6A0] text-[#0A100D] text-[10px] font-black uppercase tracking-wider">
                      Recomendado
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E6A0]/20 text-[#00E6A0] uppercase tracking-wider">
                      ScienceBit VIP
                    </span>
                    <h4 className="text-xl font-black text-white flex items-center gap-2">
                      Pro Trader Elite <Crown className="w-4 h-4 text-amber-400" />
                    </h4>
                    <p className="text-xs text-zinc-300">
                      O ecossistema definitivo para traders de alta performance na B3 e mercado americano.
                    </p>
                    <div className="text-2xl font-black text-white font-mono">
                      R$ 29,90 <span className="text-xs font-normal text-zinc-400">/mês</span>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-[#1C3627] text-xs text-zinc-200">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Análises com Gemini 3.8 Flash sem limites
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Calculadora Institucional de Lote e Risco
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Leitura multimodal de prints de gráficos (Visão IA)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Universo completo com mais de 100 ativos e busca livre
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#00E6A0]" /> Exportação de Dossiês de Swing Trade
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5 space-y-3">
                    {isProUser ? (
                      <div className="w-full py-2.5 rounded-xl bg-[#00E6A0]/20 border border-[#00E6A0]/40 text-[#00E6A0] font-bold text-xs text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Assinatura Ativa
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProUser(true);
                          localStorage.setItem('sciencebit_pro_active', 'true');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D] font-black text-xs transition cursor-pointer shadow-lg shadow-[#00E6A0]/20 flex items-center justify-center gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Ativar Acesso Pro Agora</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ativação via Código/Cupom VIP */}
              <div className="bg-[#101914] p-4 rounded-2xl border border-[#1E2E25]">
                <h5 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-[#00E6A0]" /> Possui um Cupom ou Token de Assinante VIP?
                </h5>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Digite seu token (ex: VIPPRO, SCIENCEBIT, B3EUA)..."
                    className="flex-1 bg-[#14221A] border border-[#22382B] rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#00E6A0]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#182C20] hover:bg-[#203D2B] text-zinc-200 hover:text-white border border-[#23422F] text-xs font-bold transition cursor-pointer"
                  >
                    Validar
                  </button>
                </form>
                {couponError && <p className="text-[11px] text-amber-400 mt-1.5">{couponError}</p>}
                {isProUser && (
                  <p className="text-[11px] text-[#00E6A0] mt-1.5 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Você já é um assinante Pro com acesso total liberado!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
