import React, { useEffect, useMemo, useState } from "react";

/**
 * IndicatorsPanel
 * Props:
 * - value?: {
 *     sma: { enabled: boolean, period: number },
 *     ema: { enabled: boolean, period: number },
 *     rsi: { enabled: boolean, period: number },
 *     macd: { enabled: boolean, fast: number, slow: number, signal: number },
 *     bb:  { enabled: boolean, period: number, stdDev: number }
 *   }
 * - onChange: (config) => void
 */
export default function IndicatorsPanel({ value, onChange }) {
  const [config, setConfig] = useState(() => ({
    sma: { enabled: false, period: 20 },
    ema: { enabled: false, period: 20 },
    rsi: { enabled: false, period: 14 },
    macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
    bb:  { enabled: false, period: 20, stdDev: 2 },
    ...(value || {})
  }));

  // Debounce outgoing updates a little for snappier typing
  const debouncedConfig = useDebounce(config, 120);
  useEffect(() => {
    onChange && onChange(debouncedConfig);
  }, [debouncedConfig, onChange]);

  const Row = ({ label, children }) => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: "8px",
      alignItems: "center",
      marginBottom: 10
    }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );

  const Box = ({ children }) => (
    <div style={{
      border: "1px solid #e6e6e6",
      borderRadius: 10,
      padding: 12,
      background: "#fafafa"
    }}>{children}</div>
  );

  const Number = ({ value, min=1, max=500, step=1, onChange }) => (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: 84, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd" }}
    />
  );

  const Toggle = ({ checked, onChange, label }) => (
    <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );

  return (
    <Box>
      <Row label="Simple MA">
        <Toggle
          checked={config.sma.enabled}
          onChange={(v) => setConfig(c => ({ ...c, sma: { ...c.sma, enabled: v }}))}
          label="Enable"
        />
        <span>Period</span>
        <Number
          value={config.sma.period}
          onChange={(v) => setConfig(c => ({ ...c, sma: { ...c.sma, period: clamp(v, 1, 500) }}))}
        />
      </Row>

      <Row label="Exponential MA">
        <Toggle
          checked={config.ema.enabled}
          onChange={(v) => setConfig(c => ({ ...c, ema: { ...c.ema, enabled: v }}))}
          label="Enable"
        />
        <span>Period</span>
        <Number
          value={config.ema.period}
          onChange={(v) => setConfig(c => ({ ...c, ema: { ...c.ema, period: clamp(v, 1, 500) }}))}
        />
      </Row>

      <Row label="RSI">
        <Toggle
          checked={config.rsi.enabled}
          onChange={(v) => setConfig(c => ({ ...c, rsi: { ...c.rsi, enabled: v }}))}
          label="Enable"
        />
        <span>Period</span>
        <Number
          value={config.rsi.period}
          onChange={(v) => setConfig(c => ({ ...c, rsi: { ...c.rsi, period: clamp(v, 2, 500) }}))}
        />
      </Row>

      <Row label="MACD">
        <Toggle
          checked={config.macd.enabled}
          onChange={(v) => setConfig(c => ({ ...c, macd: { ...c.macd, enabled: v }}))}
          label="Enable"
        />
        <span>Fast</span>
        <Number
          value={config.macd.fast}
          onChange={(v) => setConfig(c => ({ ...c, macd: { ...c.macd, fast: clamp(v, 1, 200) }}))}
        />
        <span>Slow</span>
        <Number
          value={config.macd.slow}
          onChange={(v) => setConfig(c => ({ ...c, macd: { ...c.macd, slow: clamp(v, 2, 300) }}))}
        />
        <span>Signal</span>
        <Number
          value={config.macd.signal}
          onChange={(v) => setConfig(c => ({ ...c, macd: { ...c.macd, signal: clamp(v, 1, 200) }}))}
        />
      </Row>

      <Row label="Bollinger Bands">
        <Toggle
          checked={config.bb.enabled}
          onChange={(v) => setConfig(c => ({ ...c, bb: { ...c.bb, enabled: v }}))}
          label="Enable"
        />
        <span>Period</span>
        <Number
          value={config.bb.period}
          onChange={(v) => setConfig(c => ({ ...c, bb: { ...c.bb, period: clamp(v, 2, 500) }}))}
        />
        <span>Std Dev</span>
        <Number
          value={config.bb.stdDev}
          step={0.5}
          onChange={(v) => setConfig(c => ({ ...c, bb: { ...c.bb, stdDev: clamp(v, 0.5, 5) }}))}
        />
      </Row>
    </Box>
  );
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function useDebounce(value, delay = 150) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}