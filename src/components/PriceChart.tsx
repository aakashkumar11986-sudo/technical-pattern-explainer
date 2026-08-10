import React, { useState } from 'react';
import { ChartDataPoint } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Eye, EyeOff, BarChart2 } from 'lucide-react';

interface PriceChartProps {
  data: ChartDataPoint[];
  productName: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, productName }) => {
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showRSI, setShowRSI] = useState(true);

  if (!data || data.length === 0) return null;

  // Compute y-axis domain padding
  const closes = data.map((d) => d.close);
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const pricePadding = (maxPrice - minPrice) * 0.08 || 5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header & Line Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
            {productName || 'Market'} Price & Indicator Chart
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">({data.length} periods)</span>
        </div>

        {/* Legend / Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowMA20(!showMA20)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all ${
              showMA20
                ? 'bg-amber-950/80 text-amber-300 border-amber-800 font-medium'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showMA20 ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3" />}
            <span>MA20 (20-SMA)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMA50(!showMA50)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all ${
              showMA50
                ? 'bg-purple-950/80 text-purple-300 border-purple-800 font-medium'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showMA50 ? <Eye className="w-3 h-3 text-purple-400" /> : <EyeOff className="w-3 h-3" />}
            <span>MA50 (50-SMA)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRSI(!showRSI)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all ${
              showRSI
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800 font-medium'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through'
            }`}
          >
            {showRSI ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
            <span>RSI(14) Subplot</span>
          </button>
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => {
                if (val && typeof val === 'string' && val.length > 10) {
                  return val.slice(5, 10);
                }
                return val;
              }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[Math.floor(minPrice - pricePadding), Math.ceil(maxPrice + pricePadding)]}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              }}
              formatter={(value: any, name: any) => {
                if (value === null || value === undefined) return ['N/A', name];
                const num = Number(value);
                if (name === 'Close Price') return [`$${num.toLocaleString()}`, name];
                if (name === 'MA20') return [`$${num.toLocaleString()}`, 'MA20 (Yellow)'];
                if (name === 'MA50') return [`$${num.toLocaleString()}`, 'MA50 (Purple)'];
                return [num.toFixed(2), name];
              }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="close"
              name="Close Price"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
            />
            {showMA20 && (
              <Line
                type="monotone"
                dataKey="ma20"
                name="MA20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                connectNulls
              />
            )}
            {showMA50 && (
              <Line
                type="monotone"
                dataKey="ma50"
                name="MA50"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Subplot: RSI(14) Indicator */}
      {showRSI && (
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              RSI (14) Oscillator Subplot
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="text-rose-400">70 Overbought</span>
              <span className="text-slate-500">50 Neutral</span>
              <span className="text-emerald-400">30 Oversold</span>
            </div>
          </div>
          <div className="w-full h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  stroke="#64748b"
                  fontSize={9}
                  domain={[0, 100]}
                  ticks={[30, 50, 70]}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.375rem',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [val !== null ? Number(val).toFixed(2) : 'N/A', 'RSI(14)']}
                />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  name="RSI(14)"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
