import React, { useState, useEffect } from "react";

/**
 * SearchBar
 * props:
 *  - value, onChange, onSubmit(symbol), onSelect(symbol), placeholder
 */
export default function SearchBar({ value, onChange, onSubmit, onSelect, placeholder }) {
  const [input, setInput] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => setInput(value || ""), [value]);

  // Replace this with your real suggestion endpoint if you have one.
  async function fetchSuggestions(q) {
    if (!q) {
      setSuggestions([]);
      return;
    }
    try {
      // Example placeholder behaviour: echo variations of the query.
      // If you have an API, call it here and setSuggestions(responseData).
      setSuggestions([
        { symbol: q.toUpperCase(), name: `${q.toUpperCase()} Inc.` },
        { symbol: q.toUpperCase() + "X", name: `${q.toUpperCase()}X Ltd.` },
      ]);
    } catch (e) {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => fetchSuggestions(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input]);

  function handleSelect(item) {
    const symbol =
      typeof item === "string"
        ? item.toUpperCase()
        : (item.symbol || item.ticker || item.code || item.name || "").toUpperCase();

    setInput(symbol);
    if (typeof onChange === "function") onChange(symbol);

    if (typeof onSelect === "function") {
      onSelect(symbol);
    } else if (typeof onSubmit === "function") {
      onSubmit(symbol);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (!s) return;
    if (typeof onSubmit === "function") onSubmit(s);
  }

  return (
    <div className="searchbar">
      <form onSubmit={handleFormSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          value={input}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            if (typeof onChange === "function") onChange(v);
          }}
        />
        <button type="submit" className="button">Load</button>
      </form>

      {suggestions?.length > 0 && (
        <div className="suggestions panel" style={{ marginTop: 8 }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="suggestion-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
              }}
            >
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{s.symbol || s}</div>
                <div className="muted" style={{ fontSize: 12 }}>{s.name || ""}</div>
              </div>

              <button
                type="button"
                className="chip"
                onClick={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  handleSelect(s);
                }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}