export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  SMA20?: number;
  SMA50?: number;
  SMA200?: number;
  EMA9?: number;
  EMA21?: number;
  bb_superior?: number;
  bb_media?: number;
  bb_inferior?: number;
  RSI?: number;
  RSI2?: number;
  ATR?: number;
  macd?: number;
  macd_sinal?: number;
  macd_hist?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema9?: number;
  ema21?: number;
  rsi?: number;
  rsi2?: number;
  atr?: number;
}

export type ProcessedCandle = Candle & IndicatorValues;
export type CandleWithIndicators = ProcessedCandle;

export type MarketType = 'B3 (Brasil)' | 'EUA / Outros' | 'B3' | 'EUA';
export type TimeframeType = '1d' | '1wk';
export type PeriodType = '6mo' | '1y' | '2y' | '5y';
export type PageId = 'analysis' | 'scanner' | 'movers' | 'news' | 'upload' | 'playstore';
export type BiasType = 'compra' | 'venda' | 'neutro';

export interface OpportunityItem {
  ticker: string;
  fullTicker?: string;
  nome: string;
  categoria: 'B3' | 'EUA' | 'Cripto';
  classe?: 'Ação' | 'BDR' | 'ETF' | 'FII' | 'Cripto';
  setor?: string;
  preco: number;
  var_pct: number;
  setup: string;
  sinal: 'COMPRA FORTE' | 'COMPRA' | 'VENDA' | 'AGUARDAR';
  score: number; // 0 to 100
  entrada: number;
  stopLoss: number;
  alvoLucro: number;
  rr: number; // e.g. 1.5
  ifr2: number;
  rsi14: number;
  stochK?: number;
  stochD?: number;
  indiceSobrevenda?: number; // IS: 0 - 100 (> 70 indica exaustão vendedora e potencial repique)
  isGoldenZone?: boolean; // Perto da retração de 61.8% de Fibonacci
  fib618?: number;
  tripleScreen?: {
    status: string;
    tela1: string;
    tela2: string;
    tela3: string;
  };
  ema20?: number;
  ema50?: number;
  atr: number;
  sma200: number;
  detalhes: string;
  isRealData: boolean;
}

export interface ScannerSummary {
  totalAnalisados: number;
  comprasFortes: number;
  compras: number;
  vendas: number;
  dataAtualizacao: string;
}

export interface SwingSignal {
  nome: string;
  sinal: BiasType;
  detalhe: string;
}
export type Signal = SwingSignal;

export interface StopTarget {
  entrada: number;
  stop: number;
  alvo: number;
  atr: number;
  risco: number;
  retorno: number;
}
export type RiskManagement = StopTarget;

export interface SmartInsights {
  tendencia: 'Alta' | 'Baixa' | 'Lateral';
  volatilidade: 'Baixa' | 'Moderado' | 'Alto';
  volume: 'Baixo' | 'Moderado' | 'Alto';
  sentimento: 'Otimista' | 'Neutro' | 'Pessimista';
}

export interface PatternItem {
  nome: string;
  vies: 'Otimista' | 'Pessimista' | 'Neutro';
  detalhe: string;
}
export type ChartPattern = PatternItem;

export interface SupportResistanceLevels {
  suportes: number[];
  resistencias: number[];
  preco: number;
}
export type SupportResistance = SupportResistanceLevels;

export interface MarketMover {
  ticker: string;
  preco: number;
  var_pct: number;
}
export type MoverItem = MarketMover;

export interface NewsItem {
  titulo: string;
  fonte: string;
  link: string;
  publicado: string;
  sentimento: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface MarketHistoryResponse {
  ticker: string;
  isDemo: boolean;
  candles: ProcessedCandle[];
  currentPrice: number;
  changePct: number;
  lastUpdated: string;
  signals: SwingSignal[];
  bias: BiasType;
  buyCount: number;
  sellCount: number;
  stopTarget: StopTarget | null;
  insights: SmartInsights;
  levels: SupportResistanceLevels;
  patterns: PatternItem[];
}
