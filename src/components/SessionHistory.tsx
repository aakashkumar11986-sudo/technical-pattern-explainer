import React, { useState } from 'react';
import { SessionLogItem } from '../types';
import {
  History,
  Trash2,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  X,
  Target,
  BarChart2,
  Info,
} from 'lucide-react';

interface SessionHistoryProps {
  history: SessionLogItem[];
  onSelectLogItem: (item: SessionLogItem) => void;
  onDeleteLogItem: (id: string) => void;
  onClearHistory: () => void;
  onUpdateOutcome: (
    id: string,
    outcomeData: {
      outcome: 'pending' | 'correct' | 'incorrect';
      exitPrice: number | null;
      pctMove: number | null;
      resolvedTimestamp: string | null;
    }
  ) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  history,
  onSelectLogItem,
  onDeleteLogItem,
  onClearHistory,
  onUpdateOutcome,
}) => {
  // Modal state for marking outcome
  const [editingItem, setEditingItem] = useState<SessionLogItem | null>(null);
  const [inputExitPrice, setInputExitPrice] = useState<string>('');
  const [manualOutcomeOverride, setManualOutcomeOverride] = useState<'pending' | 'correct' | 'incorrect' | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-center space-y-2">
        <History className="w-8 h-8 text-slate-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-300">Session Analysis Log Empty</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Perform a technical pattern analysis above to automatically log your results, implied calls, and track call outcomes across sessions.
        </p>
      </div>
    );
  }

  // Calculate track record stats
  const correctCount = history.filter((item) => item.outcome === 'correct').length;
  const incorrectCount = history.filter((item) => item.outcome === 'incorrect').length;
  const pendingCount = history.filter((item) => !item.outcome || item.outcome === 'pending').length;
  const resolvedCount = correctCount + incorrectCount;
  const accuracyPct = resolvedCount > 0 ? ((correctCount / resolvedCount) * 100).toFixed(1) : null;

  // Open outcome editor modal
  const handleOpenEdit = (item: SessionLogItem) => {
    setEditingItem(item);
    const initialPrice = item.exitPrice !== null && item.exitPrice !== undefined
      ? item.exitPrice.toString()
      : (item.entryPrice || item.technicals?.currentPrice || '').toString();
    setInputExitPrice(initialPrice);
    setManualOutcomeOverride(null);
  };

  // Close editor
  const handleCloseEdit = () => {
    setEditingItem(null);
    setInputExitPrice('');
    setManualOutcomeOverride(null);
  };

  // Calculate outcome based on inputs
  const computeOutcomeDetails = () => {
    if (!editingItem) return { outcome: 'pending' as const, pctMove: null, exitVal: null };

    const entryVal = editingItem.entryPrice || editingItem.technicals?.currentPrice || 0;
    const exitVal = parseFloat(inputExitPrice);

    if (isNaN(exitVal) || entryVal <= 0) {
      return { outcome: 'pending' as const, pctMove: null, exitVal: null };
    }

    const pctMove = ((exitVal - entryVal) / entryVal) * 100;
    const call = editingItem.impliedCall || editingItem.analysis?.impliedCall || 'hold';

    let autoOutcome: 'correct' | 'incorrect' | 'pending' = 'pending';
    if (call === 'long') {
      autoOutcome = exitVal > entryVal ? 'correct' : 'incorrect';
    } else if (call === 'short') {
      autoOutcome = exitVal < entryVal ? 'correct' : 'incorrect';
    } else if (call === 'hold') {
      autoOutcome = Math.abs(pctMove) < 1.0 ? 'correct' : 'incorrect';
    }

    const finalOutcome = manualOutcomeOverride !== null ? manualOutcomeOverride : autoOutcome;

    return {
      outcome: finalOutcome,
      pctMove: parseFloat(pctMove.toFixed(2)),
      exitVal,
    };
  };

  const handleSaveOutcome = () => {
    if (!editingItem) return;

    const { outcome, pctMove, exitVal } = computeOutcomeDetails();

    const resolvedTimestamp = outcome !== 'pending'
      ? new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    onUpdateOutcome(editingItem.id, {
      outcome,
      exitPrice: outcome === 'pending' ? null : exitVal,
      pctMove: outcome === 'pending' ? null : pctMove,
      resolvedTimestamp,
    });

    handleCloseEdit();
  };

  const getCallBadgeStyle = (call: 'long' | 'short' | 'hold' | undefined) => {
    switch (call) {
      case 'long':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800/90';
      case 'short':
        return 'bg-rose-950 text-rose-400 border-rose-800/90';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getOutcomeBadgeStyle = (outcome: 'pending' | 'correct' | 'incorrect' | undefined) => {
    switch (outcome) {
      case 'correct':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'incorrect':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      default:
        return 'bg-slate-800/80 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Session History Log & Outcome Tracker ({history.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-all font-medium self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Logs</span>
        </button>
      </div>

      {/* FEATURE 2: Stats Bar ABOVE Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Track Record:
            </span>
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <span className="bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {correctCount} Correct
              </span>
              <span className="bg-rose-950/80 text-rose-400 px-2 py-0.5 rounded border border-rose-800/80 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {incorrectCount} Incorrect
              </span>
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {pendingCount} Pending
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <BarChart2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Accuracy:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {resolvedCount > 0 ? `${accuracyPct}% (${correctCount}/${resolvedCount})` : 'No resolved calls yet.'}
            </span>
          </div>
        </div>

        {/* Disclaimer near stats bar */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 italic pt-1 border-t border-slate-900">
          <Info className="w-3 h-3 text-slate-600 shrink-0" />
          <span>Simulated tracking for educational purposes only — not a live trading record</span>
        </div>
      </div>

      {/* Table of Past Analyses & Outcomes */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-3">Mode</th>
              <th className="py-2.5 px-3">Implied Call</th>
              <th className="py-2.5 px-3">Primary Pattern</th>
              <th className="py-2.5 px-3">Entry / Exit Close</th>
              <th className="py-2.5 px-3">Outcome Status</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((item) => {
              const primaryPattern = item.analysis?.patterns[0]?.name || item.primaryPattern || 'Analysis Record';
              const call = item.impliedCall || item.analysis?.impliedCall || 'hold';
              const entryPrice = item.entryPrice || item.technicals?.currentPrice;
              const outcome = item.outcome || 'pending';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-850/80 transition-all text-slate-200 group"
                >
                  {/* Product */}
                  <td className="py-3 px-3 font-semibold text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>{item.productName}</span>
                    </div>
                  </td>

                  {/* Mode */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                        item.inputMode === 'csv'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.inputMode.toUpperCase()}
                    </span>
                  </td>

                  {/* Implied Call Badge */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${getCallBadgeStyle(
                        call
                      )}`}
                    >
                      {call === 'long' && '▲ LONG'}
                      {call === 'short' && '▼ SHORT'}
                      {call === 'hold' && '◼ HOLD'}
                    </span>
                  </td>

                  {/* Primary Pattern */}
                  <td className="py-3 px-3 font-semibold text-slate-300 max-w-[180px] truncate" title={primaryPattern}>
                    {primaryPattern}
                  </td>

                  {/* Entry / Exit Price */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                    <div>
                      <span>Entry: ${entryPrice !== undefined ? entryPrice : 'N/A'}</span>
                      {item.exitPrice !== null && item.exitPrice !== undefined && (
                        <div className="text-[10px] text-slate-400">
                          Exit: ${item.exitPrice}{' '}
                          {item.pctMove !== null && (
                            <span
                              className={
                                item.pctMove > 0
                                  ? 'text-emerald-400'
                                  : item.pctMove < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              ({item.pctMove > 0 ? '+' : ''}{item.pctMove}%)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Outcome Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${getOutcomeBadgeStyle(
                        outcome
                      )}`}
                    >
                      {outcome === 'correct' && (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Correct</span>
                        </>
                      )}
                      {outcome === 'incorrect' && (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Incorrect</span>
                        </>
                      )}
                      {outcome === 'pending' && (
                        <>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{item.timestamp}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Mark Outcome button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[11px] font-medium px-2"
                        title="Mark outcome / edit exit price"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark Outcome</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectLogItem(item)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all"
                        title="Reload full analysis"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteLogItem(item.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FEATURE 2: Mark Outcome Modal Form */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Mark Outcome: {editingItem.productName}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs">
              {/* Call Details Card */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Entry Close Price:</span>
                  <span className="font-mono font-bold text-slate-100">
                    ${editingItem.entryPrice || editingItem.technicals?.currentPrice || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Implied Call:</span>
                  <span
                    className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded border ${getCallBadgeStyle(
                      editingItem.impliedCall || editingItem.analysis?.impliedCall
                    )}`}
                  >
                    {editingItem.impliedCall || editingItem.analysis?.impliedCall || 'HOLD'}
                  </span>
                </div>
              </div>

              {/* Price Input */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-[11px]">
                  Current / Exit Price ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={inputExitPrice}
                  onChange={(e) => {
                    setInputExitPrice(e.target.value);
                    setManualOutcomeOverride(null);
                  }}
                  placeholder="Enter exit price e.g. 2650.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              {/* Auto Calculated Outcome Preview */}
              {(() => {
                const { outcome, pctMove, exitVal } = computeOutcomeDetails();
                return (
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-2">
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Calculated Move:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {pctMove !== null ? `${pctMove > 0 ? '+' : ''}${pctMove}%` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Calculated Outcome:</span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getOutcomeBadgeStyle(
                          outcome
                        )}`}
                      >
                        {outcome.toUpperCase()}
                      </span>
                    </div>

                    {/* Manual override toggles */}
                    <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 justify-end">
                      <span className="text-[10px] text-slate-500 mr-auto">Override:</span>
                      <button
                        type="button"
                        onClick={() => setManualOutcomeOverride('correct')}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          outcome === 'correct'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        Correct
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualOutcomeOverride('incorrect')}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          outcome === 'incorrect'
                            ? 'bg-rose-950 text-rose-400 border-rose-700'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        Incorrect
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualOutcomeOverride('pending')}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          outcome === 'pending'
                            ? 'bg-slate-800 text-slate-300 border-slate-600'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        Reset Pending
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutcome}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
              >
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
