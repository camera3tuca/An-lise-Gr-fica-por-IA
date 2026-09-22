import { CandleWithIndicators, ChartPattern, SmartInsights, SupportResistance } from '../types';

export function calculateSmartInsights(candles: CandleWithIndicators[]): SmartInsights {
  if (candles.length === 0) {
    return {
      tendencia: 'Lateral',
      volatilidade: 'Moderado',
      volume: 'Moderado',
      sentimento: 'Neutro',
    };
  }

  const last = candles[candles.length - 1];
  const price = last.close;

  // 1) Tendência
  let tendencia: 'Alta' | 'Baixa' | 'Lateral' = 'Lateral';
  if (last.sma200 !== undefined && last.sma20 !== undefined && last.sma50 !== undefined) {
    if (price > last.sma200 && last.sma20 > last.sma50) {
      tendencia = 'Alta';
    } else if (price < last.sma200 && last.sma20 < last.sma50) {
      tendencia = 'Baixa';
    }
  }

  // 2) Volatilidade (ATR relativo ao preço)
  let volatilidade: 'Baixa' | 'Moderado' | 'Alto' = 'Moderado';
  if (last.atr !== undefined && price > 0) {
    const atrPct = (last.atr / price) * 100;
    if (atrPct < 2) {
      volatilidade = 'Baixa';
    } else if (atrPct <= 4) {
      volatilidade = 'Moderado';
    } else {
      volatilidade = 'Alto';
    }
  }

  // 3) Volume (último vs média de 20 períodos)
  let volume: 'Baixo' | 'Moderado' | 'Alto' = 'Moderado';
  const recentVolumes = candles.slice(-20).map((c) => c.volume);
  if (recentVolumes.length > 0) {
    const volMedio = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    if (volMedio > 0) {
      const ratio = last.volume / volMedio;
      if (ratio < 0.8) {
        volume = 'Baixo';
      } else if (ratio <= 1.5) {
        volume = 'Moderado';
      } else {
        volume = 'Alto';
      }
    }
  }

  // 4) Sentimento — combinação de tendência, RSI e MACD
  let pontos = 0;
  if (tendencia === 'Alta') pontos += 1;
  else if (tendencia === 'Baixa') pontos -= 1;

  if (last.rsi !== undefined) {
    if (last.rsi >= 55) pontos += 1;
    else if (last.rsi <= 45) pontos -= 1;
  }

  if (last.macd !== undefined && last.macd_sinal !== undefined) {
    pontos += last.macd > last.macd_sinal ? 1 : -1;
  }

  const sentimento: 'Otimista' | 'Neutro' | 'Pessimista' =
    pontos > 0 ? 'Otimista' : pontos < 0 ? 'Pessimista' : 'Neutro';

  return { tendencia, volatilidade, volume, sentimento };
}

export function calculateSupportResistance(
  candles: CandleWithIndicators[],
  windowSize: number = 5,
  maxLevels: number = 3
): SupportResistance {
  if (candles.length < windowSize * 2 + 1) {
    const p = candles[candles.length - 1]?.close ?? 0;
    return { suportes: [], resistencias: [], preco: p };
  }

  const price = candles[candles.length - 1].close;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rawResistances: number[] = [];
  const rawSupports: number[] = [];

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    let isMax = true;
    let isMin = true;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (highs[j] > highs[i]) isMax = false;
      if (lows[j] < lows[i]) isMin = false;
    }

    if (isMax) rawResistances.push(highs[i]);
    if (isMin) rawSupports.push(lows[i]);
  }

  // Resistências acima do preço (mais próximas primeiro)
  const uniqueRes = Array.from(new Set(rawResistances.filter((r) => r > price)))
    .map((r) => Number(r.toFixed(2)))
    .sort((a, b) => a - b)
    .slice(0, maxLevels);

  // Suportes abaixo do preço (mais próximos primeiro)
  const uniqueSup = Array.from(new Set(rawSupports.filter((s) => s < price)))
    .map((s) => Number(s.toFixed(2)))
    .sort((a, b) => b - a)
    .slice(0, maxLevels);

  return {
    suportes: uniqueSup,
    resistencias: uniqueRes,
    preco: price,
  };
}

