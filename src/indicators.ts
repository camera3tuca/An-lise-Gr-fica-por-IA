import {
  Candle,
  ProcessedCandle,
  SwingSignal,
  BiasType,
  StopTarget,
  SmartInsights,
  PatternItem,
  SupportResistanceLevels
} from './types';

// Simple Moving Average
export function calculateSMA(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += values[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// Exponential Moving Average
export function calculateEMA(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | undefined = undefined;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }
    if (prevEMA === undefined) {
      // First EMA is SMA of first 'period' values
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += values[i - j];
      }
      prevEMA = sum / period;
      result.push(prevEMA);
    } else {
      prevEMA = val * k + prevEMA * (1 - k);
      result.push(prevEMA);
    }
  }
  return result;
}

// Bollinger Bands (20 periods, 2 std deviations)
export function calculateBollingerBands(
  values: number[],
  period = 20,
  multiplier = 2
): {
  upper: (number | undefined)[];
  middle: (number | undefined)[];
  lower: (number | undefined)[];
} {
  const middle = calculateSMA(values, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < values.length; i++) {
    const mid = middle[i];
    if (mid === undefined) {
      upper.push(undefined);
      lower.push(undefined);
      continue;
    }
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(values[i - j] - mid, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(mid + multiplier * stdDev);
    lower.push(mid - multiplier * stdDev);
  }

  return { upper, middle, lower };
}

// RSI (Wilder's method)
export function calculateRSI(values: number[], period = 14): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  if (values.length <= period) {
    return values.map(() => undefined);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      avgGain += diff;
    } else {
      avgLoss += Math.abs(diff);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  result.push(...Array(period).fill(undefined));

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

// ATR (Average True Range - Wilder)
export function calculateATR(candles: Candle[], period = 14): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const tr: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      const trueRange = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      tr.push(trueRange);
    }
  }

  let prevATR: number | undefined = undefined;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }
    if (prevATR === undefined) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += tr[i - j];
      }
      prevATR = sum / period;
      result.push(prevATR);
    } else {
      prevATR = (prevATR * (period - 1) + tr[i]) / period;
      result.push(prevATR);
    }
  }
  return result;
}

