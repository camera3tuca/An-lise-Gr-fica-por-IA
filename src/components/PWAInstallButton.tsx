import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Info, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'compact' | 'full' | 'hero';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-xs font-semibold text-[#00E6A0]">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Instalado</span>
      </div>
    );
  }

  // Android & Desktop Chrome/Edge flow
  if (isInstallable) {
    if (variant === 'hero') {
      return (
        <button
          onClick={install}
          className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00E6A0] to-[#00B37E] hover:from-[#00c98c] hover:to-[#009c6c] text-[#0A100D] font-bold text-sm shadow-lg shadow-[#00E6A0]/20 transition active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Instalar App no Dispositivo</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00E6A0] hover:bg-[#00c98c] text-[#0A100D] font-bold text-xs shadow-md shadow-[#00E6A0]/20 transition active:scale-95 cursor-pointer"
        title="Instalar como aplicativo nativo"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14201A] border border-[#22332B] hover:border-[#00E6A0]/50 text-xs font-medium text-[#EAF3EE] transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00E6A0]" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#14201A] border border-[#22332B] p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1F3327] text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5 mb-3 text-[#00E6A0]">
                <Smartphone className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
              </div>
              <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
                Para instalar o <strong>Chart AI Plus</strong> na sua tela de início sem precisar da App Store:
              </p>
              <ol className="text-xs text-zinc-300 space-y-2.5 bg-[#0A100D] p-3.5 rounded-xl border border-[#22332B]">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#00E6A0]">1.</span>
                  <span>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#00E6A0]">2.</span>
                  <span>Role o menu para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#00E6A0]">3.</span>
                  <span>Confirme tocando em <strong>Adicionar</strong> no canto superior direito.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#00E6A0] text-[#0A100D] font-bold text-xs hover:bg-[#00c98c] transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback info button for desktop browsers or other platforms
  return (
    <button
      onClick={() => alert('Para instalar, abra este link pelo navegador Chrome, Edge ou Safari e selecione "Instalar aplicativo" ou "Adicionar à tela de início".')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14201A] border border-[#22332B] hover:border-[#00E6A0]/40 text-xs text-zinc-400 hover:text-zinc-200 transition"
      title="Instalar aplicativo PWA"
    >
      <Download className="w-3.5 h-3.5 text-[#00E6A0]" />
      <span>Instalar</span>
    </button>
  );
};
