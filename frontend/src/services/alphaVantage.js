const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
const BASE = "https://www.alphavantage.co/query";


async function getJSON(url){
const res = await fetch(url);
if(!res.ok) throw new Error('Network error');
const json = await res.json();
if(json['Error Message'] || json['Note']) throw new Error(json['Error Message'] || json['Note']);
return json;
}


export async function fetchDaily(symbol){
const url = `${BASE}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${API_KEY}`;
return getJSON(url);
}


export async function searchSymbol(q){
const url = `${BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${API_KEY}`;
return getJSON(url);
}

// ensure the function is exported as a named export
export async function getDailySeries(symbol) {
  const url = `${BASE}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${API_KEY}`;
  return getJSON(url);
}

// Realtime quote function
const KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || process.env.VITE_ALPHA_VANTAGE_KEY || ""; // ensure you set VITE_ALPHA_VANTAGE_KEY

export async function getRealtimeQuote(symbol) {
  if (!symbol) throw new Error("Missing symbol");
  if (!KEY) throw new Error("AlphaVantage API key missing. Set VITE_ALPHA_VANTAGE_KEY in .env");
  const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlphaVantage error: ${res.status}`);
  const json = await res.json();
  const raw = json["Global Quote"] || json["GlobalQuote"] || {};
  // Normalize into a simple object
  const quote = {
    symbol: raw["01. symbol"] || raw["symbol"] || symbol,
    open: raw["02. open"] ? +raw["02. open"] : null,
    high: raw["03. high"] ? +raw["03. high"] : null,
    low: raw["04. low"] ? +raw["04. low"] : null,
    price: raw["05. price"] ? +raw["05. price"] : null,
    volume: raw["06. volume"] ? +raw["06. volume"] : null,
    latestTradingDay: raw["07. latest trading day"] || raw["latestTradingDay"] || null,
    previousClose: raw["08. previous close"] ? +raw["08. previous close"] : null,
    change: raw["09. change"] ? +raw["09. change"] : null,
    changePercent: raw["10. change percent"] ? raw["10. change percent"] : null,
    raw,
  };
  return quote;
}

// and also keep default if other files rely on it
export default {
  getDailySeries,
  getRealtimeQuote,
};