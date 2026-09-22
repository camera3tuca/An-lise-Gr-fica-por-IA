# 📈 Chart AI Plus - Análise Técnica & Swing Trade

Aplicativo profissional de **análise técnica de gráficos da bolsa de valores e cripto**, com foco em **Swing Trade**, desenvolvido em **React, TypeScript, Vite, Express e Tailwind CSS**, arquitetado como **Progressive Web App (PWA)** de alta performance e pronto para publicação na **Google Play Store** via **Trusted Web Activity (TWA)**.

> ⚠️ **Aviso:** Todo o conteúdo é estritamente **educativo** e analítico. Não constitui recomendação de compra, venda ou manutenção de ativos financeiros. Decisões de investimento são de responsabilidade exclusiva do usuário.

---

## 🚀 Destaques e Nível de Excelência

- **Pronto para a Google Play Store**:
  - Manifesto PWA (`manifest.webmanifest`) com orientação retrato, tema nativo e categoria financeira.
  - Ícones mascaráveis em alta definição (192x192, 512x512) com margem segura de 15% para compatibilidade com qualquer launcher Android.
  - Suporte a **Digital Asset Links** (`/.well-known/assetlinks.json`) para integração nativa com o Android sem barra de URL do navegador.
  - Guia interativo integrado no app com passo a passo para gerar o pacote `.aab` via **PWABuilder** ou **Bubblewrap CLI**.
  - Botão de instalação nativo no app (`PWAInstallButton`) com detecção de plataforma (Android/Desktop e tutorial para iOS Safari).
- **Gráficos Financeiros Interativos de Alta Precisão**:
  - Candlesticks com wicks detalhados e coloração profissional (#00E6A0 para alta, #FF5A5A para baixa).
  - Médias móveis: **SMA 20/50/200** e **EMA 9/21**.
  - **Bandas de Bollinger** com preenchimento sombreado da zona de desvio.
  - Subplots sincronizados para **RSI(14)** (com linhas de sobrecompra 70 e sobrevenda 30) e **MACD** (com histograma e linha de sinal).
  - Linhas dinâmicas de **Suporte e Resistência** calculadas por fractais e pivôs.
  - Projeção de **Stop Loss (2x ATR)** e **Alvo Gain (3x ATR)**.
  - Crosshair dinâmico e HUD interativo com inspeção ao passar o mouse ou deslizar o dedo na tela móvel.
- **Setups Clássicos de Swing Trade**:
  - Filtro estrutural de tendência (SMA200).
  - Alinhamento de médias móveis intermediárias (SMA20 vs SMA50).
  - Cruzamento de médias exponenciais curtas (EMA9 vs EMA21).
  - Cruzamento e convergência/divergência do MACD.
  - Setup **IFR2 (Larry Connors)** para compras em sobrevenda contra a tendência de alta.
  - Força relativa estocástica clássica do RSI(14).
  - **Viés Consolidado** objetivo (contagem de compras vs. vendas).
- **Detecção Heurística de Padrões Gráficos**:
  - Ombro-Cabeça-Ombro (OCO) e OCO Invertido.
  - Topo Duplo e Fundo Duplo.
  - Estrutura de topos e fundos ascendentes (Tendência de Alta) e descendentes (Tendência de Baixa).
- **Mercado Global e Moções do Dia**:
  - **Top Gainers & Losers** filtrados por Cripto, Ações B3, Ações EUA e Todos.
- **Notícias e Sentimento em Tempo Real**:
  - Varredura de manchetes financeiras via RSS do Google Notícias.
  - Classificação algorítmica de sentimento (*Bullish*, *Bearish*, *Neutral*) e medidor geral.
- **Inteligência Artificial Google Gemini (foco central do app)**:
  - **Leitura gráfica automática por IA** de qualquer ativo: ao abrir um ticker, a análise técnica estruturada é gerada automaticamente com o modelo multimodal **Gemini 3.8 Flash**, como destaque principal da tela de Análise.
  - **Varredura de todos os ativos pela IA**: na aba *Varredura & Oportunidades*, o botão **"Analisar com IA"** faz o Gemini revisar todo o universo já pontuado pelo scanner e destacar as melhores oportunidades de swing (endpoint `/api/ai/scan`).
  - **Scanner visual de gráficos**: envio de screenshots de plataformas de trading (TradingView, Profit, MetaTrader) para análise técnica visual por IA.
  - Fallback local: sem `GEMINI_API_KEY`, o app entrega um resumo técnico determinístico para não ficar sem resposta.

> ℹ️ O guia de publicação na Play Store saiu da navegação do app (permanece nesta documentação); o preparo PWA/TWA — manifesto, ícones e `assetlinks.json` — continua intacto.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **PWA & Offline**: Vite Plugin PWA, Service Workers (Workbox) com estratégia NetworkFirst e precaching de assets.
- **Backend & APIs**: Node.js com Express e TypeScript (`tsx`), proxy seguro para APIs financeiras e Yahoo Finance.
- **IA**: `@google/genai` com Gemini 3.8 Flash (servidor seguro sem exposição de chaves no navegador).

---

## 📲 Publicação na Google Play Store

O projeto inclui o painel **Google Play Store** na barra de navegação com checklist completo:

1. **Geração do Android App Bundle (.aab)**:
   - **Opção A (Mais fácil)**: Acesse [PWABuilder](https://www.pwabuilder.com), insira o link da aplicação e gere o pacote Android para Google Play.
   - **Opção B (Bubblewrap CLI)**:
     ```bash
     npm install -g @bubblewrap/cli
     bubblewrap init --manifest="https://SEU-DOMINIO/manifest.webmanifest"
     bubblewrap build
     ```
2. **Configuração do Digital Asset Links**:
   - Adicione o SHA-256 da sua chave de assinatura gerada no Google Play Console no arquivo `public/.well-known/assetlinks.json`.

---

## 💻 Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar ambiente de desenvolvimento (porta 3000)
npm run dev

# 3. Gerar build de produção
npm run build

# 4. Iniciar em produção
npm start
```

Acesse **http://localhost:3000**.
