import { PriceRow, TechnicalIndicators, ChartDataPoint } from '../types';

/**
 * Calculates Simple Moving Average (SMA) for a given period.
 */
export function calculateMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (i >= period - 1) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += values[j];
      }
      result[i] = Number((sum / period).toFixed(2));
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothing method.
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  // First period calculation
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = Number((100 - 100 / (1 + rs)).toFixed(2));
  }

  // Subsequent periods using Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = Number((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  return rsi;
}

/**
 * Parses raw CSV string into clean PriceRow objects.
 * Handles headers like Date, Close, Open, High, Low, Volume.
 */
export function parseCSVData(csvText: string): PriceRow[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Determine if first line is header
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('date') ||
    firstLine.includes('close') ||
    firstLine.includes('price') ||
    isNaN(Number(lines[0].split(/,|\t/)[0]));

  let headers: string[] = [];
  let dataLines: string[] = [];

  if (hasHeader) {
    headers = lines[0].split(/,|\t/).map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
    dataLines = lines.slice(1);
  } else {
    headers = ['date', 'close'];
    dataLines = lines;
  }

  const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
  const closeIdx = headers.findIndex((h) => h.includes('close') || h.includes('price') || h.includes('val'));
  const openIdx = headers.findIndex((h) => h.includes('open'));
  const highIdx = headers.findIndex((h) => h.includes('high'));
  const lowIdx = headers.findIndex((h) => h.includes('low'));
  const volIdx = headers.findIndex((h) => h.includes('vol'));

  const parsed: PriceRow[] = [];

  dataLines.forEach((line, index) => {
    const cols = line.split(/,|\t/).map((c) => c.trim().replace(/["']/g, ''));
    if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) return;

    let dateVal = `Day ${index + 1}`;
    if (dateIdx !== -1 && cols[dateIdx]) {
      dateVal = cols[dateIdx];
    } else if (cols.length > 0 && isNaN(Number(cols[0]))) {
      dateVal = cols[0];
    }

    let closeVal = NaN;
    if (closeIdx !== -1 && cols[closeIdx]) {
      closeVal = parseFloat(cols[closeIdx]);
    } else {
      // Find first numeric column
      for (const col of cols) {
        const num = parseFloat(col);
        if (!isNaN(num)) {
          closeVal = num;
          break;
        }
      }
    }

    if (!isNaN(closeVal)) {
      const row: PriceRow = {
        date: dateVal,
        close: Number(closeVal.toFixed(2)),
      };

      if (openIdx !== -1 && cols[openIdx] && !isNaN(parseFloat(cols[openIdx]))) {
        row.open = Number(parseFloat(cols[openIdx]).toFixed(2));
      }
      if (highIdx !== -1 && cols[highIdx] && !isNaN(parseFloat(cols[highIdx]))) {
        row.high = Number(parseFloat(cols[highIdx]).toFixed(2));
      }
      if (lowIdx !== -1 && cols[lowIdx] && !isNaN(parseFloat(cols[lowIdx]))) {
        row.low = Number(parseFloat(cols[lowIdx]).toFixed(2));
      }
      if (volIdx !== -1 && cols[volIdx] && !isNaN(parseFloat(cols[volIdx]))) {
        row.volume = Number(parseFloat(cols[volIdx]).toFixed(0));
      }

      parsed.push(row);
    }
  });

  return parsed;
}

/**
 * Computes all technical indicators and chart dataset from PriceRow array.
 */
export function computeTechnicalIndicators(rows: PriceRow[]): {
  indicators: TechnicalIndicators;
  chartData: ChartDataPoint[];
} {
  if (!rows || rows.length === 0) {
    throw new Error('No valid price data provided.');
  }

  const closes = rows.map((r) => r.close);
  const ma20 = calculateMA(closes, 20);
  const ma50 = calculateMA(closes, 50);
  const rsi14 = calculateRSI(closes, 14);

  const lastIdx = rows.length - 1;
  const currentPrice = closes[lastIdx];
  const firstPrice = closes[0];
  const prevPrice = lastIdx > 0 ? closes[lastIdx - 1] : currentPrice;

  const priceChange = Number((currentPrice - prevPrice).toFixed(2));
  const priceChangePercent = Number(((priceChange / prevPrice) * 100).toFixed(2));

  // Rolling 10-period High and Low
  const recentSlice = closes.slice(Math.max(0, rows.length - 10));
  const high10 = Math.max(...recentSlice);
  const low10 = Math.min(...recentSlice);

  const currentMa20 = ma20[lastIdx];
  const currentMa50 = ma50[lastIdx];
  const currentRsi = rsi14[lastIdx];

  const ma20DistancePct = currentMa20 ? Number((((currentPrice - currentMa20) / currentMa20) * 100).toFixed(2)) : null;
  const ma50DistancePct = currentMa50 ? Number((((currentPrice - currentMa50) / currentMa50) * 100).toFixed(2)) : null;

  let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
  if (currentPrice > firstPrice * 1.01) trend = 'uptrend';
  else if (currentPrice < firstPrice * 0.99) trend = 'downtrend';

  let maAlignment: 'golden_cross' | 'death_cross' | 'bullish_stack' | 'bearish_stack' | 'mixed' = 'mixed';
  if (currentMa20 && currentMa50) {
    const prevMa20 = lastIdx > 0 ? ma20[lastIdx - 1] : null;
    const prevMa50 = lastIdx > 0 ? ma50[lastIdx - 1] : null;

    if (prevMa20 && prevMa50 && prevMa20 <= prevMa50 && currentMa20 > currentMa50) {
      maAlignment = 'golden_cross';
    } else if (prevMa20 && prevMa50 && prevMa20 >= prevMa50 && currentMa20 < currentMa50) {
      maAlignment = 'death_cross';
    } else if (currentPrice > currentMa20 && currentMa20 > currentMa50) {
      maAlignment = 'bullish_stack';
    } else if (currentPrice < currentMa20 && currentMa20 < currentMa50) {
      maAlignment = 'bearish_stack';
    }
  }

  const indicators: TechnicalIndicators = {
    currentPrice,
    open: rows[lastIdx].open,
    high: rows[lastIdx].high,
    low: rows[lastIdx].low,
    volume: rows[lastIdx].volume,
    ma20: currentMa20,
    ma50: currentMa50,
    rsi14: currentRsi,
    high10,
    low10,
    priceChange,
    priceChangePercent,
    ma20DistancePct,
    ma50DistancePct,
    trend,
    maAlignment,
  };

  const chartData: ChartDataPoint[] = rows.map((r, i) => ({
    date: r.date,
    close: r.close,
    open: r.open,
    high: r.high,
    low: r.low,
    volume: r.volume,
    ma20: ma20[i],
    ma50: ma50[i],
    rsi: rsi14[i],
  }));

  return { indicators, chartData };
}

/**
 * Pre-populated realistic market CSV samples for instant user testing.
 */
export const SAMPLE_DATASETS: Record<
  string,
  { productName: string; description: string; csvData: string }
> = {
  custom_user_csv: {
    productName: 'Crude Oil / Commodity Futures',
    description: 'User provided daily price dataset (May - Jul 2026 downtrend to bottom bounce)',
    csvData: `Date,Close,Open,High,Low,Volume
2026-05-01,78.42,78.42,78.92,77.99,187455
2026-05-04,77.84,78.42,78.81,77.47,216672
2026-05-05,77.88,77.84,78.38,77.71,173179
2026-05-06,78.6,77.88,78.95,77.35,125714
2026-05-07,77.95,78.6,78.97,77.7,182946
2026-05-08,77.3,77.95,78.26,77.12,189616
2026-05-11,78.06,77.3,78.15,77.2,185983
2026-05-12,78.19,78.06,78.33,77.66,204123
2026-05-13,77.36,78.19,78.29,76.92,229661
2026-05-14,77.32,77.36,77.78,77.23,123484
2026-05-15,76.5,77.32,77.57,76.15,162989
2026-05-18,75.69,76.5,76.85,75.49,116212
2026-05-19,75.42,75.69,76.25,75.0,123525
2026-05-20,73.55,75.42,75.63,73.39,243707
2026-05-21,71.86,73.55,73.83,71.44,143208
2026-05-22,71.02,71.86,72.31,70.76,113828
2026-05-25,69.89,71.02,71.2,69.36,229783
2026-05-26,69.69,69.89,70.0,69.55,83420
2026-05-27,68.65,69.69,69.9,68.42,176752
2026-05-28,67.28,68.65,68.8,67.16,211373
2026-05-29,67.86,67.28,68.37,66.78,195294
2026-06-01,67.31,67.86,68.31,66.83,204019
2026-06-02,66.95,67.31,67.68,66.76,145726
2026-06-03,65.61,66.95,67.43,65.24,221564
2026-06-04,64.86,65.61,66.04,64.42,195668
2026-06-05,64.94,64.86,65.09,64.54,86102
2026-06-08,64.52,64.94,65.41,64.22,198015
2026-06-09,64.7,64.52,65.01,64.35,106641
2026-06-10,64.5,64.7,65.13,64.39,245656
2026-06-11,64.42,64.5,64.97,63.95,243817
2026-06-12,64.22,64.42,64.63,63.75,234165
2026-06-15,64.97,64.22,65.09,63.87,183746
2026-06-16,64.99,64.97,65.16,64.75,116631
2026-06-17,64.62,64.99,65.25,64.4,152991
2026-06-18,64.97,64.62,65.41,64.23,84014
2026-06-19,64.53,64.97,65.43,64.06,91093
2026-06-22,64.64,64.53,64.71,64.06,98070
2026-06-23,63.92,64.64,64.94,63.51,115777
2026-06-24,63.44,63.92,64.17,63.09,136958
2026-06-25,63.55,63.44,63.71,63.34,162074
2026-06-26,63.86,63.55,63.98,63.41,90729
2026-06-29,63.96,63.86,64.18,63.39,238823
2026-06-30,63.95,63.96,64.45,63.61,185864
2026-07-01,63.86,63.95,64.16,63.79,210858
2026-07-02,63.33,63.86,64.16,63.22,185510
2026-07-03,63.4,63.33,63.78,62.97,134748
2026-07-06,63.65,63.4,63.88,63.33,85801
2026-07-07,64.98,63.65,65.49,63.51,230262
2026-07-08,65.81,64.98,66.32,64.67,109592
2026-07-09,65.13,65.81,65.99,64.75,90647
2026-07-10,65.95,65.13,66.25,64.90,142800`,
  },
  gold_golden_cross: {
    productName: 'Gold Futures (GC=F)',
    description: 'Gold breakout & Golden Cross above 50-day moving average',
    csvData: `Date,Close,Open,High,Low,Volume
2026-06-01,2320.5,2315.0,2325.0,2310.0,142000
2026-06-02,2318.2,2321.0,2324.0,2312.0,138000
2026-06-03,2325.4,2318.0,2328.0,2315.0,150000
2026-06-04,2330.1,2326.0,2335.0,2322.0,165000
2026-06-05,2328.8,2331.0,2334.0,2324.0,140000
2026-06-08,2335.6,2329.0,2338.0,2327.0,158000
2026-06-09,2342.0,2336.0,2345.0,2332.0,172000
2026-06-10,2339.5,2342.0,2346.0,2335.0,149000
2026-06-11,2348.2,2340.0,2352.0,2338.0,181000
2026-06-12,2355.0,2349.0,2360.0,2345.0,195000
2026-06-15,2351.4,2356.0,2358.0,2348.0,160000
2026-06-16,2362.8,2352.0,2368.0,2350.0,188000
2026-06-17,2371.3,2363.0,2375.0,2360.0,210000
2026-06-18,2368.0,2372.0,2376.0,2364.0,175000
2026-06-19,2382.5,2369.0,2388.0,2366.0,225000
2026-06-22,2395.0,2383.0,2400.0,2380.0,240000
2026-06-23,2388.4,2396.0,2402.0,2384.0,198000
2026-06-24,2405.2,2389.0,2410.0,2386.0,255000
2026-06-25,2418.6,2406.0,2422.0,2402.0,268000
2026-06-26,2412.0,2419.0,2425.0,2408.0,215000
2026-06-29,2428.5,2413.0,2432.0,2410.0,280000
2026-06-30,2435.0,2429.0,2440.0,2425.0,295000
2026-07-01,2442.8,2436.0,2448.0,2430.0,310000
2026-07-02,2438.2,2443.0,2449.0,2434.0,260000
2026-07-03,2455.6,2439.0,2462.0,2437.0,325000
2026-07-06,2468.0,2456.0,2475.0,2452.0,340000
2026-07-07,2462.4,2469.0,2472.0,2458.0,290000
2026-07-08,2479.5,2463.0,2485.0,2460.0,360000
2026-07-09,2491.0,2480.0,2498.0,2476.0,385000
2026-07-10,2485.2,2492.0,2496.0,2480.0,310000
2026-07-13,2502.8,2486.0,2510.0,2484.0,410000
2026-07-14,2518.0,2504.0,2524.0,2500.0,430000
2026-07-15,2512.5,2519.0,2522.0,2506.0,350000
2026-07-16,2530.4,2513.0,2536.0,2510.0,450000
2026-07-17,2545.0,2531.0,2550.0,2528.0,480000
2026-07-20,2538.2,2546.0,2548.0,2532.0,390000
2026-07-21,2552.6,2539.0,2558.0,2535.0,465000
2026-07-22,2568.0,2553.0,2575.0,2550.0,510000
2026-07-23,2562.1,2569.0,2572.0,2555.0,420000
2026-07-24,2579.5,2563.0,2585.0,2560.0,530000
2026-07-27,2592.0,2580.0,2600.0,2576.0,560000
2026-07-28,2585.4,2593.0,2598.0,2580.0,450000
2026-07-29,2605.0,2586.0,2612.0,2584.0,580000
2026-07-30,2621.8,2606.0,2628.0,2602.0,610000
2026-07-31,2615.2,2622.0,2626.0,2608.0,490000
2026-08-03,2638.0,2616.0,2645.0,2614.0,640000
2026-08-04,2652.5,2639.0,2660.0,2635.0,670000
2026-08-05,2645.0,2653.0,2658.0,2640.0,520000
2026-08-06,2668.4,2646.0,2675.0,2644.0,710000
2026-08-07,2682.0,2669.0,2690.0,2665.0,750000`,
  },
  crude_oil_pullback: {
    productName: 'Crude Oil WTI (CL=F)',
    description: 'Oversold bounce off 50-day MA support after pull-back',
    csvData: `Date,Close,Open,High,Low,Volume
2026-06-01,82.50,81.80,83.10,81.50,310000
2026-06-02,83.20,82.60,83.80,82.20,325000
2026-06-03,84.10,83.30,84.60,83.00,340000
2026-06-04,85.00,84.20,85.50,83.90,360000
2026-06-05,84.60,85.10,85.30,84.10,290000
2026-06-08,85.80,84.70,86.20,84.50,380000
2026-06-09,86.50,85.90,87.00,85.60,400000
2026-06-10,85.90,86.60,86.90,85.20,320000
2026-06-11,87.20,86.00,87.80,85.80,420000
2026-06-12,88.10,87.30,88.60,87.00,450000
2026-06-15,87.40,88.20,88.50,86.90,330000
2026-06-16,86.20,87.50,87.70,85.80,350000
2026-06-17,85.10,86.30,86.50,84.60,370000
2026-06-18,84.00,85.20,85.40,83.50,390000
2026-06-19,83.20,84.10,84.30,82.80,410000
2026-06-22,82.10,83.30,83.50,81.60,430000
2026-06-23,81.50,82.20,82.40,81.00,440000
2026-06-24,80.80,81.60,81.90,80.20,460000
2026-06-25,79.90,80.90,81.10,79.30,480000
2026-06-26,79.10,80.00,80.30,78.50,500000
2026-06-29,78.50,79.20,79.50,78.00,520000
2026-06-30,78.00,78.60,78.80,77.40,540000
2026-07-01,77.60,78.10,78.30,77.00,550000
2026-07-02,77.90,77.70,78.40,77.20,490000
2026-07-03,78.50,78.00,79.00,77.80,470000
2026-07-06,79.30,78.60,79.80,78.40,450000
2026-07-07,80.20,79.40,80.70,79.10,480000
2026-07-08,81.00,80.30,81.50,80.00,510000
2026-07-09,81.80,81.10,82.30,80.80,530000
2026-07-10,82.60,81.90,83.00,81.60,550000`,
  },
  sp500_consolidation: {
    productName: 'S&P 500 E-mini (ES=F)',
    description: 'Tight range consolidation near all-time high resistance',
    csvData: `Date,Close,Open,High,Low,Volume
2026-06-01,5350.2,5340.0,5362.0,5335.0,1200000
2026-06-02,5362.5,5352.0,5370.0,5348.0,1250000
2026-06-03,5378.0,5364.0,5385.0,5360.0,1310000
2026-06-04,5370.4,5379.0,5382.0,5362.0,1180000
2026-06-05,5385.1,5371.0,5392.0,5368.0,1350000
2026-06-08,5392.0,5386.0,5400.0,5380.0,1400000
2026-06-09,5388.5,5393.0,5398.0,5381.0,1220000
2026-06-10,5402.6,5389.0,5410.0,5385.0,1480000
2026-06-11,5415.0,5403.0,5422.0,5398.0,1520000
2026-06-12,5410.2,5416.0,5420.0,5402.0,1290000
2026-06-15,5425.8,5411.0,5432.0,5408.0,1580000
2026-06-16,5438.0,5426.0,5445.0,5420.0,1650000
2026-06-17,5432.4,5439.0,5442.0,5425.0,1340000
2026-06-18,5446.5,5433.0,5452.0,5428.0,1710000
2026-06-19,5455.0,5447.0,5460.0,5442.0,1780000
2026-06-22,5450.2,5456.0,5458.0,5443.0,1410000
2026-06-23,5462.8,5451.0,5470.0,5448.0,1820000
2026-06-24,5471.0,5463.0,5478.0,5458.0,1890000
2026-06-25,5466.5,5472.0,5475.0,5460.0,1450000
2026-06-26,5480.0,5467.0,5488.0,5463.0,1950000
2026-06-29,5492.5,5481.0,5500.0,5478.0,2050000
2026-06-30,5487.0,5493.0,5496.0,5480.0,1510000
2026-07-01,5502.4,5488.0,5510.0,5485.0,2120000
2026-07-02,5515.0,5503.0,5522.0,5498.0,2200000
2026-07-03,5510.8,5516.0,5520.0,5502.0,1600000
2026-07-06,5524.0,5511.0,5532.0,5508.0,2280000
2026-07-07,5535.6,5525.0,5542.0,5520.0,2350000
2026-07-08,5530.2,5536.0,5540.0,5522.0,1720000
2026-07-09,5542.8,5531.0,5550.0,5528.0,2420000
2026-07-10,5550.0,5543.0,5558.0,5536.0,2500000`,
  },
  nifty50_rsi_divergence: {
    productName: 'Nifty 50 Index (NIFTY)',
    description: 'Nifty 50 rallying into overbought RSI above 20-day MA',
    csvData: `Date,Close,Open,High,Low,Volume
2026-06-01,22850,22780,22900,22750,420000
2026-06-02,22920,22860,22980,22830,440000
2026-06-03,23010,22930,23080,22900,470000
2026-06-04,22980,23020,23050,22920,390000
2026-06-05,23120,22990,23180,22960,500000
2026-06-08,23210,23130,23260,23100,530000
2026-06-09,23180,23220,23250,23140,410000
2026-06-10,23300,23190,23350,23160,560000
2026-06-11,23410,23310,23460,23280,590000
2026-06-12,23380,23420,23450,23330,430000
2026-06-15,23520,23390,23580,23360,620000
2026-06-16,23640,23530,23700,23500,660000
2026-06-17,23600,23650,23680,23550,480000
2026-06-18,23750,23610,23820,23580,700000
2026-06-19,23880,23760,23950,23720,750000
2026-06-22,23820,23890,23920,23780,520000
2026-06-23,23980,23830,24050,23800,790000
2026-06-24,24110,23990,24180,23960,830000
2026-06-25,24050,24120,24160,24000,580000
2026-06-26,24220,24060,24280,24030,880000
2026-06-29,24350,24230,24420,24200,920000
2026-06-30,24300,24360,24400,24250,640000
2026-07-01,24480,24310,24550,24280,980000
2026-07-02,24620,24490,24680,24450,1030000
2026-07-03,24560,24630,24660,24500,710000
2026-07-06,24750,24570,24820,24540,1100000
2026-07-07,24890,24760,24960,24720,1180000
2026-07-08,24820,24900,24930,24780,820000
2026-07-09,25010,24830,25080,24800,1250000
2026-07-10,25150,25020,25220,24980,1320000`,
  },
};
