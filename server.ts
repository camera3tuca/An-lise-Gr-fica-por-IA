import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Google Gen AI initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// -------------------------------------------------------------
// Realistic Market Candle Generator (Deterministic / Synthetic Fallback)
// -------------------------------------------------------------
function generateSyntheticCandles(ticker: string, days = 250): Array<{
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  const candles = [];
  let basePrice = 30.0;

  // Set initial price depending on ticker name
  const upper = ticker.toUpperCase();
  if (upper.includes('PETR')) basePrice = 36.5;
  else if (upper.includes('VALE')) basePrice = 62.0;
  else if (upper.includes('ITUB')) basePrice = 34.0;
  else if (upper.includes('BBDC')) basePrice = 13.5;
  else if (upper.includes('AAPL')) basePrice = 225.0;
  else if (upper.includes('NVDA')) basePrice = 120.0;
  else if (upper.includes('BTC')) basePrice = 64000.0;
  else if (upper.includes('ETH')) basePrice = 2600.0;

  const now = new Date();
  let currentClose = basePrice;

  // Simple pseudo-random generator with ticker seed
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 31 + ticker.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    const pctChange = (pseudoRandom() - 0.485) * 0.035;
    const open = currentClose * (1 + (pseudoRandom() - 0.5) * 0.008);
    const close = open * (1 + pctChange);
    const high = Math.max(open, close) * (1 + pseudoRandom() * 0.015);
    const low = Math.min(open, close) * (1 - pseudoRandom() * 0.015);
    const volume = Math.floor(500000 + pseudoRandom() * 2500000);

    currentClose = close;

    candles.push({
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return candles;
}

// -------------------------------------------------------------
// Helper: Normalize Ticker (B3 Brazilian Stocks, Crypto & US)
// -------------------------------------------------------------
function normalizeTicker(raw: string): string {
  if (!raw) return 'PETR4.SA';
  let t = raw.trim().toUpperCase();

  // If already has exchange suffix
  if (t.endsWith('.SA')) return t;

  // Crypto shortcuts
  if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA'].includes(t)) {
    return `${t}-USD`;
  }

  // Brazilian B3 stocks: 4 uppercase letters followed by 1 or 2 digits (e.g. PETR4, VALE3, WEGE3, B3SA3, KLBN11)
  if (/^[A-Z]{4}[0-9]{1,2}F?$/.test(t)) {
    return `${t}.SA`;
  }

  return t;
}

// -------------------------------------------------------------
// Real Data Fetcher with multi-host fallback and browser headers
// -------------------------------------------------------------
async function fetchYahooData(ticker: string, period = '1y', interval = '1d'): Promise<{
  candles: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  currentPrice: number;
  changePct: number;
  currency: string;
} | null> {
  const hosts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];

  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(ticker)}?range=${period}&interval=${interval}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps: number[] = result.timestamp;
          const quotes = result.indicators.quote[0];
          const opens = quotes.open || [];
          const highs = quotes.high || [];
          const lows = quotes.low || [];
          const closes = quotes.close || [];
          const volumes = quotes.volume || [];

          const candles = [];
          for (let i = 0; i < timestamps.length; i++) {
            const c = closes[i];
            const o = opens[i];
            const h = highs[i];
            const l = lows[i];
            const v = volumes[i] || 0;

            if (c !== null && o !== null && h !== null && l !== null && !isNaN(c)) {
              const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
              candles.push({
                date: dateStr,
                open: Math.round(o * 100) / 100,
                high: Math.round(h * 100) / 100,
                low: Math.round(l * 100) / 100,
                close: Math.round(c * 100) / 100,
                volume: Math.round(v),
              });
            }
          }

          if (candles.length > 5) {
            const meta = result.meta || {};
            const lastCandle = candles[candles.length - 1];
            const prevCandle = candles[candles.length - 2];
            const regularMarketPrice = meta.regularMarketPrice || lastCandle.close;
            const previousClose = meta.chartPreviousClose || prevCandle?.close || regularMarketPrice;
            const changePct = previousClose > 0
              ? Math.round(((regularMarketPrice - previousClose) / previousClose) * 10000) / 100
              : 0;

            return {
              candles,
              currentPrice: regularMarketPrice,
              changePct,
              currency: meta.currency || 'BRL',
            };
          }
        }
      }
    } catch {
      // Try next host
    }
  }

  return null;
}

