// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./app.css";

import SearchBar from "./components/SearchBar";
import TickerCard from "./components/TickerCard";
import IndicatorsPanel from "./components/IndicatorsPanel";
import StockChart from "./components/StockChart";

import { getDailySeries, getRealtimeQuote } from "./services/alphaVantage";
import enrichWithIndicators from "./utils/Indicators";
import useLocalCache from "./hooks/useLocalCache";

const RANGES = [
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "6M", days: 132 },
  { key: "1Y", days: 264 },
  { key: "5Y", days: 1320 },
  { key: "MAX", days: Infinity },
];

const DEFAULT_INDICATORS = {
  sma: { enabled: true, period: 20 },
  ema: { enabled: false, period: 20 },
  rsi: { enabled: true, period: 14 },
  macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
  bb: { enabled: false, period: 20, stdDev: 2 },
};

export default function App() {
  // persisted user prefs
  const [indicators, setIndicators] = useLocalCache(
    "indicators_cfg",
    DEFAULT_INDICATORS
  );
  const [lastSymbol, setLastSymbol] = useLocalCache("last_symbol", "AAPL");

  // runtime state
  const [query, setQuery] = useState(lastSymbol || "AAPL");
  const [symbol, setSymbol] = useState(lastSymbol || "AAPL");
  const [range, setRange] = useState("6M");

  const [data, setData] = useState([]); // [{ date, open, high, low, close, volume }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [realtimeQuote, setRealtimeQuote] = useState(null);

  // fetch when symbol changes
  useEffect(() => {
    let active = true;
    async function run() {
      try {
        setLoading(true);
        setError("");
        const rows = await getDailySeries(symbol); // expects sorted oldest->newest or we’ll sort below
        if (!active) return;
        const sorted = Array.isArray(rows)
          ? [...rows].sort((a, b) => new Date(a.date) - new Date(b.date))
          : [];
        setData(sorted);
        setLastSymbol(symbol);
      } catch (e) {
        if (!active) return;
        setError(normalizeErr(e));
        setData([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }
    if (symbol && symbol.trim()) run();
    return () => {
      active = false;
    };
  }, [symbol, setLastSymbol]);

  // realtime polling: fetch latest quote immediately and every 30s
  useEffect(() => {
    let mounted = true;
    let timer = null;

    async function loadQuote() {
      try {
        const q = await getRealtimeQuote(symbol);
        if (!mounted) return;
        setRealtimeQuote(q);
      } catch (err) {
        // swallow or set error state if needed
        console.warn("Realtime quote fetch failed:", err);
      }
    }

    if (symbol) {
      loadQuote();
      timer = setInterval(loadQuote, 30000); // poll every 30 seconds
    } else {
      setRealtimeQuote(null);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [symbol]);

  // apply range
  const ranged = useMemo(() => {
    if (!data?.length) return [];
    if (range === "MAX") return data;
    const days = RANGES.find(r => r.key === range)?.days ?? Infinity;
    return data.slice(-days);
  }, [data, range]);

  // compute indicators just-in-time for the chart
  const chartData = useMemo(
    () => enrichWithIndicators(ranged, indicators),
    [ranged, indicators]
  );

  // compute meta for TickerCard
  const meta = useMemo(() => {
    if (!ranged?.length) return null;
    const last = ranged[ranged.length - 1];
    const prev = ranged[ranged.length - 2] || last;
    const change = last.close - prev.close;
    const pct = prev.close ? (change / prev.close) * 100 : 0;
    return {
      symbol,
      lastClose: last.close,
      change,
      pct,
      asOf: new Date(last.date),
      volume: last.volume,
    };
  }, [ranged, symbol]);

  // handlers: ensure selecting a suggestion updates symbol (and persisted lastSymbol)
  function handleSearchSubmit(nextSymbol) {
    // called when user presses Load/Enter or SearchBar calls onSubmit(symbol)
    const s = (nextSymbol || query || "").toString().trim().toUpperCase();
    if (!s) return;
    // update local query and persist last symbol
    setQuery(s);
    setLastSymbol(s);
    // trigger fetch by updating the controlled `symbol` which your effect watches
    setSymbol(s);
  }

  function handleQuickPick(tkr) {
    // called when user clicks Select on a suggestion (SearchBar.onSelect)
    if (!tkr) return;
    const s = tkr.toString().trim().toUpperCase();
    setQuery(s);
    setLastSymbol(s);
    setSymbol(s); // triggers series fetch + realtime polling
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>📈 Stock Analysis</h1>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          // allow SearchBar to call onSubmit(symbol) when a suggestion is selected
          onSubmit={(symbol) => handleSearchSubmit(symbol)}
          // explicit select handler for quick selection
          onSelect={(symbol) => handleQuickPick(symbol)}
          placeholder="Search ticker… e.g., AAPL, MSFT, TSLA"
        />

        <div className="quick-picks">
          <span className="muted">Quick picks:</span>
          {["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"].map(t => (
            <button
              key={t}
              className="chip"
              onClick={() => handleQuickPick(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className="range-group">
            {RANGES.map(r => (
              <button
                key={r.key}
                className={`range-btn ${range === r.key ? "active" : ""}`}
                onClick={() => setRange(r.key)}
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>

        {meta && (
          <div className="ticker-wrap">
            <TickerCard
              symbol={meta.symbol}
              lastClose={meta.lastClose}
              change={meta.change}
              pct={meta.pct}
              asOf={meta.asOf}
              volume={meta.volume}
            />
          </div>
        )}
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <IndicatorsPanel value={indicators} onChange={setIndicators} />
          <p className="hint">
            Toggle indicators and tweak parameters. Changes apply instantly.
          </p>
        </aside>

        <section className="content">
          {loading && <SkeletonPanel label="Fetching latest prices..." />}
          {!loading && error && <ErrorPanel message={error} onRetry={() => handleSearchSubmit(symbol)} />}
          {!loading && !error && chartData.length === 0 && (
            <EmptyPanel symbol={symbol} />
          )}
          {!loading && !error && chartData.length > 0 && (
            <StockChart data={chartData} indicators={indicators} height={540} />
          )}
        </section>
      </main>

      <footer className="app-footer">
        Data source: Alpha Vantage (Daily). Free tier may be delayed/rate-limited. Add your key in <code>.env</code>.
      </footer>
    </div>
  );
}

/* ------------------------------- UI helpers ------------------------------- */

function SkeletonPanel({ label = "Loading..." }) {
  return (
    <div className="panel skeleton">
      <div className="spinner" />
      <div>{label}</div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="panel error">
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Something went wrong</div>
      <div style={{ marginBottom: 12 }}>{message}</div>
      <button className="btn" onClick={onRetry}>Retry</button>
    </div>
  );
}

function EmptyPanel({ symbol }) {
  return (
    <div className="panel empty">
      <div style={{ fontSize: 16 }}>
        No data to display for <b>{symbol.toUpperCase()}</b>.
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        Try a different ticker or adjust the range.
      </div>
    </div>
  );
}

/* --------------------------------- utils ---------------------------------- */

function normalizeErr(e) {
  const msg = (e && (e.message || String(e))) || "Unknown error";
  // friendly Alpha Vantage messages
  if (/rate limit/i.test(msg) || /Note/i.test(msg)) {
    return "API rate limit reached. Try again shortly or add your own API key in .env.";
  }
  if (/invalid/i.test(msg)) return "Invalid ticker symbol or API error.";
  if (/time series/i.test(msg)) return "Unexpected API response (time series not found).";
  return msg;
}
