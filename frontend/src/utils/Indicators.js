// Pure, testable indicator helpers (computed locally to reduce API calls)
export function toSeries(data){
// data: { [date]: { close: number, open, high, low, volume } } (descending dates)
const rows = Object.entries(data)
.map(([date, o]) => ({ date, close: +o['4. close'], open:+o['1. open'], high:+o['2. high'], low:+o['3. low'], volume:+o['6. volume'] }))
.sort((a,b)=> new Date(a.date) - new Date(b.date));
return rows;
}


export function SMA(series, period=20){
const out=[]; let sum=0; const q=[];
for(const p of series){
q.push(p.close); sum += p.close;
if(q.length>period) sum -= q.shift();
out.push({ date:p.date, value: q.length===period ? +(sum/period).toFixed(4) : null });
}
return out;
}


export function EMA(series, period=20){
const k = 2/(period+1); const out=[];
let ema = null; let i = 0; let sum=0;
for(const p of series){
i++; sum += p.close;
if(i===period){ ema = sum/period; out.push({date:p.date, value:+ema.toFixed(4)}); continue; }
if(i>period){ ema = p.close * k + ema * (1-k); out.push({date:p.date, value:+ema.toFixed(4)}); }
else out.push({date:p.date, value:null});
}
return out;
}


export function RSI(series, period=14){
let gains=0, losses=0; const out=[]; let prev=null; let i=0;
for(const p of series){
i++;
if(prev==null){ out.push({date:p.date, value:null}); prev=p.close; continue; }
const change = p.close - prev; prev = p.close;
const gain = Math.max(change,0); const loss = Math.max(-change,0);
if(i<=period){ gains += gain; losses += loss; out.push({date:p.date, value:null}); if(i===period){ const rs=gains/(losses||1e-9); out[out.length-1]={date:p.date, value:+(100 - 100/(1+rs)).toFixed(2)} } continue; }
gains = (gains*(period-1) + gain)/period;
losses = (losses*(period-1) + loss)/period;
const rs = gains/(losses||1e-9);
out.push({date:p.date, value:+(100 - 100/(1+rs)).toFixed(2)});
}
return out;
}


// normalize and expose enrichWithIndicators that App.jsx expects:
// - accepts an array of rows [{date, open, high, low, close, volume}] (oldest->newest)
// - second arg is the indicators config object { sma: {enabled, period}, ema: {...}, rsi: {...} }
// - returns a new array where each row has additional numeric/null fields: sma, ema, rsi
export function enrichWithIndicators(inputSeries, indicators = {}) {
  const series = Array.isArray(inputSeries) ? inputSeries : toSeries(inputSeries);
  // shallow copy rows
  const out = series.map(r => ({ ...r }));

  if (indicators?.sma?.enabled) {
    const period = indicators.sma.period ?? 20;
    const smaArr = SMA(series, period);
    const map = new Map(smaArr.map(x => [x.date, x.value]));
    out.forEach(row => { row.sma = map.get(row.date) ?? null; });
  }

  if (indicators?.ema?.enabled) {
    const period = indicators.ema.period ?? 20;
    const emaArr = EMA(series, period);
    const map = new Map(emaArr.map(x => [x.date, x.value]));
    out.forEach(row => { row.ema = map.get(row.date) ?? null; });
  }

  if (indicators?.rsi?.enabled) {
    const period = indicators.rsi.period ?? 14;
    const rsiArr = RSI(series, period);
    const map = new Map(rsiArr.map(x => [x.date, x.value]));
    out.forEach(row => { row.rsi = map.get(row.date) ?? null; });
  }

  return out;
}

// provide default export so import enrichWithIndicators from './utils/Indicators' works
export default enrichWithIndicators;