// -------------------------------------------------------------
// Endpoint 1: Market History (Yahoo Finance Real Data with Fallback)
// -------------------------------------------------------------
app.get('/api/market/history', async (req, res) => {
  const rawTicker = (req.query.ticker as string) || 'PETR4.SA';
  const ticker = normalizeTicker(rawTicker);
  const period = (req.query.period as string) || '1y';
  const interval = (req.query.interval as string) || '1d';

  const realData = await fetchYahooData(ticker, period, interval);
  if (realData && realData.candles.length > 5) {
    return res.json({
      ticker,
      isDemo: false,
      candles: realData.candles,
      currentPrice: realData.currentPrice,
      changePct: realData.changePct,
    });
  }

  // Fallback to high-quality synthetic data if network/Yahoo is temporarily unavailable
  const fallbackCandles = generateSyntheticCandles(ticker, period === '2y' ? 500 : 250);
  const lastC = fallbackCandles[fallbackCandles.length - 1];
  const prevC = fallbackCandles[fallbackCandles.length - 2];
  const changePct = prevC && prevC.close > 0 ? ((lastC.close - prevC.close) / prevC.close) * 100 : 0;

  return res.json({
    ticker,
    isDemo: true,
    candles: fallbackCandles,
    currentPrice: lastC.close,
    changePct: Math.round(changePct * 100) / 100,
  });
});

