import React, { useState } from 'react';
import { Smartphone, CheckCircle, ExternalLink, ShieldCheck, Terminal, Download, FileCode, Sparkles, Copy, Check } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const PlayStoreGuideView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bubblewrapCode = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="https://ais-dev-dyq5rko3l5yw7rrswqiboy-45073816214.us-west2.run.app/manifest.webmanifest"
bubblewrap build`;

  const assetlinksCode = `// Arquivo: public/.well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.chartaipus.app",
      "sha256_cert_fingerprints": [
        "SEU_SHA256_FINGERPRINT_AQUI"
      ]
    }
  }
]`;

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#101914] via-[#14261C] to-[#101914] rounded-2xl border border-[#00E6A0]/30 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
              <Sparkles className="w-3.5 h-3.5" /> Google Play Store & TWA Ready
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-white">
              Centro de Excelência & Publicação na Google Play Store
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              O <strong>Chart AI Plus</strong> foi projetado e arquitetado segundo as diretrizes de Trusted Web Activity (TWA) e Progressive Web App (PWA) de alto desempenho para publicação direta na loja oficial do Google Android.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center md:items-end gap-2">
            <PWAInstallButton variant="hero" />
            <span className="text-[11px] text-zinc-400">Instale no celular para testar agora</span>
          </div>
        </div>
      </div>

      {/* Compliance Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Item 1 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Web App Manifest</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Configurado com <code className="text-[#00E6A0]">display: standalone</code>, orientação retrato, categoria financeira e paleta de cores nativa.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ícones Mascaráveis</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Ícones de alta resolução 192x192 e 512x512 com safe-zone de 15% para adaptação perfeita a qualquer launcher Android (círculos e squircles).
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Service Worker & Cache</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Estratégia NetworkFirst com fallback em cache local, garantindo inicialização ultrarrápida e funcionamento em redes instáveis.
            </p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Digital Asset Links</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Estrutura <code className="text-[#00E6A0]">/.well-known/assetlinks.json</code> pronta para eliminar a barra de URL do navegador no Android.
            </p>
          </div>
        </div>

        {/* Item 5 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Touch & Ergonomia Mobile</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Alvos de toque superiores a 44px, barra de navegação inferior com suporte a gestos e feedback tátil.
            </p>
          </div>
        </div>

        {/* Item 6 */}
        <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-4 shadow-md flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-[#00E6A0] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Políticas Financeiras</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Avisos regulatórios claros de caráter educacional/informativo em conformidade com as regras do Google Play para apps financeiros.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Publishing Guide */}
      <div className="bg-[#101914] rounded-2xl border border-[#22332B] p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1E2E25] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#00E6A0]" />
          <div>
            <h3 className="text-sm font-bold text-white">Passo a Passo para Gerar o Pacote (.AAB) do Google Play</h3>
            <p className="text-xs text-zinc-400">Escolha um dos dois métodos padrão recomendados pelo Google:</p>
          </div>
        </div>

        {/* Method 1: PWABuilder (Visual / Mais Simples) */}
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#1E2E25] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00E6A0] text-[#0A100D] flex items-center justify-center font-bold text-[10px]">
                A
              </span>
              Método 1: PWABuilder da Microsoft (Recomendado para geração online)
            </span>
            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00E6A0] hover:underline flex items-center gap-1 font-semibold"
            >
              Acessar PWABuilder <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
            <li>Acesse <strong>pwabuilder.com</strong> e cole o link publicado da sua aplicação.</li>
            <li>O verificador validará o Manifest e os Ícones 512x512 criados neste projeto com nota máxima.</li>
            <li>Clique em <strong>Package for Stores</strong> e selecione <strong>Android (Google Play)</strong>.</li>
            <li>Baixe o arquivo <code>.aab</code> (Android App Bundle) gerado, pronto para upload no Google Play Console.</li>
          </ol>
        </div>

        {/* Method 2: Bubblewrap CLI (Google Oficial) */}
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#1E2E25] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#00E6A0] text-[#0A100D] flex items-center justify-center font-bold text-[10px]">
                B
              </span>
              Método 2: Google Bubblewrap CLI (Oficial para desenvolvedores)
            </span>
            <button
              onClick={() => copyToClipboard(bubblewrapCode, 'bubblewrap')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {copiedCode === 'bubblewrap' ? <Check className="w-3 h-3 text-[#00E6A0]" /> : <Copy className="w-3 h-3" />}
              {copiedCode === 'bubblewrap' ? 'Copiado!' : 'Copiar Comandos'}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Execute os comandos abaixo em sua máquina com o Android SDK ou Node.js instalado:
          </p>
          <pre className="p-3 rounded-lg bg-[#050806] border border-[#1F3327] text-zinc-200 font-mono text-[11px] overflow-x-auto">
            {bubblewrapCode}
          </pre>
        </div>

        {/* Digital Asset Links */}
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#1E2E25] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#00E6A0]" />
              Vinculação de Domínio (assetlinks.json)
            </span>
            <button
              onClick={() => copyToClipboard(assetlinksCode, 'assetlinks')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {copiedCode === 'assetlinks' ? <Check className="w-3 h-3 text-[#00E6A0]" /> : <Copy className="w-3 h-3" />}
              {copiedCode === 'assetlinks' ? 'Copiado!' : 'Copiar JSON'}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Quando você gerar sua chave de assinatura no Google Play Console, copie o <strong>SHA-256 Fingerprint</strong> e cole em <code>public/.well-known/assetlinks.json</code>. O app já serve este endpoint automaticamente.
          </p>
          <pre className="p-3 rounded-lg bg-[#050806] border border-[#1F3327] text-[#00E6A0] font-mono text-[11px] overflow-x-auto">
            {assetlinksCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
