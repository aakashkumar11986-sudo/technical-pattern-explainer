import React, { useRef } from 'react';
import { InputMode } from '../types';
import { SAMPLE_DATASETS } from '../utils/technicalMath';
import { FileText, Upload, Sparkles, AlertCircle, FileCode, Edit3 } from 'lucide-react';

interface InputPanelProps {
  productName: string;
  setProductName: (name: string) => void;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  csvText: string;
  setCsvText: (text: string) => void;
  manualDesc: string;
  setManualDesc: (desc: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  onLoadPreset: (key: string) => void;
}

const PRESET_PRODUCTS = [
  { name: 'Gold Futures (GC)', label: 'Gold' },
  { name: 'Crude Oil WTI (CL)', label: 'Crude Oil' },
  { name: 'S&P 500 E-mini (ES)', label: 'S&P 500' },
  { name: 'Nifty 50 Index (NIFTY)', label: 'Nifty 50' },
  { name: 'Bitcoin Futures (BTC)', label: 'Bitcoin' },
];

const MANUAL_TEMPLATES = [
  "Gold rallied from 2000 to 2050 over the last 5 sessions. 20-day MA is above 50-day MA, RSI is at 68, and volume expanded on the breakout.",
  "Crude oil pulled back to 78.50 near the 50-day MA support. RSI drops to 32, approaching oversold conditions after a 3-day decline.",
  "S&P 500 is consolidating in a tight 20-point range near 5520 resistance. Both 20-MA and 50-MA are trending upward with RSI flat at 58.",
  "Nifty 50 hit a new high of 25150 but RSI failed to make a higher high (showing RSI bearish divergence). 20-day MA sits at 24800.",
];

export const InputPanel: React.FC<InputPanelProps> = ({
  productName,
  setProductName,
  inputMode,
  setInputMode,
  csvText,
  setCsvText,
  manualDesc,
  setManualDesc,
  onAnalyze,
  loading,
  onLoadPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          setCsvText(text);
          if (!productName) {
            const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setProductName(fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1));
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const csvLinesCount = csvText
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Market & Input Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Specify asset name and provide CSV price data or plain-language price description
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              inputMode === 'csv'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>CSV Price Data</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              inputMode === 'manual'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Plain Description</span>
          </button>
        </div>
      </div>

      {/* Product Name Input & Presets */}
      <div>
        <label htmlFor="product-name-input" className="block text-xs font-medium text-slate-300 mb-1.5">
          Product / Asset Name <span className="text-rose-400">*</span>
        </label>
        <input
          id="product-name-input"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g. Gold Futures, Crude Oil WTI, S&P 500, Nifty 50"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />

        {/* Quick Product Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Select:</span>
          {PRESET_PRODUCTS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setProductName(p.name)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                productName === p.name
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-medium'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Input Areas */}
      {inputMode === 'csv' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="csv-data-input" className="block text-xs font-medium text-slate-300">
              Paste CSV Data (Columns: <code className="text-cyan-400 font-mono">Date, Close</code>, optional: <code className="text-slate-400 font-mono">Open, High, Low, Volume</code>)
            </label>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] border border-slate-700 transition-all"
              >
                <Upload className="w-3 h-3 text-cyan-400" />
                <span>Upload .csv</span>
              </button>
            </div>
          </div>

          {/* Preset dataset buttons */}
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Load Realistic Market Sample Data:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(SAMPLE_DATASETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onLoadPreset(key)}
                  className="text-left px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 text-xs border border-slate-800 hover:border-cyan-800/60 transition-all group"
                >
                  <span className="font-semibold block group-hover:text-cyan-400">{item.productName}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CSV Textarea */}
          <div className="relative">
            <textarea
              id="csv-data-input"
              rows={9}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Date,Close,Open,High,Low,Volume\n2026-07-01,2442.8,2436.0,2448.0,2430.0,310000\n2026-07-02,2438.2,2443.0,2449.0,2434.0,260000\n...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y"
            />
            {csvLinesCount > 0 && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                {csvLinesCount - 1 > 0 ? `${csvLinesCount - 1} data rows` : `${csvLinesCount} lines`}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Description Mode */
        <div className="space-y-3">
          <label htmlFor="manual-desc-input" className="block text-xs font-medium text-slate-300">
            Type Market Description & Indicator Context
          </label>

          {/* Quick Starter Templates */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Click a template starter:
            </span>
            <div className="space-y-1.5">
              {MANUAL_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setManualDesc(tmpl)}
                  className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-cyan-300 transition-all truncate"
                >
                  <span className="text-cyan-500 font-bold mr-1.5">#{idx + 1}</span>
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="manual-desc-input"
            rows={6}
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            placeholder="e.g. Gold rallied from 2000 to 2050 over the last 5 sessions. The 20-day MA is above the 50-day MA, RSI is currently at 68, and volume expanded on yesterday's breakout..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y"
          />
        </div>
      )}

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
            loading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/80 hover:shadow-cyan-900/60 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Price Action & Patterns...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>ANALYZE TECHNICAL PATTERNS</span>
            </>
          )}
        </button>

        {!productName && (
          <p className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" />
            <span>Please enter a product name before analyzing.</span>
          </p>
        )}
      </div>
    </div>
  );
};
