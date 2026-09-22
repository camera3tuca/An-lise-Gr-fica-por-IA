import { Candle, CandleWithIndicators } from '../types';

export function calculateSMA(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(values.length).fill(undefined);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function calculateEMA(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(values.length).fill(undefined);
  if (values.length === 0) return result;

  const k = 2 / (period + 1);
  let ema = values[0];
  result[0] = ema;

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

export function calculateBollingerBands(
  values: number[],
  period: number = 20,
  deviations: number = 2.0
): {
  bb_media: (number | undefined)[];
  bb_superior: (number | undefined)[];
  bb_inferior: (number | undefined)[];
} {
  const sma = calculateSMA(values, period);
  const bb_superior: (number | undefined)[] = new Array(values.length).fill(undefined);
  const bb_inferior: (number | undefined)[] = new Array(values.length).fill(undefined);

  for (let i = period - 1; i < values.length; i++) {
    const mean = sma[i];
    if (mean === undefined) continue;

    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += Math.pow(values[j] - mean, 2);
    }
    const stdDev = Math.sqrt(sumSq / period);
    bb_superior[i] = mean + deviations * stdDev;
    bb_inferior[i] = mean - deviations * stdDev;
  }

  return { bb_media: sma, bb_superior, bb_inferior };
}

export function calculateRSI(values: number[], period: number = 14): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(values.length).fill(undefined);
  if (values.length <= period) return result;

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  // Wilder's smoothing
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      result[i + 1] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i + 1] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

export function calculateMACD(
  values: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: (number | undefined)[];
  macd_sinal: (number | undefined)[];
  macd_hist: (number | undefined)[];
} {
  const emaFast = calculateEMA(values, fastPeriod);
  const emaSlow = calculateEMA(values, slowPeriod);
  const macdLine: number[] = new Array(values.length).fill(0);

  for (let i = 0; i < values.length; i++) {
    const f = emaFast[i] ?? values[i];
    const s = emaSlow[i] ?? values[i];
    macdLine[i] = f - s;
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const hist: (number | undefined)[] = new Array(values.length).fill(undefined);

  for (let i = 0; i < values.length; i++) {
    const s = signalLine[i];
    if (s !== undefined) {
      hist[i] = macdLine[i] - s;
    }
  }

  return {
    macd: macdLine,
    macd_sinal: signalLine,
    macd_hist: hist,
  };
}

export function calculateATR(candles: Candle[], period: number = 14): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(candles.length).fill(undefined);
  if (candles.length === 0) return result;

  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    const highLow = c.high - c.low;
    const highClose = Math.abs(c.high - prevClose);
    const lowClose = Math.abs(c.low - prevClose);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  // Wilder's smoothing for ATR
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = atr;

  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i] = atr;
  }

  return result;
}

export function calculateAllIndicators(candles: Candle[]): CandleWithIndicators[] {
  if (!candles || candles.length === 0) return [];

  const closePrices = candles.map((c) => c.close);
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const sma200 = calculateSMA(closePrices, 200);
  const ema9 = calculateEMA(closePrices, 9);
  const ema21 = calculateEMA(closePrices, 21);
  const bb = calculateBollingerBands(closePrices, 20, 2.0);
  const rsi = calculateRSI(closePrices, 14);
  const rsi2 = calculateRSI(closePrices, 2);
  const atr = calculateATR(candles, 14);
  const macdData = calculateMACD(closePrices, 12, 26, 9);

  return candles.map((c, i) => ({
    ...c,
    sma20: sma20[i],
    sma50: sma50[i],
    sma200: sma200[i],
    ema9: ema9[i],
    ema21: ema21[i],
    bb_media: bb.bb_media[i],
    bb_superior: bb.bb_superior[i],
    bb_inferior: bb.bb_inferior[i],
    rsi: rsi[i],
    rsi2: rsi2[i],
    atr: atr[i],
    macd: macdData.macd[i],
    macd_sinal: macdData.macd_sinal[i],
    macd_hist: macdData.macd_hist[i],
  }));
}
