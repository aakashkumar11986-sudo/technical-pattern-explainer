import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { TechnicalStatsCards } from './components/TechnicalStatsCards';
import { PriceChart } from './components/PriceChart';
import { AnalysisResults } from './components/AnalysisResults';
import { SessionHistory } from './components/SessionHistory';

import {
  InputMode,
  TechnicalIndicators,
  ChartDataPoint,
  AnalysisResponse,
  SessionLogItem,
} from './types';
import {
  parseCSVData,
  computeTechnicalIndicators,
  SAMPLE_DATASETS,
} from './utils/technicalMath';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // Pre-load default dataset provided by user
  const defaultPreset = SAMPLE_DATASETS.custom_user_csv;

  const [productName, setProductName] = useState<string>(defaultPreset.productName);
  const [inputMode, setInputMode] = useState<InputMode>('csv');
  const [csvText, setCsvText] = useState<string>(defaultPreset.csvData);
  const [manualDesc, setManualDesc] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Technical calculations state initialized with default dataset
  const initialRows = parseCSVData(defaultPreset.csvData);
  const initialTech = computeTechnicalIndicators(initialRows);

  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(initialTech.indicators);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(initialTech.chartData);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  // Local storage history
  const [history, setHistory] = useState<SessionLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('technical_explainer_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('technical_explainer_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Handle Preset Selection
  const handleLoadPreset = (key: string) => {
    const preset = SAMPLE_DATASETS[key];
    if (preset) {
      setProductName(preset.productName);
      setInputMode('csv');
      setCsvText(preset.csvData);
      setErrorMsg(null);
      try {
        const rows = parseCSVData(preset.csvData);
        if (rows.length > 0) {
          const { indicators: tech, chartData: cd } = computeTechnicalIndicators(rows);
          setIndicators(tech);
          setChartData(cd);
        }
      } catch (e) {
        console.warn('Failed to parse preset CSV', e);
      }
    }
  };

  // Run Technical & AI Analysis
  const handleAnalyze = async () => {
    if (!productName.trim()) {
      setErrorMsg('Please enter a product / asset name.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      let computedTech: TechnicalIndicators | null = null;
      let computedChart: ChartDataPoint[] = [];

      if (inputMode === 'csv') {
        const rows = parseCSVData(csvText);
        if (rows.length === 0) {
          throw new Error('No valid price data rows parsed from CSV. Please check formatting (e.g. Date, Close).');
        }

        const { indicators: tech, chartData: cd } = computeTechnicalIndicators(rows);
        computedTech = tech;
        computedChart = cd;

        setIndicators(tech);
        setChartData(cd);
      } else {
        if (!manualDesc.trim()) {
          throw new Error('Please type a market description before analyzing.');
        }
        setIndicators(null);
        setChartData([]);
      }

      // Call Express server API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          inputMode,
          manualDesc: inputMode === 'manual' ? manualDesc : undefined,
          indicators: computedTech,
          rowCount: computedChart.length,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server analysis error (${response.status})`);
      }

      const resultData: AnalysisResponse = await response.json();
      setAnalysis(resultData);

      // Save to Session Log
      const logItem: SessionLogItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        productName,
        inputMode,
        primaryPattern: resultData.patterns[0]?.name || 'Pattern Analysis',
        impliedCall: resultData.impliedCall || 'hold',
        rationale: resultData.rationale || '',
        entryPrice: computedTech?.currentPrice || 0,
        outcome: 'pending',
        exitPrice: null,
        pctMove: null,
        resolvedTimestamp: null,
        technicals: computedTech || undefined,
        manualDesc: inputMode === 'manual' ? manualDesc : undefined,
        analysis: resultData,
      };

      setHistory((prev) => [logItem, ...prev].slice(0, 20));
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Reload past log item
  const handleSelectLogItem = (item: SessionLogItem) => {
    setProductName(item.productName);
    setInputMode(item.inputMode);
    if (item.manualDesc) setManualDesc(item.manualDesc);
    if (item.technicals) setIndicators(item.technicals);
    setAnalysis(item.analysis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete log item
  const handleDeleteLogItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Update log item outcome
  const handleUpdateOutcome = (
    id: string,
    outcomeData: {
      outcome: 'pending' | 'correct' | 'incorrect';
      exitPrice: number | null;
      pctMove: number | null;
      resolvedTimestamp: string | null;
    }
  ) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...outcomeData } : item))
    );
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all session analysis logs?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-950/90 border border-rose-800 text-rose-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-xs sm:text-sm">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs underline text-rose-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Grid: Input Panel & Live Stats / Quick Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel (Col 1-5 on LG) */}
          <div className="lg:col-span-5">
            <InputPanel
              productName={productName}
              setProductName={setProductName}
              inputMode={inputMode}
              setInputMode={setInputMode}
              csvText={csvText}
              setCsvText={setCsvText}
              manualDesc={manualDesc}
              setManualDesc={setManualDesc}
              onAnalyze={handleAnalyze}
              loading={loading}
              onLoadPreset={handleLoadPreset}
            />
          </div>

          {/* Visualization / Initial State Panel (Col 6-12 on LG) */}
          <div className="lg:col-span-7 space-y-6">
            {/* If CSV and parsed indicators exist, show exact JS math cards */}
            {indicators && <TechnicalStatsCards indicators={indicators} />}

            {/* If chart data exists, render Recharts price chart */}
            {chartData.length > 0 && (
              <PriceChart data={chartData} productName={productName} />
            )}

            {/* If no analysis run yet, display guidance card */}
            {!analysis && !loading && (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Ready for Technical Analysis
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Paste your CSV price data or select a preset above, then click{' '}
                    <span className="text-cyan-400 font-semibold">"ANALYZE TECHNICAL PATTERNS"</span>{' '}
                    to generate plain-language pattern interpretations, confidence notes, and key triggers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Results Section */}
        {analysis && (
          <div className="pt-2">
            <AnalysisResults analysis={analysis} productName={productName} />
          </div>
        )}

        {/* Session Log Table Section */}
        <div className="pt-4">
          <SessionHistory
            history={history}
            onSelectLogItem={handleSelectLogItem}
            onDeleteLogItem={handleDeleteLogItem}
            onClearHistory={handleClearHistory}
            onUpdateOutcome={handleUpdateOutcome}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Technical Pattern Explainer — Quantitative Math + AI Analysis</span>
          <span className="font-mono text-[11px] text-slate-600">
            Educational tool for technical market analysis. Not financial advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
