import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Check, Copy, AlertCircle, X } from 'lucide-react';
import { LANGUAGES } from './Sidebar';

export const ChartImageUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [language, setLanguage] = useState<string>('Português (Brasil)');
  const [contextInput, setContextInput] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setMimeType(file.type);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read base64
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1];
      setBase64Data(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Data) {
      setErrorMsg('Envie uma imagem do gráfico antes de solicitar a leitura.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType,
          language,
          context: contextInput,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao analisar imagem no servidor.');
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar imagem.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="border-b border-[#1E2E25] pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#EAF3EE] flex items-center gap-2">
          <span>🖼️</span> Enviar Gráfico para Leitura por IA
        </h2>
        <p className="text-xs md:text-sm text-[#8FA79B] mt-1">
          Faça upload de um print ou captura do seu home broker / TradingView para uma análise técnica multimodal detalhada
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative ${
              previewUrl
                ? 'border-[#00E6A0]/40 bg-[#0D1612]'
                : 'border-[#22332B] hover:border-[#00E6A0]/40 bg-[#14201A]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block max-h-64 overflow-hidden rounded-lg border border-[#22332B]">
                  <img
                    src={previewUrl}
                    alt="Gráfico enviado"
                    className="max-h-64 object-contain mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1 rounded-full text-white transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-[#8FA79B]">
                  <span className="font-semibold text-[#EAF3EE]">{selectedFile?.name}</span> (
                  {((selectedFile?.size || 0) / 1024).toFixed(0)} KB) — Clique para trocar
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/20 flex items-center justify-center text-[#00E6A0] mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#EAF3EE]">
                  Arraste e solte o gráfico aqui, ou clique para selecionar
                </p>
                <p className="text-xs text-[#8FA79B]">
                  Formatos suportados: PNG, JPG, WEBP, GIF (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Form Options */}
          <div className="bg-[#14201A] border border-[#22332B] rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs text-[#8FA79B] block mb-1">Idioma da análise</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0D1612] border border-[#22332B] rounded-lg px-2.5 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#8FA79B] block mb-1">
                Contexto adicional (opcional)
              </label>
              <input
                type="text"
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="Ex: Gráfico diário de PETR4, estou de olho no rompimento da resistência em 38..."
                className="w-full bg-[#0D1612] border border-[#22332B] rounded-lg px-2.5 py-1.5 text-xs text-[#EAF3EE] focus:outline-none focus:border-[#00E6A0]"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-[#FF5A5A] bg-[#2B1214] border border-[#FF5A5A]/30 p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isLoading || !base64Data}
              className="w-full bg-[#00E6A0] hover:bg-[#00c98b] text-[#08130D] font-bold py-2.5 px-4 rounded-lg text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analisando gráfico com IA...' : 'Analisar gráfico'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Vision Report */}
        <div className="lg:col-span-6 bg-[#14201A] border border-[#22332B] rounded-xl p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#22332B] pb-3 mb-3">
              <h3 className="text-sm font-bold text-[#EAF3EE] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00E6A0]" />
                <span>Resultado da Leitura Técnica</span>
              </h3>
              {analysisResult && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs bg-[#18261F] hover:bg-[#1E3027] border border-[#22332B] text-[#CDD9D3] px-2 py-1 rounded-lg transition-colors"
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
            </div>

            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#00E6A0] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#8FA79B]">
                  O modelo multimodal está examinando padrões de candles, suportes e indicadores do gráfico...
                </p>
              </div>
            ) : analysisResult ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#CDD9D3] space-y-3 whitespace-pre-line bg-[#0D1612] p-4 rounded-xl border border-[#1E2E25]">
                {analysisResult}
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-[#8FA79B] space-y-2">
                <ImageIcon className="w-8 h-8 text-[#6C8477] mx-auto" />
                <p>Nenhuma análise gerada ainda.</p>
                <p className="text-[11px] text-[#6C8477]">
                  Carregue um gráfico e clique em &quot;Analisar gráfico&quot; para iniciar.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#6C8477] pt-3 border-t border-[#22332B] mt-4">
            Aviso: A análise visual por IA visa apoiar seus estudos e não deve ser tomada como recomendação isolada de compra ou venda.
          </div>
        </div>
      </div>
    </div>
  );
};
