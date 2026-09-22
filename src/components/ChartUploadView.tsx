import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Bot, RefreshCw, CheckCircle2, X } from 'lucide-react';

export const ChartUploadView: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<'Português' | 'English' | 'Español'>('Português');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          // strip "data:*/*;base64,"
          const base64 = res.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);

      const base64Data = await base64Promise;

      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType: selectedFile.type,
          language,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar o gráfico com a IA.');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis || data.text || 'Análise visual concluída.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao analisar imagem.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#00E6A0]" />
            Leitura Visual de Gráfico por IA
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Envie qualquer print de tela de plataformas de trading (TradingView, Profit, MetaTrader)
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Idioma:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-[#0A100D] border border-[#22332B] text-zinc-200 rounded-lg px-2.5 py-1 outline-none"
          >
            <option value="Português">Português</option>
            <option value="English">English</option>
            <option value="Español">Español</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Upload Dropzone & Controls (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleChange}
              className="hidden"
              id="chart-upload-input"
            />

            {!previewUrl ? (
              <label
                htmlFor="chart-upload-input"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition cursor-pointer text-center ${
                  dragActive
                    ? 'border-[#00E6A0] bg-[#00E6A0]/10'
                    : 'border-[#22332B] hover:border-[#00E6A0]/50 bg-[#0A100D]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#14201A] border border-[#22332B] flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-[#00E6A0]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Arraste ou selecione o print do gráfico
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mb-3">
                  Suporta PNG, JPG, WEBP e GIF de até 10MB
                </p>
                <span className="px-3 py-1.5 rounded-lg bg-[#14201A] border border-[#22332B] text-xs font-semibold text-zinc-200">
                  Explorar Arquivo
                </span>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#22332B] bg-[#0A100D]">
                  <img
                    src={previewUrl}
                    alt="Gráfico enviado"
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-zinc-300 hover:text-white"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                  <span className="text-[#00E6A0] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Carregado
                  </span>
                </div>
              </div>
            )}

            {/* Context Notes Input */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Contexto Adicional (Opcional):
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                placeholder="Ex: Gráfico diário de VALE3, buscando confirmação de rompimento de suporte..."
                className="w-full p-2.5 rounded-xl bg-[#0A100D] border border-[#22332B] focus:border-[#00E6A0] text-xs text-zinc-200 outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnalyzeImage}
              disabled={!selectedFile || loading}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] hover:from-[#00c98c] hover:to-[#009c6c] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A100D] font-bold text-xs shadow-lg shadow-[#00E6A0]/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando Gráfico com IA...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Analisar com Visão Computacional</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] text-xs">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Result (Right Column) */}
        <div className="lg:col-span-7 bg-[#101914] rounded-2xl border border-[#22332B] p-4 md:p-5 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-3 mb-3">
            <Sparkles className="w-4 h-4 text-[#00E6A0]" />
            <h3 className="text-sm font-bold text-white">Relatório de Visão Computacional</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="py-16 text-center text-zinc-400 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-[#00E6A0] animate-spin" />
                <p className="text-xs font-semibold text-zinc-200">
                  O Gemini 3.8 Flash está examinando o gráfico...
                </p>
                <span className="text-[11px] text-zinc-400 max-w-sm">
                  Reconhecendo candlesticks, linhas de tendência, médias móveis e zonas de suporte/resistência desenhadas.
                </span>
              </div>
            ) : analysisResult ? (
              <div className="p-4 rounded-xl bg-[#0A100D] border border-[#1E2E25] text-zinc-200 text-xs md:text-sm leading-relaxed whitespace-pre-line overflow-y-auto max-h-[500px]">
                {analysisResult}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-zinc-600 mb-1" />
                <span>Nenhum gráfico analisado ainda.</span>
                <span className="text-[11px] text-zinc-400 max-w-xs">
                  Carregue um arquivo de imagem à esquerda e inicie a varredura para visualizar a leitura estruturada.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