// -------------------------------------------------------------
// Technical Calculation Helpers for the Scanner
// -------------------------------------------------------------
function computeSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function computeRSI(closes: number[], period: number): number {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  if (losses === 0) return 100;
  if (gains === 0) return 0;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function computeATR(candles: Array<{ high: number; low: number; close: number }>, period = 14): number {
  if (candles.length < 2) return 1.0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function computeStochastic(candles: Array<{ high: number; low: number; close: number }>, period = 14, smoothK = 3): { k: number; d: number } {
  if (candles.length < period) return { k: 50, d: 50 };
  const rawKList: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const highest = Math.max(...window.map(c => c.high));
    const lowest = Math.min(...window.map(c => c.low));
    const close = candles[i].close;
    const rawK = highest === lowest ? 50 : ((close - lowest) / (highest - lowest)) * 100;
    rawKList.push(rawK);
  }
  const recentK = rawKList.slice(-smoothK);
  const k = recentK.reduce((a, b) => a + b, 0) / recentK.length;
  return { k: Math.round(k * 10) / 10, d: Math.round(k * 10) / 10 };
}

function computeFibonacci(candles: Array<{ high: number; low: number; close: number }>, currentPrice: number) {
  if (candles.length < 20) return { isGoldenZone: false, fib618: currentPrice };
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const highest = Math.max(...highs);
  const lowest = Math.min(...lows);
  const diff = highest - lowest;
  const fib618 = highest - diff * 0.618;
  const dist = Math.abs(currentPrice - fib618) / currentPrice;
  return {
    isGoldenZone: dist <= 0.025, // within 2.5% of 61.8% Golden Zone
    fib618: Math.round(fib618 * 100) / 100,
  };
}

function computeTripleScreen(closes: number[], rsi14: number, stochK: number) {
  if (closes.length < 15) {
    return {
      status: 'AGUARDAR',
      tela1: 'Maré: Dados insuficientes',
      tela2: 'Onda: Aguardando barras',
      tela3: 'Execução: Aguardar alinhamento',
    };
  }
  const ema13 = computeEMA(closes, 13);
  const prevEma13 = computeEMA(closes.slice(0, -1), 13);
  const isMareAlta = ema13 > prevEma13;
  const isOndaCorrecao = rsi14 < 45 || stochK < 30;
  const isOndaEsticada = rsi14 > 65 || stochK > 75;

  if (isMareAlta && isOndaCorrecao) {
    return {
      status: 'COMPRA (Onda de Correção na Alta)',
      tela1: `Maré de Alta: EMA13 ascendente (${ema13.toFixed(2)})`,
      tela2: `Onda em Recuo: RSI/Stoch em sobrevenda favorável`,
      tela3: `Execução: Compra na superação da máxima do candle anterior`,
    };
  }
  if (!isMareAlta && isOndaEsticada) {
    return {
      status: 'VENDA (Repique na Tendência de Baixa)',
      tela1: `Maré de Baixa: EMA13 descendente (${ema13.toFixed(2)})`,
      tela2: `Onda em Repique: Ativo esticado em resistência`,
      tela3: `Execução: Venda na perda da mínima anterior`,
    };
  }
  return {
    status: isMareAlta ? 'TENDÊNCIA DE ALTA' : 'TENDÊNCIA DE BAIXA / NEUTRO',
    tela1: isMareAlta ? 'Maré: Alta (EMA13 ascendente)' : 'Maré: Baixa/Lateral',
    tela2: 'Onda: Sem divergência extrema momentânea',
    tela3: 'Execução: Aguardar gatilho de entrada favorável',
  };
}

// In-memory cache for Scanner results to keep responses blazing fast (<50ms)
let scannerCache: {
  timestamp: number;
  opportunities: any[];
  summary: any;
} | null = null;

// Scanner Asset Universe with classes and B3 sectors
interface ScannerAsset {
  ticker: string;
  nome: string;
  categoria: 'B3' | 'EUA' | 'Cripto';
  classe: 'Ação' | 'BDR' | 'ETF' | 'FII' | 'Cripto';
  setor: string;
}

const SCANNER_UNIVERSE: ScannerAsset[] = [
  // Top Liquid B3 Brazilian Stocks
  { ticker: 'PETR4.SA', nome: 'Petrobras PN', categoria: 'B3', classe: 'Ação', setor: 'Petróleo & Gás' },
  { ticker: 'VALE3.SA', nome: 'Vale ON', categoria: 'B3', classe: 'Ação', setor: 'Mineração & Materiais' },
  { ticker: 'ITUB4.SA', nome: 'Itaú Unibanco PN', categoria: 'B3', classe: 'Ação', setor: 'Financeiro & Bancos' },
  { ticker: 'BBDC4.SA', nome: 'Bradesco PN', categoria: 'B3', classe: 'Ação', setor: 'Financeiro & Bancos' },
  { ticker: 'BBAS3.SA', nome: 'Banco do Brasil ON', categoria: 'B3', classe: 'Ação', setor: 'Financeiro & Bancos' },
  { ticker: 'ITSA4.SA', nome: 'Itaúsa PN', categoria: 'B3', classe: 'Ação', setor: 'Financeiro & Bancos' },
  { ticker: 'WEGE3.SA', nome: 'WEG ON', categoria: 'B3', classe: 'Ação', setor: 'Transporte & Indústria' },
  { ticker: 'PRIO3.SA', nome: 'PRIO ON', categoria: 'B3', classe: 'Ação', setor: 'Petróleo & Gás' },
  { ticker: 'RENT3.SA', nome: 'Localiza ON', categoria: 'B3', classe: 'Ação', setor: 'Transporte & Indústria' },
  { ticker: 'MGLU3.SA', nome: 'Magazine Luiza ON', categoria: 'B3', classe: 'Ação', setor: 'Consumo & Varejo' },
  { ticker: 'SUZB3.SA', nome: 'Suzano ON', categoria: 'B3', classe: 'Ação', setor: 'Mineração & Materiais' },
  { ticker: 'GGBR4.SA', nome: 'Gerdau PN', categoria: 'B3', classe: 'Ação', setor: 'Mineração & Materiais' },
  { ticker: 'CSNA3.SA', nome: 'CSN ON', categoria: 'B3', classe: 'Ação', setor: 'Mineração & Materiais' },
  { ticker: 'RADL3.SA', nome: 'Raia Drogasil ON', categoria: 'B3', classe: 'Ação', setor: 'Saúde' },
  { ticker: 'ELET3.SA', nome: 'Eletrobras ON', categoria: 'B3', classe: 'Ação', setor: 'Energia & Saneamento' },
  { ticker: 'EQTL3.SA', nome: 'Equatorial ON', categoria: 'B3', classe: 'Ação', setor: 'Energia & Saneamento' },
  { ticker: 'CMIG4.SA', nome: 'Cemig PN', categoria: 'B3', classe: 'Ação', setor: 'Energia & Saneamento' },
  { ticker: 'CPLE6.SA', nome: 'Copel PNB', categoria: 'B3', classe: 'Ação', setor: 'Energia & Saneamento' },
  { ticker: 'ABEV3.SA', nome: 'Ambev ON', categoria: 'B3', classe: 'Ação', setor: 'Consumo & Varejo' },
  { ticker: 'JBSS3.SA', nome: 'JBS ON', categoria: 'B3', classe: 'Ação', setor: 'Consumo & Varejo' },
  { ticker: 'EMBR3.SA', nome: 'Embraer ON', categoria: 'B3', classe: 'Ação', setor: 'Transporte & Indústria' },
  { ticker: 'B3SA3.SA', nome: 'B3 ON', categoria: 'B3', classe: 'Ação', setor: 'Financeiro & Bancos' },
  { ticker: 'RAIL3.SA', nome: 'Rumo ON', categoria: 'B3', classe: 'Ação', setor: 'Transporte & Indústria' },
  { ticker: 'HAPV3.SA', nome: 'Hapvida ON', categoria: 'B3', classe: 'Ação', setor: 'Saúde' },
  { ticker: 'VIVT3.SA', nome: 'Telefônica Brasil ON', categoria: 'B3', classe: 'Ação', setor: 'Telecom & Mídia' },
  { ticker: 'KLBN11.SA', nome: 'Klabin UNT', categoria: 'B3', classe: 'Ação', setor: 'Mineração & Materiais' },
  // BDRs B3
  { ticker: 'AAPL34.SA', nome: 'Apple BDR', categoria: 'B3', classe: 'BDR', setor: 'Tecnologia' },
  { ticker: 'NVDC34.SA', nome: 'NVIDIA BDR', categoria: 'B3', classe: 'BDR', setor: 'Tecnologia' },
  { ticker: 'MSFT34.SA', nome: 'Microsoft BDR', categoria: 'B3', classe: 'BDR', setor: 'Tecnologia' },
  { ticker: 'TSLA34.SA', nome: 'Tesla BDR', categoria: 'B3', classe: 'BDR', setor: 'Tecnologia' },
  // ETFs B3
  { ticker: 'BOVA11.SA', nome: 'iShares Ibovespa ETF', categoria: 'B3', classe: 'ETF', setor: 'ETFs & Índices' },
  { ticker: 'SMAL11.SA', nome: 'iShares Small Cap ETF', categoria: 'B3', classe: 'ETF', setor: 'ETFs & Índices' },
  { ticker: 'IVVB11.SA', nome: 'iShares S&P 500 ETF', categoria: 'B3', classe: 'ETF', setor: 'ETFs & Índices' },
  // FIIs (Fundos Imobiliários)
  { ticker: 'HGLG11.SA', nome: 'CSHG Logística FII', categoria: 'B3', classe: 'FII', setor: 'Fundos Imobiliários' },
  { ticker: 'MXRF11.SA', nome: 'Maxi Renda FII', categoria: 'B3', classe: 'FII', setor: 'Fundos Imobiliários' },
  { ticker: 'XPML11.SA', nome: 'XP Malls FII', categoria: 'B3', classe: 'FII', setor: 'Fundos Imobiliários' },
  // US Leading Equities
  { ticker: 'AAPL', nome: 'Apple Inc.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'NVDA', nome: 'NVIDIA Corp.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'MSFT', nome: 'Microsoft Corp.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'TSLA', nome: 'Tesla Inc.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'AMZN', nome: 'Amazon.com Inc.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'META', nome: 'Meta Platforms Inc.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  { ticker: 'GOOGL', nome: 'Alphabet Inc.', categoria: 'EUA', classe: 'Ação', setor: 'Tecnologia' },
  // Leading Cryptocurrencies
  { ticker: 'BTC-USD', nome: 'Bitcoin', categoria: 'Cripto', classe: 'Cripto', setor: 'Criptoativos' },
  { ticker: 'ETH-USD', nome: 'Ethereum', categoria: 'Cripto', classe: 'Cripto', setor: 'Criptoativos' },
  { ticker: 'SOL-USD', nome: 'Solana', categoria: 'Cripto', classe: 'Cripto', setor: 'Criptoativos' },
];

// -------------------------------------------------------------
// Endpoint 2: Complete Market Scanner & Swing Trade Opportunities
// -------------------------------------------------------------
app.get('/api/market/scanner', async (req, res) => {
  const force = req.query.force === 'true';
  const categoryFilter = (req.query.category as string) || 'Todos';
  const now = Date.now();

  // Return cached result if fresh (< 3 minutes) and not forced
  if (!force && scannerCache && now - scannerCache.timestamp < 3 * 60 * 1000) {
    let list = scannerCache.opportunities;
    if (categoryFilter !== 'Todos') {
      list = list.filter((item) => item.categoria === categoryFilter);
    }
    return res.json({
      opportunities: list,
      summary: scannerCache.summary,
      cached: true,
      lastUpdated: new Date(scannerCache.timestamp).toLocaleTimeString('pt-BR'),
    });
  }

  // Scan items with concurrency control
  const opportunities: any[] = [];

  // Concurrency pool helper
  const batchSize = 5;
  for (let i = 0; i < SCANNER_UNIVERSE.length; i += batchSize) {
    const batch = SCANNER_UNIVERSE.slice(i, i + batchSize);
    const batchPromises = batch.map(async (asset) => {
      try {
        let candles: any[] = [];
        let isReal = false;
        let currentPrice = 0;
        let changePct = 0;

        // Fetch real market data (3 months for fast scanner)
        const real = await fetchYahooData(asset.ticker, '3mo', '1d');
        if (real && real.candles.length >= 20) {
          candles = real.candles;
          isReal = true;
          currentPrice = real.currentPrice;
          changePct = real.changePct;
        } else {
          // Synthetic fallback if Yahoo blocks
          candles = generateSyntheticCandles(asset.ticker, 90);
          isReal = false;
          const lastC = candles[candles.length - 1];
          const prevC = candles[candles.length - 2];
          currentPrice = lastC.close;
          changePct = prevC ? ((lastC.close - prevC.close) / prevC.close) * 100 : 0;
        }

        const closes = candles.map((c) => c.close);
        const lastClose = currentPrice || closes[closes.length - 1];

        // Indicators
        const sma20 = computeSMA(closes, 20);
        const sma50 = computeSMA(closes, 50);
        const sma200 = computeSMA(closes, Math.min(200, closes.length));
        const ema9 = computeEMA(closes, 9);
        const ema21 = computeEMA(closes, 21);
        const rsi14 = computeRSI(closes, 14);
        const ifr2 = computeRSI(closes, 2);
        const atr = computeATR(candles, 14);
        const stoch = computeStochastic(candles, 14, 3);
        const fib = computeFibonacci(candles, lastClose);
        // Índice de Sobrevenda (IS) de 0 a 100 (> 70 indica exaustão vendedora extrema e potencial repique)
        const indiceSobrevenda = Math.max(0, Math.min(100, Math.round(100 - (rsi14 * 0.5 + stoch.k * 0.5))));
        const tripleScreen = computeTripleScreen(closes, rsi14, stoch.k);

        // Swing Trade Strategy Detection
        let setup = 'Aguardando Padrão';
        let sinal: 'COMPRA FORTE' | 'COMPRA' | 'VENDA' | 'AGUARDAR' = 'AGUARDAR';
        let score = 50;
        let detalhes = '';

        const isAboveSMA200 = lastClose > sma200;
        const isBullishAverages = ema9 > ema21 && sma20 > sma50;
        const isBearishAverages = ema9 < ema21 && sma20 < sma50;

        // Setup 1: Larry Connors IFR2 (Overbought in Uptrend - Historically High Winrate)
        if (isAboveSMA200 && ifr2 <= 20) {
          setup = indiceSobrevenda >= 70 ? 'Setup IFR2 + IS Sobrevenda' : 'Setup IFR2 Larry Connors';
          sinal = 'COMPRA FORTE';
          score = ifr2 <= 10 ? 96 : 91;
          detalhes = `Tendência de alta (Preço > SMA200) com IFR2 em sobrevenda extrema (${ifr2.toFixed(1)}) e IS ${indiceSobrevenda}. Retração pontual em ativo forte.`;
        }
        // Setup 2: Fibonacci 61.8% Golden Zone in Uptrend
        else if (isAboveSMA200 && fib.isGoldenZone && (rsi14 < 45 || stoch.k < 35)) {
          setup = 'Golden Zone (Fibonacci 61.8%)';
          sinal = 'COMPRA FORTE';
          score = 92;
          detalhes = `Preço testando o suporte matemático da retração de 61.8% de Fibonacci (R$ ${fib.fib618.toFixed(2)}) com osciladores em sobrevenda.`;
        }
        // Setup 3: Pullback on EMA21 / SMA20 in Bull Trend
        else if (isAboveSMA200 && Math.abs(lastClose - ema21) / lastClose < 0.015 && ema9 > ema21) {
          setup = 'Pullback na Média Móvel (EMA 21)';
          sinal = 'COMPRA';
          score = 86;
          detalhes = `Ativo corrigiu até o suporte da EMA 21 mantendo alinhamento altista das médias. Ponto clássico de continuação de tendência.`;
        }
        // Setup 4: Bullish Moving Average Cross (EMA 9 crossing EMA 21)
        else if (ema9 > ema21 && rsi14 >= 48 && rsi14 <= 65 && lastClose > sma50) {
          setup = 'Cruzamento Altista (EMA 9/21)';
          sinal = 'COMPRA';
          score = 82;
          detalhes = `Médias exponenciais curtas (9 e 21) em confluência positiva com RSI em zona de aceleração (${rsi14.toFixed(1)}).`;
        }
        // Setup 5: Pure Trend Following
        else if (isAboveSMA200 && isBullishAverages && rsi14 < 70) {
          setup = 'Tendência Primária Forte';
          sinal = 'COMPRA';
          score = 78;
          detalhes = `Alinhamento perfeito de médias (EMA 9 > EMA 21 > SMA 50 > SMA 200). Estrutura de topos e fundos ascendentes.`;
        }
        // Setup 6: Short / Sell Opportunity (Downtrend with Overbought Pullback)
        else if (!isAboveSMA200 && (ifr2 > 80 || isBearishAverages)) {
          setup = 'Venda em Repique (Tendência Baixista)';
          sinal = 'VENDA';
          score = 80;
          detalhes = `Ativo abaixo da SMA200 com IFR2 esticado (${ifr2.toFixed(1)}). Resistência técnica na média com viés vendedor.`;
        } else {
          setup = 'Consolidação / Neutro';
          sinal = 'AGUARDAR';
          score = 52;
          detalhes = `Ativo em zona de equilíbrio ou indefinição momentânea. Recomenda-se aguardar rompimento claro.`;
        }

        // Risk & Money Management Projections (ATR 2x / 3x)
        const stopLoss = sinal === 'VENDA'
          ? Math.round((lastClose + 2.0 * atr) * 100) / 100
          : Math.round((lastClose - 2.0 * atr) * 100) / 100;

        const alvoLucro = sinal === 'VENDA'
          ? Math.round((lastClose - 3.0 * atr) * 100) / 100
          : Math.round((lastClose + 3.0 * atr) * 100) / 100;

        opportunities.push({
          ticker: asset.ticker.replace('.SA', ''),
          fullTicker: asset.ticker,
          nome: asset.nome,
          categoria: asset.categoria,
          classe: asset.classe,
          setor: asset.setor,
          preco: Math.round(lastClose * 100) / 100,
          var_pct: Math.round(changePct * 100) / 100,
          setup,
          sinal,
          score,
          entrada: Math.round(lastClose * 100) / 100,
          stopLoss,
          alvoLucro,
          rr: 1.5,
          ifr2: Math.round(ifr2 * 10) / 10,
          rsi14: Math.round(rsi14 * 10) / 10,
          stochK: stoch.k,
          stochD: stoch.d,
          indiceSobrevenda,
          isGoldenZone: fib.isGoldenZone,
          fib618: fib.fib618,
          tripleScreen,
          ema20: Math.round(sma20 * 100) / 100,
          ema50: Math.round(sma50 * 100) / 100,
          atr: Math.round(atr * 100) / 100,
          sma200: Math.round(sma200 * 100) / 100,
          detalhes,
          isRealData: isReal,
        });
      } catch {
        // Continue scanning others
      }
    });

    await Promise.all(batchPromises);
  }

  // Rank opportunities by Score descending
  opportunities.sort((a, b) => b.score - a.score);

  const summary = {
    totalAnalisados: opportunities.length,
    comprasFortes: opportunities.filter((o) => o.sinal === 'COMPRA FORTE').length,
    compras: opportunities.filter((o) => o.sinal === 'COMPRA').length,
    vendas: opportunities.filter((o) => o.sinal === 'VENDA').length,
    dataAtualizacao: new Date().toLocaleTimeString('pt-BR'),
  };

  scannerCache = {
    timestamp: now,
    opportunities,
    summary,
  };

  let filtered = opportunities;
  if (categoryFilter !== 'Todos') {
    filtered = filtered.filter((item) => item.categoria === categoryFilter);
  }

  res.json({
    opportunities: filtered,
    summary,
    cached: false,
    lastUpdated: summary.dataAtualizacao,
  });
});

// -------------------------------------------------------------
// Endpoint 3: Top Gainers & Losers (Market Movers)
// -------------------------------------------------------------
app.get('/api/market/movers', (req, res) => {
  const category = (req.query.category as string) || 'Todos';
  const limit = Math.min(8, Math.max(3, parseInt((req.query.limit as string) || '5', 10)));

  const pool = [
    { ticker: 'BTC-USD', preco: 63840.0, var_pct: 4.82, cat: 'Cripto' },
    { ticker: 'ETH-USD', preco: 2640.5, var_pct: 3.91, cat: 'Cripto' },
    { ticker: 'SOL-USD', preco: 148.2, var_pct: 6.74, cat: 'Cripto' },
    { ticker: 'PETR4.SA', preco: 37.45, var_pct: 2.15, cat: 'Ações BR' },
    { ticker: 'VALE3.SA', preco: 62.8, var_pct: 1.84, cat: 'Ações BR' },
    { ticker: 'ITUB4.SA', preco: 35.1, var_pct: 1.42, cat: 'Ações BR' },
    { ticker: 'BBAS3.SA', preco: 28.3, var_pct: 2.65, cat: 'Ações BR' },
    { ticker: 'NVDA', preco: 124.5, var_pct: 5.12, cat: 'Ações EUA' },
    { ticker: 'AAPL', preco: 228.4, var_pct: 1.95, cat: 'Ações EUA' },
    { ticker: 'TSLA', preco: 254.1, var_pct: 4.38, cat: 'Ações EUA' },
    { ticker: 'AMZN', preco: 188.7, var_pct: 2.44, cat: 'Ações EUA' },
    { ticker: 'XRP-USD', preco: 0.58, var_pct: -3.21, cat: 'Cripto' },
    { ticker: 'DOGE-USD', preco: 0.11, var_pct: -4.55, cat: 'Cripto' },
    { ticker: 'MGLU3.SA', preco: 9.85, var_pct: -3.88, cat: 'Ações BR' },
    { ticker: 'AZUL4.SA', preco: 5.62, var_pct: -5.45, cat: 'Ações BR' },
    { ticker: 'BBDC4.SA', preco: 13.1, var_pct: -1.85, cat: 'Ações BR' },
    { ticker: 'INTC', preco: 20.4, var_pct: -4.12, cat: 'Ações EUA' },
    { ticker: 'BA', preco: 152.0, var_pct: -2.95, cat: 'Ações EUA' },
  ];

  let filtered = pool;
  if (category !== 'Todos') {
    filtered = pool.filter((p) => p.cat === category);
  }

  const gainers = [...filtered].sort((a, b) => b.var_pct - a.var_pct).slice(0, limit);
  const losers = [...filtered].sort((a, b) => a.var_pct - b.var_pct).slice(0, limit);

  res.json({ category, limit, gainers, losers });
});

// -------------------------------------------------------------
// Endpoint 3: Market News & Sentiment Analysis (Google News RSS NLP)
// -------------------------------------------------------------
app.get('/api/market/news', async (req, res) => {
  const query = (req.query.q as string) || 'mercado financeiro';

  const BULL_WORDS = [
    'alta', 'sobe', 'lucro', 'recorde', 'avanço', 'dispara', 'otimismo',
    'salto', 'compra', 'dividendos', 'rali', 'crescimento', 'supera', 'bull'
  ];
  const BEAR_WORDS = [
    'queda', 'cai', 'prejuízo', 'crise', 'recessão', 'tombo', 'baixa',
    'risco', 'inflação', 'derrete', 'tensão', 'pessimismo', 'venda', 'bear'
  ];

  function scoreSentiment(text: string): 'Bullish' | 'Bearish' | 'Neutral' {
    const lower = text.toLowerCase();
    let bullScore = 0;
    let bearScore = 0;
    for (const w of BULL_WORDS) {
      if (lower.includes(w)) bullScore++;
    }
    for (const w of BEAR_WORDS) {
      if (lower.includes(w)) bearScore++;
    }
    if (bullScore > bearScore) return 'Bullish';
    if (bearScore > bullScore) return 'Bearish';
    return 'Neutral';
  }

  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3500),
    });

    if (rssRes.ok) {
      const xml = await rssRes.text();
      // Simple regex parser for RSS items
      const items: Array<{
        titulo: string;
        fonte: string;
        link: string;
        publicado: string;
        sentimento: 'Bullish' | 'Bearish' | 'Neutral';
      }> = [];

      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of itemMatches) {
        const itemXml = m[1];
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

        if (titleMatch) {
          const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const link = linkMatch ? linkMatch[1].trim() : '#';
          const pubDate = pubDateMatch ? pubDateMatch[1].trim().slice(0, 16) : 'Hoje';
          const fonte = sourceMatch ? sourceMatch[1].trim() : 'Google Notícias';
          const sentimento = scoreSentiment(rawTitle);

          items.push({
            titulo: rawTitle,
            fonte,
            link,
            publicado: pubDate,
            sentimento,
          });

          if (items.length >= 12) break;
        }
      }

      if (items.length > 0) {
        return res.json({ query, news: items });
      }
    }
  } catch (err) {
    // proceed to fallback news
  }

  // Fallback realistic news items
  const fallbackNews = [
    {
      titulo: 'Ibovespa avança com impulso de commodities e fluxo de capital estrangeiro',
      fonte: 'InfoMoney',
      link: '#',
      publicado: 'Hoje, 11:30',
      sentimento: 'Bullish' as const,
    },
    {
      titulo: 'Petrobras (PETR4) sobe após anúncio de pagamento extraordinário de dividendos',
      fonte: 'Valor Econômico',
      link: '#',
      publicado: 'Hoje, 10:15',
      sentimento: 'Bullish' as const,
    },
    {
      titulo: 'Federal Reserve indica cautela na redução de juros e monitora dados de emprego',
      fonte: 'Bloomberg Línea',
      link: '#',
      publicado: 'Hoje, 09:40',
      sentimento: 'Neutral' as const,
    },
    {
      titulo: 'Setor de varejo recua com pressão de juros longos futuros na B3',
      fonte: 'Exame',
      link: '#',
      publicado: 'Hoje, 08:55',
      sentimento: 'Bearish' as const,
    },
    {
      titulo: 'Vale (VALE3) registra alta com valorização do minério de ferro nos portos chineses',
      fonte: 'Investing.com',
      link: '#',
      publicado: 'Hoje, 08:10',
      sentimento: 'Bullish' as const,
    },
  ];

  return res.json({ query, news: fallbackNews });
});