// MACD (12, 26, 9)
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macd: (number | undefined)[];
  signal: (number | undefined)[];
  histogram: (number | undefined)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | undefined)[] = [];
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== undefined && s !== undefined) {
      const diff = f - s;
      macdLine.push(diff);
      validMacdValues.push(diff);
      validIndices.push(i);
    } else {
      macdLine.push(undefined);
    }
  }

  const signalLine: (number | undefined)[] = Array(closes.length).fill(undefined);
  const histogram: (number | undefined)[] = Array(closes.length).fill(undefined);

  if (validMacdValues.length >= signalPeriod) {
    const rawSignal = calculateEMA(validMacdValues, signalPeriod);
    for (let j = 0; j < rawSignal.length; j++) {
      const actualIdx = validIndices[j];
      const sig = rawSignal[j];
      signalLine[actualIdx] = sig;
      if (sig !== undefined && macdLine[actualIdx] !== undefined) {
        histogram[actualIdx] = macdLine[actualIdx]! - sig;
      }
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

// Process All Indicators for candles
export function processAllIndicators(candles: Candle[]): ProcessedCandle[] {
  if (!candles || candles.length === 0) return [];
  const closes = candles.map((c) => c.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const bb = calculateBollingerBands(closes, 20, 2);
  const rsi14 = calculateRSI(closes, 14);
  const rsi2 = calculateRSI(closes, 2);
  const atr = calculateATR(candles, 14);
  const macd = calculateMACD(closes, 12, 26, 9);

  return candles.map((c, i) => ({
    ...c,
    SMA20: sma20[i],
    SMA50: sma50[i],
    SMA200: sma200[i],
    EMA9: ema9[i],
    EMA21: ema21[i],
    bb_superior: bb.upper[i],
    bb_media: bb.middle[i],
    bb_inferior: bb.lower[i],
    RSI: rsi14[i],
    RSI2: rsi2[i],
    ATR: atr[i],
    macd: macd.macd[i],
    macd_sinal: macd.signal[i],
    macd_hist: macd.histogram[i]
  }));
}

// Generate Swing Signals based on technical setups
export function generateSwingSignals(candles: ProcessedCandle[]): {
  signals: SwingSignal[];
  bias: BiasType;
  buyCount: number;
  sellCount: number;
} {
  if (!candles || candles.length < 2) {
    return { signals: [], bias: 'neutro', buyCount: 0, sellCount: 0 };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const price = last.close;
  const signals: SwingSignal[] = [];

  // 1) Primary Trend - SMA200
  if (last.SMA200 !== undefined) {
    if (price > last.SMA200) {
      signals.push({
        nome: 'Tendência (SMA200)',
        sinal: 'compra',
        detalhe: 'Preço acima da média de 200 — tendência estrutural de alta.'
      });
    } else {
      signals.push({
        nome: 'Tendência (SMA200)',
        sinal: 'venda',
        detalhe: 'Preço abaixo da média de 200 — tendência estrutural de baixa.'
      });
    }
  }

  // 2) Medium term trend - SMA20 vs SMA50
  if (last.SMA20 !== undefined && last.SMA50 !== undefined) {
    if (last.SMA20 > last.SMA50) {
      signals.push({
        nome: 'Médias 20/50',
        sinal: 'compra',
        detalhe: 'SMA20 acima da SMA50 — viés comprador de médio prazo.'
      });
    } else {
      signals.push({
        nome: 'Médias 20/50',
        sinal: 'venda',
        detalhe: 'SMA20 abaixo da SMA50 — viés vendedor de médio prazo.'
      });
    }
  }

  // 3) EMA9 x EMA21 Exponential Cross
  if (
    last.EMA9 !== undefined &&
    last.EMA21 !== undefined &&
    prev.EMA9 !== undefined &&
    prev.EMA21 !== undefined
  ) {
    if (prev.EMA9 <= prev.EMA21 && last.EMA9 > last.EMA21) {
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'compra',
        detalhe: 'EMA9 cruzou a EMA21 para cima (gatilho altista recente).'
      });
    } else if (prev.EMA9 >= prev.EMA21 && last.EMA9 < last.EMA21) {
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'venda',
        detalhe: 'EMA9 cruzou a EMA21 para baixo (gatilho baixista recente).'
      });
    } else {
      const pos = last.EMA9 >= last.EMA21 ? 'acima' : 'abaixo';
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'neutro',
        detalhe: `Sem cruzamento recente — EMA9 operando ${pos} da EMA21.`
      });
    }
  }

  // 4) MACD Cross & Position
  if (
    last.macd !== undefined &&
    last.macd_sinal !== undefined &&
    prev.macd !== undefined &&
    prev.macd_sinal !== undefined
  ) {
    if (prev.macd <= prev.macd_sinal && last.macd > last.macd_sinal) {
      signals.push({
        nome: 'MACD',
        sinal: 'compra',
        detalhe: 'Linha MACD cruzou o sinal para cima.'
      });
    } else if (prev.macd >= prev.macd_sinal && last.macd < last.macd_sinal) {
      signals.push({
        nome: 'MACD',
        sinal: 'venda',
        detalhe: 'Linha MACD cruzou o sinal para baixo.'
      });
    } else {
      const isUp = last.macd > last.macd_sinal;
      signals.push({
        nome: 'MACD',
        sinal: isUp ? 'compra' : 'venda',
        detalhe: `MACD operando ${isUp ? 'acima' : 'abaixo'} da linha de sinal.`
      });
    }
  }

  // 5) IFR2 (Larry Connors 2-period RSI)
  if (last.RSI2 !== undefined) {
    if (last.SMA200 !== undefined && price > last.SMA200 && last.RSI2 < 10) {
      signals.push({
        nome: 'IFR2 (Connors)',
        sinal: 'compra',
        detalhe: `RSI(2) = ${last.RSI2.toFixed(0)} em tendência de alta — gatilho de compra.`
      });
    } else if (last.RSI2 > 90) {
      signals.push({
        nome: 'IFR2 (Connors)',
        sinal: 'venda',
        detalhe: `RSI(2) = ${last.RSI2.toFixed(0)} — forte sobrecompra, possível realização.`
      });
    } else {
      signals.push({
        nome: 'IFR2 (Connors)',
        sinal: 'neutro',
        detalhe: `RSI(2) = ${last.RSI2.toFixed(0)} — dentro da zona normal.`
      });
    }
  }

  // 6) RSI14 Classic Strength
  if (last.RSI !== undefined) {
    if (last.RSI <= 30) {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'compra',
        detalhe: `RSI = ${last.RSI.toFixed(0)} — ativo sobrevendido.`
      });
    } else if (last.RSI >= 70) {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'venda',
        detalhe: `RSI = ${last.RSI.toFixed(0)} — ativo sobrecomprado.`
      });
    } else {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'neutro',
        detalhe: `RSI = ${last.RSI.toFixed(0)} — faixa neutra de equilíbrio.`
      });
    }
  }

  const buyCount = signals.filter((s) => s.sinal === 'compra').length;
  const sellCount = signals.filter((s) => s.sinal === 'venda').length;

  let bias: BiasType = 'neutro';
  if (buyCount > sellCount) bias = 'compra';
  else if (sellCount > buyCount) bias = 'venda';

  return { signals, bias, buyCount, sellCount };
}

