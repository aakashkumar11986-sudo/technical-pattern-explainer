import React, { useState } from 'react';
import { AnalysisResponse, PatternItem } from '../types';
import {
  Sparkles,
  AlertTriangle,
  Compass,
  CheckCircle,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldAlert,
  Target,
  BarChart,
} from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisResponse;
  productName: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, productName }) => {
  const [copied, setCopied] = useState(false);

  const { summary, impliedCall, rationale, patterns, confidenceAndCaveats, whatToWatchNext, keyLevelsToWatch } = analysis;

  const handleCopy = () => {
    const textToCopy = `=== Technical Pattern Analysis for ${productName} ===
Summary: ${summary}

Implied Call: ${impliedCall ? impliedCall.toUpperCase() : 'N/A'}
Rationale: ${rationale || 'N/A'}

Identified Patterns:
${patterns
  .map(
    (p) => `- ${p.name} [${p.type.toUpperCase()}]: ${p.signalExplanation}\n  Why traders watch: ${p.whyTradersWatchIt}`
  )
  .join('\n\n')}

Confidence & Caveats:
${confidenceAndCaveats}

What to Watch Next:
${whatToWatchNext.map((w) => `• ${w}`).join('\n')}

Key Levels:
- Resistance: ${keyLevelsToWatch.resistance || 'N/A'}
- Support: ${keyLevelsToWatch.support || 'N/A'}
- Confirmation: ${keyLevelsToWatch.confirmation || 'N/A'}
- Invalidation: ${keyLevelsToWatch.invalidation || 'N/A'}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPatternBadgeStyle = (type: PatternItem['type']) => {
    switch (type) {
      case 'bullish':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'bearish':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      case 'reversal':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'continuation':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'warning':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Copy Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Technical Analysis & Pattern Interpretation
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generated plain-language breakdown for <span className="text-cyan-300 font-semibold">{productName}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Full Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-900/90 border-l-4 border-l-cyan-500 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Market Structure Summary</span>
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">{summary}</p>
        </div>

        {/* Implied Call & Rationale */}
        {impliedCall && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Implied Call:
              </span>
              <span
                className={`text-xs font-bold font-mono uppercase tracking-wider px-3 py-1 rounded-md border shadow-sm ${
                  impliedCall === 'long'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-emerald-950/50'
                    : impliedCall === 'short'
                    ? 'bg-rose-950 text-rose-400 border-rose-800 shadow-rose-950/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {impliedCall === 'long' && '▲ LONG'}
                {impliedCall === 'short' && '▼ SHORT'}
                {impliedCall === 'hold' && '◼ HOLD'}
              </span>
            </div>
            {rationale && (
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex-1">
                <span className="text-slate-400 font-semibold mr-1">Rationale:</span>
                <span>{rationale}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Identified Patterns Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Identified Technical Patterns ({patterns.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {patterns.map((p, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition-all flex flex-col gap-3"
            >
              {/* Pattern Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                    #{idx + 1}
                  </div>
                  <h4 className="text-base font-bold text-slate-100 tracking-tight">{p.name}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPatternBadgeStyle(
                      p.type
                    )}`}
                  >
                    {p.type}
                  </span>
                  {p.keyLevel && (
                    <span className="text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                      Level: {p.keyLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Pattern Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                {/* What it typically signals */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[10px] block">
                    What This Pattern Signals
                  </span>
                  <p className="text-slate-200 leading-relaxed text-xs">{p.signalExplanation}</p>
                </div>

                {/* Why traders watch it */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px] block">
                    Why Traders & Institutions Watch It
                  </span>
                  <p className="text-slate-300 leading-relaxed text-xs">{p.whyTradersWatchIt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Confidence & Caveats vs What To Watch Next */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Confidence & Caveats */}
        <div className="bg-slate-900 border-t-2 border-t-amber-500 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Confidence & Probabilistic Caveats
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
              "{confidenceAndCaveats}"
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Technical patterns reflect historical probabilities, never guaranteed outcomes.</span>
          </div>
        </div>

        {/* What To Watch Next */}
        <div className="bg-slate-900 border-t-2 border-t-emerald-500 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                What a Trader Might Watch For Next
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-200">
              {whatToWatchNext.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Key Levels Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Key Technical Price Levels
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider block">
              Resistance Level
            </span>
            <span className="text-sm font-mono font-bold text-white mt-1 block">
              {keyLevelsToWatch.resistance || 'N/A'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
              Support Level
            </span>
            <span className="text-sm font-mono font-bold text-white mt-1 block">
              {keyLevelsToWatch.support || 'N/A'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider block">
              Confirmation Trigger
            </span>
            <span className="text-sm font-mono font-bold text-white mt-1 block">
              {keyLevelsToWatch.confirmation || 'N/A'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
              Invalidation Threshold
            </span>
            <span className="text-sm font-mono font-bold text-white mt-1 block">
              {keyLevelsToWatch.invalidation || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