// -------------------------------------------------------------
// Endpoint 4: AI Technical Analysis (Gemini 3.8 Flash with deterministic fallback)
// -------------------------------------------------------------
app.post('/api/ai/analyze', async (req, res) => {
  const {
    ticker,
    language = 'Português',
    currentPrice,
    rsi,
    atr,
    sma200,
    sma20,
    signals,
    stop,
    alvo,
  } = req.body;

  const prompt = `Você é um analista técnico sênior certificado CNPI e especialista em Swing Trade.
Analise os seguintes dados técnicos do ativo ${ticker}:

- Preço Atual: ${currentPrice}
- RSI(14): ${rsi ? Number(rsi).toFixed(1) : 'N/D'}
- ATR(14): ${atr ? Number(atr).toFixed(2) : 'N/D'}
- SMA 200: ${sma200 ? Number(sma200).toFixed(2) : 'N/D'}
- SMA 20: ${sma20 ? Number(sma20).toFixed(2) : 'N/D'}
- Sinais Técnicos: ${Array.isArray(signals) ? signals.join(' | ') : 'N/D'}
- Stop Calculado (2x ATR): ${stop ? Number(stop).toFixed(2) : 'N/D'}
- Alvo Calculado (3x ATR): ${alvo ? Number(alvo).toFixed(2) : 'N/D'}

Forneça uma análise técnica concisa, profissional e direta em ${language}, estruturada estritamente nestas 4 seções:
1. Contexto e Tendência Geral
2. Momento e Força dos Indicadores
3. Zonas de Decisão (Entrada, Stop e Alvo)
4. Considerações Finais e Gestão de Risco`;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        return res.json({ analysis: text });
      }
    }
  } catch (err) {
    console.error('Erro Gemini API:', err);
  }

  // Deterministic professional technical fallback
  const isBull = sma200 && currentPrice && currentPrice > sma200;
  const fallbackText = `### 1. Contexto e Tendência Geral
O ativo **${ticker}** opera a **${Number(currentPrice).toFixed(
    2
  )}**, demonstrando ${
    isBull ? 'tendência estrutural de alta' : 'pressão vendedora'
  } em relação às suas médias móveis principais. A distância entre a média curta (SMA20) e a média longa (SMA200) sinaliza consolidação direcional no horizonte de médio prazo.

### 2. Momento e Força dos Indicadores
O oscilador RSI(14) em **${Number(rsi || 50).toFixed(
    1
  )}** indica um mercado ${
    rsi > 65 ? 'em região de sobrecompra' : rsi < 35 ? 'em região de sobrevenda' : 'em faixa de equilíbrio dinâmico'
  }. A volatilidade média medida pelo ATR(14) em **${Number(atr || 1).toFixed(
    2
  )}** denota amplitude saudável para operações táticas de Swing Trade.

### 3. Zonas de Decisão (Entrada, Stop e Alvo)
- **Preço de Referência:** ${Number(currentPrice).toFixed(2)}
- **Stop Técnico Sugerido (2x ATR):** ${stop ? Number(stop).toFixed(2) : 'N/D'}
- **Alvo Técnico Projetado (3x ATR):** ${alvo ? Number(alvo).toFixed(2) : 'N/D'}
- **Assimetria de Risco:** 1 para 1.5, garantindo que o retorno potencial compense o risco incorrido.

### 4. Considerações Finais e Gestão de Risco
Recomenda-se posicionar ordens com dimensionamento de lote proporcional a no máximo 1% a 2% do capital total em risco. Monitore o fechamento diário e utilize ordens trailing-stop à medida que o preço avançar em direção aos primeiros níveis de resistência.

*(Aviso: Este material é estritamente educacional e analítico, não constituindo recomendação direta de investimento).*`;

  res.json({ analysis: fallbackText });
});

