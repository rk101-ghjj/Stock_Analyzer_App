import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine
} from "recharts";

/**
 * StockChart
 * Props:
 * - data: Array<{ date: string|Date, open:number, high:number, low:number, close:number, volume:number }>
 * - indicators: {
 *     sma: { enabled: boolean, period: number },
 *     ema: { enabled: boolean, period: number },
 *     rsi: { enabled: boolean, period: number },
 *     macd: { enabled: boolean, fast: number, slow: number, signal: number },
 *     bb:  { enabled: boolean, period: number, stdDev: number }
 *   }
 * - height?: number
 */
export default function StockChart({ data = [], indicators, height = 520 }) {
  const prepared = useMemo(() => enrichWithIndicators(data, indicators), [data, indicators]);
  const priceData = prepared;
  const rsiData = prepared.map(d => ({ date: d.date, rsi: d.rsi }));
  const macdData = prepared.map(d => ({ date: d.date, macd: d.macd, macdSignal: d.macdSignal, macdHist: d.macdHist }));

  return (
    <div style={{ width: "100%", display: "grid", gap: 14 }}>
      {/* PRICE + OVERLAYS */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={priceData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              minTickGap={28}
            />
            <YAxis yAxisId="price" domain={["auto", "auto"]} />
            <YAxis yAxisId="vol" orientation="right" width={40} domain={[0, 'auto']} hide />
            <Tooltip labelFormatter={(v) => formatLabel(v)} />
            <Legend />

            {/* Price line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              name="Close"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Volume bars (faded) */}
            <Bar
              yAxisId="vol"
              dataKey="volume"
              name="Volume"
              opacity={0.3}
              barSize={14}
            />

            {/* SMA / EMA */}
            {indicators?.sma?.enabled && (
              <Line yAxisId="price" type="monotone" dataKey="sma" name={`SMA (${indicators.sma.period})`} strokeWidth={1.5} dot={false} />
            )}
            {indicators?.ema?.enabled && (
              <Line yAxisId="price" type="monotone" dataKey="ema" name={`EMA (${indicators.ema.period})`} strokeWidth={1.5} dot={false} />
            )}

            {/* Bollinger Bands as area between upper & lower */}
            {indicators?.bb?.enabled && (
              <>
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbUpper"
                  name={`BB Upper`}
                  dot={false}
                  fillOpacity={0.1}
                  strokeOpacity={0.6}
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbLower"
                  name={`BB Lower`}
                  dot={false}
                  fillOpacity={0.1}
                  strokeOpacity={0.6}
                />
              </>
            )}

            <Brush dataKey="date" height={20} stroke="#ccc" travellerWidth={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI (if enabled) */}
      {indicators?.rsi?.enabled && (
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <ComposedChart data={rsiData} margin={{ top: 6, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatTick} minTickGap={28} />
              <YAxis domain={[0, 100]} />
              <Tooltip labelFormatter={(v) => formatLabel(v)} />
              <Legend />
              <Line type="monotone" dataKey="rsi" name={`RSI (${indicators.rsi.period})`} dot={false} isAnimationActive={false} />
              <ReferenceLine y={70} strokeDasharray="3 3" />
              <ReferenceLine y={30} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD (if enabled) */}
      {indicators?.macd?.enabled && (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <ComposedChart data={macdData} margin={{ top: 6, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatTick} minTickGap={28} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(v) => formatLabel(v)} />
              <Legend />
              <Bar dataKey="macdHist" name="MACD Hist" barSize={10} />
              <Line type="monotone" dataKey="macd" name="MACD" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="macdSignal" name={`Signal (${indicators.macd.signal})`} dot={false} isAnimationActive={false} />
              <ReferenceLine y={0} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** ---------- Helpers & Indicators ---------- */

function formatTick(v) {
  // v is original date value
  const d = new Date(v);
  if (Number.isNaN(+d)) return v;
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth()+1)
    .toString().padStart(2, "0")}`;
}
function formatLabel(v) {
  const d = new Date(v);
  if (Number.isNaN(+d)) return v;
  return d.toLocaleDateString();
}

function enrichWithIndicators(data, indicators) {
  if (!Array.isArray(data)) return [];

  // Normalize & shallow clone
  const arr = data.map(d => ({
    ...d,
    date: d.date instanceof Date ? d.date.toISOString() : d.date
  }));

  const closes = arr.map(d => d.close);

  // SMA
  if (indicators?.sma?.enabled) {
    const smaValues = SMA(closes, indicators.sma.period);
    for (let i = 0; i < arr.length; i++) arr[i].sma = smaValues[i] ?? null;
  }

  // EMA
  if (indicators?.ema?.enabled) {
    const emaValues = EMA(closes, indicators.ema.period);
    for (let i = 0; i < arr.length; i++) arr[i].ema = emaValues[i] ?? null;
  }

  // RSI
  if (indicators?.rsi?.enabled) {
    const rsiValues = RSI(closes, indicators.rsi.period);
    for (let i = 0; i < arr.length; i++) arr[i].rsi = rsiValues[i] ?? null;
  }

  // MACD
  if (indicators?.macd?.enabled) {
    const { macd, signal, hist } = MACD(closes, indicators.macd.fast, indicators.macd.slow, indicators.macd.signal);
    for (let i = 0; i < arr.length; i++) {
      arr[i].macd = macd[i] ?? null;
      arr[i].macdSignal = signal[i] ?? null;
      arr[i].macdHist = hist[i] ?? null;
    }
  }

  // Bollinger Bands
  if (indicators?.bb?.enabled) {
    const { upper, lower } = BollingerBands(closes, indicators.bb.period, indicators.bb.stdDev);
    for (let i = 0; i < arr.length; i++) {
      arr[i].bbUpper = upper[i] ?? null;
      arr[i].bbLower = lower[i] ?? null;
    }
  }

  return arr;
}

function SMA(values, period) {
  const out = Array(values.length).fill(null);
  if (!period || period < 1) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function EMA(values, period) {
  const out = Array(values.length).fill(null);
  if (!period || period < 1) return out;
  const k = 2 / (period + 1);
  let ema = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < period - 1) {
      // wait until enough points to seed
      out[i] = null;
      continue;
    }
    if (ema === null) {
      // seed with SMA of first 'period' values
      let sum = 0;
      for (let j = i - (period - 1); j <= i; j++) sum += values[j];
      ema = sum / period;
    } else {
      ema = v * k + ema * (1 - k);
    }
    out[i] = ema;
  }
  return out;
}

function RSI(values, period = 14) {
  const out = Array(values.length).fill(null);
  if (period < 2) return out;
  let gains = 0, losses = 0;

  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (i <= period) {
      if (change > 0) gains += change; else losses -= Math.min(change, 0);
      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out[i] = 100 - (100 / (1 + rs));
      }
    } else {
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : gains / losses;
      out[i] = 100 - (100 / (1 + rs));
    }
  }
  return out;
}

function MACD(values, fast = 12, slow = 26, signal = 9) {
  const fastEma = EMA(values, fast);
  const slowEma = EMA(values, slow);
  const macd = values.map((_, i) =>
    fastEma[i] != null && slowEma[i] != null ? fastEma[i] - slowEma[i] : null
  );
  const signalLine = EMA(macd.map(v => (v == null ? 0 : v)), signal)
    .map((v, i) => (macd[i] == null ? null : v));
  const hist = macd.map((v, i) => (v == null || signalLine[i] == null ? null : v - signalLine[i]));
  return { macd, signal: signalLine, hist };
}

function BollingerBands(values, period = 20, stdDev = 2) {
  const upper = Array(values.length).fill(null);
  const lower = Array(values.length).fill(null);
  if (period < 2) return { upper, lower };

  let window = [];
  let sum = 0, sumSq = 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    window.push(v);
    sum += v; sumSq += v * v;

    if (window.length > period) {
      const first = window.shift();
      sum -= first; sumSq -= first * first;
    }

    if (window.length === period) {
      const mean = sum / period;
      const variance = (sumSq / period) - mean * mean;
      const sd = Math.sqrt(Math.max(variance, 0));
      upper[i] = mean + stdDev * sd;
      lower[i] = mean - stdDev * sd;
    }
  }
  return { upper, lower };
}