// Calculate ATR Stop & Target (2x ATR stop, 3x ATR target)
export function calculateStopTarget(
  candles: ProcessedCandle[],
  bias: BiasType
): StopTarget | null {
  if (candles.length === 0 || bias === 'neutro') return null;
  const last = candles[candles.length - 1];
  const price = last.close;
  const atr = last.ATR;
  if (!atr || atr <= 0) return null;

  let stop: number;
  let alvo: number;

  if (bias === 'compra') {
    stop = price - 2 * atr;
    alvo = price + 3 * atr;
  } else {
    stop = price + 2 * atr;
    alvo = price - 3 * atr;
  }

  return {
    entrada: price,
    stop,
    alvo,
    atr,
    risco: Math.abs(price - stop),
    retorno: Math.abs(alvo - price)
  };
}

// Calculate Smart Insights (Trend, Volatility, Volume, Sentiment)
export function calculateSmartInsights(candles: ProcessedCandle[]): SmartInsights {
  if (candles.length === 0) {
    return {
      tendencia: 'Lateral',
      volatilidade: 'Moderado',
      volume: 'Moderado',
      sentimento: 'Neutro'
    };
  }

  const last = candles[candles.length - 1];
  const price = last.close;

  // Trend
  let tendencia: 'Alta' | 'Baixa' | 'Lateral' = 'Lateral';
  if (last.SMA200 && last.SMA20 && last.SMA50) {
    if (price > last.SMA200 && last.SMA20 > last.SMA50) {
      tendencia = 'Alta';
    } else if (price < last.SMA200 && last.SMA20 < last.SMA50) {
      tendencia = 'Baixa';
    }
  }

  // Volatility
  let volatilidade: 'Baixa' | 'Moderado' | 'Alto' = 'Moderado';
  if (last.ATR && price > 0) {
    const atrPct = (last.ATR / price) * 100;
    if (atrPct < 2) volatilidade = 'Baixa';
    else if (atrPct <= 4) volatilidade = 'Moderado';
    else volatilidade = 'Alto';
  }

  // Volume
  let volume: 'Baixo' | 'Moderado' | 'Alto' = 'Moderado';
  const recentVolumes = candles.slice(-20).map((c) => c.volume);
  const avgVol =
    recentVolumes.reduce((acc, v) => acc + v, 0) / (recentVolumes.length || 1);
  if (avgVol > 0) {
    const ratio = last.volume / avgVol;
    if (ratio < 0.8) volume = 'Baixo';
    else if (ratio <= 1.5) volume = 'Moderado';
    else volume = 'Alto';
  }

  // Sentiment score
  let score = 0;
  if (tendencia === 'Alta') score += 1;
  else if (tendencia === 'Baixa') score -= 1;

  if (last.RSI !== undefined) {
    if (last.RSI >= 55) score += 1;
    else if (last.RSI <= 45) score -= 1;
  }

  if (last.macd !== undefined && last.macd_sinal !== undefined) {
    score += last.macd > last.macd_sinal ? 1 : -1;
  }

  const sentimento: 'Otimista' | 'Neutro' | 'Pessimista' =
    score > 0 ? 'Otimista' : score < 0 ? 'Pessimista' : 'Neutro';

  return { tendencia, volatilidade, volume, sentimento };
}

// Calculate Fractal Support and Resistance Levels
export function calculateSupportResistance(
  candles: ProcessedCandle[],
  window = 5,
  maxLevels = 3
): SupportResistanceLevels {
  if (candles.length < window * 2 + 1) {
    const current = candles.length > 0 ? candles[candles.length - 1].close : 0;
    return { suportes: [], resistencias: [], preco: current };
  }

  const preco = candles[candles.length - 1].close;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rawResistances: number[] = [];
  const rawSupports: number[] = [];

  for (let i = window; i < candles.length - window; i++) {
    const sliceH = highs.slice(i - window, i + window + 1);
    if (highs[i] === Math.max(...sliceH)) {
      rawResistances.push(highs[i]);
    }
    const sliceL = lows.slice(i - window, i + window + 1);
    if (lows[i] === Math.min(...sliceL)) {
      rawSupports.push(lows[i]);
    }
  }

  // Resistances above current price
  const above = Array.from(new Set(rawResistances.filter((r) => r > preco)))
    .map((r) => Math.round(r * 100) / 100)
    .sort((a, b) => a - b)
    .slice(0, maxLevels);

  // Supports below current price
  const below = Array.from(new Set(rawSupports.filter((s) => s < preco)))
    .map((s) => Math.round(s * 100) / 100)
    .sort((a, b) => b - a)
    .slice(0, maxLevels);

  return { suportes: below, resistencias: above, preco };
}