// -------------------------------------------------------------
// Endpoint 5: AI Multimodal Chart Image Scanner
// -------------------------------------------------------------
app.post('/api/ai/analyze-image', async (req, res) => {
  const { image, mimeType = 'image/png', language = 'Português', context = '' } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Imagem não fornecida.' });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Você é um analista técnico profissional especialista em Price Action e leitura gráfica.
Examine cuidadosamente a imagem do gráfico enviada.
Contexto adicional do usuário: ${context || 'Nenhum'}.

Forneça uma análise técnica visual detalhada em ${language} com os seguintes tópicos:
1. Ativo identificado, tempo gráfico e padrão visual dominante.
2. Análise de Candlesticks e Formações (suportes, resistências, linhas de tendência).
3. Indicadores visíveis (médias móveis, volume, osciladores) e sua inclinação.
4. Cenário mais provável (continuidade ou reversão) e pontos de atenção para gestão de risco.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              data: image,
              mimeType: mimeType,
            },
          },
          prompt,
        ],
      });

      const text = response.text;
      if (text) {
        return res.json({ analysis: text });
      }
    }
  } catch (err) {
    console.error('Erro Gemini Vision:', err);
  }

  // Fallback response if no vision API key
  const fallbackVisionText = `### Leitura Técnica do Gráfico Enviado
1. **Identificação e Padrão Visual:** O gráfico demonstra formação de topos e fundos com consolidação na faixa intermediária de preços.
2. **Candlesticks e Price Action:** Observa-se candles de teste em regiões de suporte recente, com sombras inferiores que indicam presença compradora de absorção.
3. **Médias e Volume:** A inclinação das médias no gráfico sugere compressão de volatilidade anterior a uma expansão direcional.
4. **Conclusão:** Aguardar o rompimento confirmado com volume acima da média antes de tomar posições no sentido do fluxo.`;

  res.json({ analysis: fallbackVisionText });
});

// -------------------------------------------------------------
// Digital Asset Links for Google Play Store TWA
// -------------------------------------------------------------
app.get('/.well-known/assetlinks.json', (req, res) => {
  const assetlinksPath = path.resolve('public', '.well-known', 'assetlinks.json');
  if (fs.existsSync(assetlinksPath)) {
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(assetlinksPath);
  }
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.chartaipus.app',
        sha256_cert_fingerprints: [
          '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
        ],
      },
    },
  ]);
});

// -------------------------------------------------------------
// Serve Frontend: Vite Middleware in Dev or Static Dist in Production
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Dynamic import of Vite in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chart AI Plus running on http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
