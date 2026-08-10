import React from 'react';
import { TechnicalIndicators } from '../types';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 } from 'lucide-react';

interface TechnicalStatsCardsProps {
  indicators: TechnicalIndicators;
}

export const TechnicalStatsCards: React.FC<TechnicalStatsCardsProps> = ({ indicators }) => {
  const {
    currentPrice,
    ma20,
    ma50,
    rsi14,
    high10,
    low10,
    priceChange,
    priceChangePercent,
    ma20DistancePct,
    ma50DistancePct,
    maAlignment,
  } = indicators;

  // RSI Color coding
  let rsiColor = 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
  let rsiLabel = 'Neutral (30-70)';
  if (rsi14 !== null) {
    if (rsi14 >= 70) {
      rsiColor = 'text-rose-400 bg-rose-950/80 border-rose-800';
      rsiLabel = 'Overbought (>70)';
    } else if (rsi14 <= 30) {
      rsiColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      rsiLabel = 'Oversold (<30)';
    } else if (rsi14 > 60) {
      rsiColor = 'text-amber-400 bg-amber-950/80 border-amber-800';
      rsiLabel = 'Upper Range (60-70)';
    }
  }

  // Calculate position within 10-period High/Low range
  const rangeSpan = high10 - low10;
  const pricePosPct = rangeSpan > 0 ? Math.min(100, Math.max(0, ((currentPrice - low10) / rangeSpan) * 100)) : 50;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
            Computed Indicators (JavaScript Math Engine)
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" />
          <span>100% Exact Calculation</span>
        </div>
      </div>

      {/* Grid of Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Current Price */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Current Close
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {priceChange >= 0 ? (
                <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />+{priceChange} (+{priceChangePercent}%)
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-mono font-semibold text-rose-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {priceChange} ({priceChangePercent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: RSI(14) */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              RSI (14)
            </span>
            {rsi14 !== null && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${rsiColor}`}>
                {rsiLabel}
              </span>
            )}
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">
              {rsi14 !== null ? rsi14 : 'N/A'}
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  rsi14 && rsi14 >= 70
                    ? 'bg-rose-500'
                    : rsi14 && rsi14 <= 30
                    ? 'bg-emerald-500'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rsi14 || 0))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: MA20 */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>20-Day MA</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {ma20 !== null ? ma20.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}
            </span>
            {ma20DistancePct !== null && (
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                Dist: {ma20DistancePct >= 0 ? `+${ma20DistancePct}%` : `${ma20DistancePct}%`}
              </div>
            )}
          </div>
        </div>

        {/* Card 4: MA50 */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>50-Day MA</span>
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-purple-400">
              {ma50 !== null ? ma50.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}
            </span>
            {ma50DistancePct !== null && (
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                Dist: {ma50DistancePct >= 0 ? `+${ma50DistancePct}%` : `${ma50DistancePct}%`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Range Bar & MA Alignment Badge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Recent High/Low Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Recent 10-Period Range</span>
            <span className="font-mono text-slate-300">
              Low: {low10} — High: {high10}
            </span>
          </div>
          <div className="relative w-full bg-slate-800 h-2 rounded-full mt-2">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 border-2 border-slate-950 rounded-full shadow-md"
              style={{ left: `calc(${pricePosPct}% - 6px)` }}
              title={`Current Price ${currentPrice} sits at ${pricePosPct.toFixed(0)}% of recent range`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>{low10}</span>
            <span className="text-cyan-400 font-semibold">{currentPrice}</span>
            <span>{high10}</span>
          </div>
        </div>

        {/* MA Alignment Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              MA Alignment Structure
            </span>
            <span className="text-xs font-medium text-slate-200 mt-0.5 block">
              {maAlignment === 'golden_cross' && 'Golden Cross Triggered (MA20 crossed above MA50)'}
              {maAlignment === 'death_cross' && 'Death Cross Triggered (MA20 crossed below MA50)'}
              {maAlignment === 'bullish_stack' && 'Bullish MA Stack (Price > MA20 > MA50)'}
              {maAlignment === 'bearish_stack' && 'Bearish MA Stack (Price < MA20 < MA50)'}
              {maAlignment === 'mixed' && 'Consolidating / Mixed Moving Averages'}
            </span>
          </div>
          <div className="pl-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                maAlignment === 'golden_cross' || maAlignment === 'bullish_stack'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : maAlignment === 'death_cross' || maAlignment === 'bearish_stack'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              {maAlignment.toUpperCase().replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
