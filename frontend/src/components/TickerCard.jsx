export default function TickerCard({ meta, last, change }){
return (
<div className="card" style={{padding:14}}>
<div className="header">
<div className="h1">{meta?.symbol || '—'}</div>
<span className="badge">{meta?.timezone || '—'}</span>
</div>
<div className="row">
<div className="kpi"><span className="label">Last Close</span><span className="value">{last?.toFixed?.(2) ?? '—'}</span></div>
<div className="kpi"><span className="label">Change</span><span className="value" style={{color: (change??0)>=0? 'var(--ok)':'var(--danger)'}}>{change?.toFixed?.(2) ?? '—'}</span></div>
<div className="kpi"><span className="label">Currency</span><span className="value">{meta?.currency || '—'}</span></div>
</div>
</div>
);
}