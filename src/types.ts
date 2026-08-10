export type InputMode = 'csv' | 'manual';

export interface PriceRow {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface TechnicalIndicators {
  currentPrice: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  ma20: number | null;
  ma50: number | null;
  rsi14: number | null;
  high10: number;
  low10: number;
  priceChange: number;
  priceChangePercent: number;
  ma20DistancePct: number | null;
  ma50DistancePct: number | null;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  maAlignment: 'golden_cross' | 'death_cross' | 'bullish_stack' | 'bearish_stack' | 'mixed';
}

export interface ChartDataPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  ma20: number | null;
  ma50: number | null;
  rsi: number | null;
}

export interface PatternItem {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'reversal' | 'continuation' | 'warning';
  signalExplanation: string;
  whyTradersWatchIt: string;
  keyLevel?: string;
}

export interface AnalysisResponse {
  summary: string;
  impliedCall: 'long' | 'short' | 'hold';
  rationale: string;
  patterns: PatternItem[];
  confidenceAndCaveats: string;
  whatToWatchNext: string[];
  keyLevelsToWatch: {
    resistance?: string;
    support?: string;
    invalidation?: string;
    confirmation?: string;
  };
}

export interface SessionLogItem {
  id: string;
  timestamp: string;
  productName: string;
  inputMode: InputMode;
  primaryPattern: string;
  impliedCall: 'long' | 'short' | 'hold';
  rationale: string;
  entryPrice: number;
  outcome: 'pending' | 'correct' | 'incorrect';
  exitPrice: number | null;
  pctMove: number | null;
  resolvedTimestamp: string | null;
  technicals?: TechnicalIndicators;
  manualDesc?: string;
  analysis: AnalysisResponse;
}