function areClose(a: number, b: number, tol: number = 0.03): boolean {
  const ref = (Math.abs(a) + Math.abs(b)) / 2 || 1;
  return Math.abs(a - b) / ref <= tol;
}

export function detectChartPatterns(
  candles: CandleWithIndicators[],
  windowSize: number = 5
): ChartPattern[] {
  if (candles.length < windowSize * 2 + 1) {
    return [
      {
        nome: 'Sem padrão claro',
        vies: 'Neutro',
        detalhe: 'Dados insuficientes para detecção de pivôs.',
      },
    ];
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const topos: [number, number][] = [];
  const fundos: [number, number][] = [];

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    let isMax = true;
    let isMin = true;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (highs[j] > highs[i]) isMax = false;
      if (lows[j] < lows[i]) isMin = false;
    }

    if (isMax) topos.push([i, highs[i]]);
    if (isMin) fundos.push([i, lows[i]]);
  }

  const padroes: ChartPattern[] = [];

  // Ombro-Cabeça-Ombro (topo)
  if (topos.length >= 3) {
    const [, e] = topos[topos.length - 3];
    const [, c] = topos[topos.length - 2];
    const [, d] = topos[topos.length - 1];
    if (c > e && c > d && areClose(e, d, 0.05)) {
      padroes.push({
        nome: 'Ombro-Cabeça-Ombro',
        vies: 'Pessimista',
        detalhe: `Ombros ~${e.toFixed(2)}/${d.toFixed(2)} e cabeça ~${c.toFixed(2)} — possível reversão de baixa.`,
      });
    }
  }

  // OCO Invertido (fundo)
  if (fundos.length >= 3) {
    const [, e] = fundos[fundos.length - 3];
    const [, c] = fundos[fundos.length - 2];
    const [, d] = fundos[fundos.length - 1];
    if (c < e && c < d && areClose(e, d, 0.05)) {
      padroes.push({
        nome: 'OCO Invertido',
        vies: 'Otimista',
        detalhe: `Ombros ~${e.toFixed(2)}/${d.toFixed(2)} e cabeça ~${c.toFixed(2)} — possível reversão de alta.`,
      });
    }
  }

  // Topo Duplo
  if (topos.length >= 2) {
    const [, t1] = topos[topos.length - 2];
    const [, t2] = topos[topos.length - 1];
    if (areClose(t1, t2)) {
      padroes.push({
        nome: 'Topo Duplo',
        vies: 'Pessimista',
        detalhe: `Dois topos próximos (~${t1.toFixed(2)} e ${t2.toFixed(2)}) — resistência forte.`,
      });
    }
  }

  // Fundo Duplo
  if (fundos.length >= 2) {
    const [, f1] = fundos[fundos.length - 2];
    const [, f2] = fundos[fundos.length - 1];
    if (areClose(f1, f2)) {
      padroes.push({
        nome: 'Fundo Duplo',
        vies: 'Otimista',
        detalhe: `Dois fundos próximos (~${f1.toFixed(2)} e ${f2.toFixed(2)}) — suporte forte.`,
      });
    }
  }

  // Estrutura de tendência (topos/fundos ascendentes ou descendentes)
  if (topos.length >= 2 && fundos.length >= 2) {
    const toposSobem = topos[topos.length - 1][1] > topos[topos.length - 2][1];
    const fundosSobem = fundos[fundos.length - 1][1] > fundos[fundos.length - 2][1];

    if (toposSobem && fundosSobem) {
      padroes.push({
        nome: 'Tendência de alta',
        vies: 'Otimista',
        detalhe: 'Topos e fundos ascendentes (estrutura de alta).',
      });
    } else if (!toposSobem && !fundosSobem) {
      padroes.push({
        nome: 'Tendência de baixa',
        vies: 'Pessimista',
        detalhe: 'Topos e fundos descendentes (estrutura de baixa).',
      });
    }
  }

  if (padroes.length === 0) {
    padroes.push({
      nome: 'Sem padrão claro',
      vies: 'Neutro',
      detalhe: 'Nenhum padrão gráfico clássico identificado no momento.',
    });
  }

  return padroes;
}
