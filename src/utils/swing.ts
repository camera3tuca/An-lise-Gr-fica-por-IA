import { BiasType, CandleWithIndicators, RiskManagement, Signal } from '../types';

export function crossedAbove(fast: (number | undefined)[], slow: (number | undefined)[]): boolean {
  const n = fast.length;
  if (n < 2) return false;
  const f0 = fast[n - 2];
  const f1 = fast[n - 1];
  const s0 = slow[n - 2];
  const s1 = slow[n - 1];
  if (f0 === undefined || f1 === undefined || s0 === undefined || s1 === undefined) return false;
  return f0 <= s0 && f1 > s1;
}

export function crossedBelow(fast: (number | undefined)[], slow: (number | undefined)[]): boolean {
  const n = fast.length;
  if (n < 2) return false;
  const f0 = fast[n - 2];
  const f1 = fast[n - 1];
  const s0 = slow[n - 2];
  const s1 = slow[n - 1];
  if (f0 === undefined || f1 === undefined || s0 === undefined || s1 === undefined) return false;
  return f0 >= s0 && f1 < s1;
}

export function generateSignals(candles: CandleWithIndicators[]): Signal[] {
  if (candles.length === 0) return [];
  const last = candles[candles.length - 1];
  const price = last.close;
  const signals: Signal[] = [];

  // 1) Tendência principal — SMA200
  if (last.sma200 !== undefined) {
    if (price > last.sma200) {
      signals.push({
        nome: 'Tendência (SMA200)',
        sinal: 'compra',
        detalhe: 'Preço acima da média de 200 — tendência de alta.',
      });
    } else {
      signals.push({
        nome: 'Tendência (SMA200)',
        sinal: 'venda',
        detalhe: 'Preço abaixo da média de 200 — tendência de baixa.',
      });
    }
  }

  // 2) Tendência de médio prazo — SMA20 x SMA50
  if (last.sma20 !== undefined && last.sma50 !== undefined) {
    if (last.sma20 > last.sma50) {
      signals.push({
        nome: 'Médias 20/50',
        sinal: 'compra',
        detalhe: 'SMA20 acima da SMA50 — viés comprador.',
      });
    } else {
      signals.push({
        nome: 'Médias 20/50',
        sinal: 'venda',
        detalhe: 'SMA20 abaixo da SMA50 — viés vendedor.',
      });
    }
  }

  // 3) Cruzamento de médias exponenciais curtas — EMA9 x EMA21
  if (candles.length >= 2) {
    const ema9List = candles.map((c) => c.ema9);
    const ema21List = candles.map((c) => c.ema21);
    if (crossedAbove(ema9List, ema21List)) {
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'compra',
        detalhe: 'EMA9 cruzou a EMA21 para cima (gatilho recente).',
      });
    } else if (crossedBelow(ema9List, ema21List)) {
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'venda',
        detalhe: 'EMA9 cruzou a EMA21 para baixo (gatilho recente).',
      });
    } else {
      const e9 = last.ema9 ?? 0;
      const e21 = last.ema21 ?? 0;
      const estado = e9 >= e21 ? 'acima' : 'abaixo';
      signals.push({
        nome: 'Cruzamento EMA9/21',
        sinal: 'neutro',
        detalhe: `Sem cruzamento recente — EMA9 ${estado} da EMA21.`,
      });
    }
  }

  // 4) MACD — cruzamento e posição
  if (candles.length >= 2) {
    const macdList = candles.map((c) => c.macd);
    const signalList = candles.map((c) => c.macd_sinal);
    if (crossedAbove(macdList, signalList)) {
      signals.push({
        nome: 'MACD',
        sinal: 'compra',
        detalhe: 'MACD cruzou a linha de sinal para cima.',
      });
    } else if (crossedBelow(macdList, signalList)) {
      signals.push({
        nome: 'MACD',
        sinal: 'venda',
        detalhe: 'MACD cruzou a linha de sinal para baixo.',
      });
    } else {
      const m = last.macd;
      const s = last.macd_sinal;
      if (m !== undefined && s !== undefined) {
        const lado: BiasType = m > s ? 'compra' : 'venda';
        const pos = m > s ? 'acima' : 'abaixo';
        signals.push({
          nome: 'MACD',
          sinal: lado,
          detalhe: `MACD ${pos} da linha de sinal.`,
        });
      }
    }
  }

  // 5) IFR2 (RSI 2 períodos Larry Connors) com filtro de tendência
  if (last.rsi2 !== undefined) {
    if (last.sma200 !== undefined && price > last.sma200 && last.rsi2 < 10) {
      signals.push({
        nome: 'IFR2 (RSI2)',
        sinal: 'compra',
        detalhe: `RSI(2) = ${last.rsi2.toFixed(0)} em tendência de alta — possível entrada.`,
      });
    } else if (last.rsi2 > 90) {
      signals.push({
        nome: 'IFR2 (RSI2)',
        sinal: 'venda',
        detalhe: `RSI(2) = ${last.rsi2.toFixed(0)} — sobrecomprado, possível saída/realização.`,
      });
    } else {
      signals.push({
        nome: 'IFR2 (RSI2)',
        sinal: 'neutro',
        detalhe: `RSI(2) = ${last.rsi2.toFixed(0)} — sem gatilho do setup.`,
      });
    }
  }

  // 6) RSI(14) — força
  if (last.rsi !== undefined) {
    if (last.rsi <= 30) {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'compra',
        detalhe: `RSI = ${last.rsi.toFixed(0)} — sobrevendido.`,
      });
    } else if (last.rsi >= 70) {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'venda',
        detalhe: `RSI = ${last.rsi.toFixed(0)} — sobrecomprado.`,
      });
    } else {
      signals.push({
        nome: 'RSI(14)',
        sinal: 'neutro',
        detalhe: `RSI = ${last.rsi.toFixed(0)} — região neutra.`,
      });
    }
  }

  return signals;
}

export function consolidateSignals(signals: Signal[]): {
  vies: BiasType;
  compras: number;
  vendas: number;
} {
  const compras = signals.filter((s) => s.sinal === 'compra').length;
  const vendas = signals.filter((s) => s.sinal === 'venda').length;

  let vies: BiasType = 'neutro';
  if (compras > vendas) {
    vies = 'compra';
  } else if (vendas > compras) {
    vies = 'venda';
  }

  return { vies, compras, vendas };
}

export function suggestStopAndTarget(
  candles: CandleWithIndicators[],
  vies: BiasType
): RiskManagement | null {
  if (candles.length === 0 || vies === 'neutro') return null;
  const last = candles[candles.length - 1];
  const price = last.close;
  const atr = last.atr;
  if (atr === undefined || isNaN(atr)) return null;

  let stop: number;
  let alvo: number;

  if (vies === 'compra') {
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
    retorno: Math.abs(alvo - price),
  };
}