// Detect classic chart patterns
export function detectPatterns(candles: ProcessedCandle[], window = 5): PatternItem[] {
  const patterns: PatternItem[] = [];
  if (candles.length < window * 2 + 1) {
    return [
      {
        nome: 'Sem padrão claro',
        vies: 'Neutro',
        detalhe: 'Histórico insuficiente para fractais.'
      }
    ];
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const peaks: { idx: number; val: number }[] = [];
  const troughs: { idx: number; val: number }[] = [];

  for (let i = window; i < candles.length - window; i++) {
    const sliceH = highs.slice(i - window, i + window + 1);
    if (highs[i] === Math.max(...sliceH)) {
      peaks.push({ idx: i, val: highs[i] });
    }
    const sliceL = lows.slice(i - window, i + window + 1);
    if (lows[i] === Math.min(...sliceL)) {
      troughs.push({ idx: i, val: lows[i] });
    }
  }

  const isNear = (a: number, b: number, tol = 0.03) => {
    const avg = (Math.abs(a) + Math.abs(b)) / 2 || 1;
    return Math.abs(a - b) / avg <= tol;
  };

  // Head and Shoulders (OCO)
  if (peaks.length >= 3) {
    const p1 = peaks[peaks.length - 3].val;
    const p2 = peaks[peaks.length - 2].val;
    const p3 = peaks[peaks.length - 1].val;
    if (p2 > p1 && p2 > p3 && isNear(p1, p3, 0.05)) {
      patterns.push({
        nome: 'Ombro-Cabeça-Ombro',
        vies: 'Pessimista',
        detalhe: `Ombros em ~${p1.toFixed(2)} e ${p3.toFixed(2)}, cabeça em ~${p2.toFixed(2)} — reversão baixista.`
      });
    }
  }

  // Inverted Head and Shoulders (OCO Invertido)
  if (troughs.length >= 3) {
    const t1 = troughs[troughs.length - 3].val;
    const t2 = troughs[troughs.length - 2].val;
    const t3 = troughs[troughs.length - 1].val;
    if (t2 < t1 && t2 < t3 && isNear(t1, t3, 0.05)) {
      patterns.push({
        nome: 'OCO Invertido',
        vies: 'Otimista',
        detalhe: `Ombros em ~${t1.toFixed(2)} e ${t3.toFixed(2)}, cabeça em ~${t2.toFixed(2)} — reversão altista.`
      });
    }
  }

  // Double Top
  if (peaks.length >= 2) {
    const p1 = peaks[peaks.length - 2].val;
    const p2 = peaks[peaks.length - 1].val;
    if (isNear(p1, p2)) {
      patterns.push({
        nome: 'Topo Duplo',
        vies: 'Pessimista',
        detalhe: `Dois topos próximos (~${p1.toFixed(2)} e ${p2.toFixed(2)}) — forte barreira de resistência.`
      });
    }
  }

  // Double Bottom
  if (troughs.length >= 2) {
    const t1 = troughs[troughs.length - 2].val;
    const t2 = troughs[troughs.length - 1].val;
    if (isNear(t1, t2)) {
      patterns.push({
        nome: 'Fundo Duplo',
        vies: 'Otimista',
        detalhe: `Dois fundos próximos (~${t1.toFixed(2)} e ${t2.toFixed(2)}) — suporte robusto para repique.`
      });
    }
  }

  // Trend structure (higher highs/lows or lower highs/lows)
  if (peaks.length >= 2 && troughs.length >= 2) {
    const p1 = peaks[peaks.length - 2].val;
    const p2 = peaks[peaks.length - 1].val;
    const t1 = troughs[troughs.length - 2].val;
    const t2 = troughs[troughs.length - 1].val;

    if (p2 > p1 && t2 > t1) {
      patterns.push({
        nome: 'Tendência de Alta',
        vies: 'Otimista',
        detalhe: 'Topos e fundos ascendentes (estrutura clássica de touro).'
      });
    } else if (p2 < p1 && t2 < t1) {
      patterns.push({
        nome: 'Tendência de Baixa',
        vies: 'Pessimista',
        detalhe: 'Topos e fundos descendentes (estrutura clássica de urso).'
      });
    }
  }

  if (patterns.length === 0) {
    patterns.push({
      nome: 'Sem padrão clássico evidente',
      vies: 'Neutro',
      detalhe: 'Mercado em consolidação ou padrão em formação.'
    });
  }

  return patterns;
}
