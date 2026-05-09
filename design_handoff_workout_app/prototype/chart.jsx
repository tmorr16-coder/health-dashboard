// Chart — multi-line interactive line chart with range picker + tap-to-inspect dots
const { useState, useMemo, useRef, useEffect } = React;

const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const RANGES = [
  { key: '1M',  days: 30,  ticks: 4 },
  { key: '3M',  days: 90,  ticks: 4 },
  { key: '6M',  days: 180, ticks: 4 },
  { key: '1Y',  days: 365, ticks: 4 },
  { key: 'ALL', days: null, ticks: 4 },
];

const TrendChart = ({ data, metrics, height = 200 }) => {
  // metrics: [{key, label, color, unit}]
  const [range, setRange] = useState('3M');
  const [active, setActive] = useState(null); // {idx, x, y}
  const [hidden, setHidden] = useState({});
  const ref = useRef(null);
  const [w, setW] = useState(320);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const r = RANGES.find(x => x.key === range);
    if (!r.days) return data;
    return data.slice(-r.days);
  }, [data, range]);

  // last value summary
  const summary = metrics.map(m => {
    const last = filtered[filtered.length - 1]?.[m.key];
    const first = filtered[0]?.[m.key];
    const delta = (last - first).toFixed(1);
    return { ...m, last, first, delta };
  });

  const padL = 14, padR = 10, padT = 16, padB = 28;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;

  // Each metric gets its own normalized scale so they're comparable visually.
  // Real values live in the summary row above (which updates on hover).
  const visibleMetrics = metrics.filter(m => !hidden[m.key]);
  const seriesRanges = {};
  metrics.forEach(m => {
    const vals = filtered.map(d => d[m.key]);
    const mn = Math.min(...vals); const mx = Math.max(...vals);
    const pad = (mx - mn) * 0.15 || 1;
    seriesRanges[m.key] = { min: mn - pad, max: mx + pad };
  });

  const xFor = (i) => padL + (filtered.length === 1 ? innerW / 2 : (i / (filtered.length - 1)) * innerW);
  const yFor = (v, key) => {
    const r = seriesRanges[key];
    return padT + innerH - ((v - r.min) / (r.max - r.min)) * innerH;
  };

  const path = (key) => filtered.map((d, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(d[key], key).toFixed(1)}`).join(' ');

  // Light horizontal grid (decorative, no labels since each series has own scale)
  const yTicks = 4;
  const tickPositions = Array.from({ length: yTicks }, (_, i) => padT + (innerH * i) / (yTicks - 1));

  // X-axis label tick indices
  const r = RANGES.find(x => x.key === range);
  const xTickIdx = Array.from({ length: r.ticks }, (_, i) => Math.round((i / (r.ticks - 1)) * (filtered.length - 1)));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const ratio = (px - padL) / innerW;
    const idx = Math.round(ratio * (filtered.length - 1));
    if (idx < 0 || idx >= filtered.length) return setActive(null);
    setActive({ idx });
  };
  const onLeave = () => setActive(null);

  const activePoint = active ? filtered[active.idx] : null;
  const ax = active ? xFor(active.idx) : null;

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {summary.map(s => (
          <button
            key={s.key}
            onClick={() => setHidden(h => ({ ...h, [s.key]: !h[s.key] }))}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left', flex: 1, minWidth: 0,
              opacity: hidden[s.key] ? 0.35 : 1, transition: 'opacity 160ms',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span className="t-display-num" style={{ fontSize: 22 }}>
                {activePoint ? activePoint[s.key].toFixed(1) : s.last?.toFixed(1)}
              </span>
              <span className="t-meta" style={{ fontSize: 10 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'Geist Mono', marginTop: 2, color: ((s.key === 'fat' || s.key === 'weight') && parseFloat(s.delta) < 0) || (s.key === 'muscle' && parseFloat(s.delta) > 0) ? 'var(--moss)' : 'var(--ink-3)' }}>
              {parseFloat(s.delta) >= 0 ? '+' : ''}{s.delta}
            </div>
          </button>
        ))}
      </div>

      {/* Chart */}
      <svg
        width="100%" height={height}
        onMouseMove={onMove} onMouseLeave={onLeave}
        onTouchMove={onMove} onTouchEnd={onLeave}
        style={{ display: 'block', touchAction: 'pan-y' }}>
        {/* Decorative grid (no Y labels — each series has its own scale; values shown in summary) */}
        {tickPositions.map((y, i) => (
          <line key={i} x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--line)" strokeWidth="0.6" strokeDasharray={i === yTicks - 1 ? '0' : '2,3'} />
        ))}

        {/* X labels */}
        {xTickIdx.map((idx, i) => (
          <text key={i} x={xFor(idx)} y={height - 10} fontSize="9" fill="var(--ink-3)" textAnchor="middle" fontFamily="Geist">
            {fmtDate(filtered[idx].date)}
          </text>
        ))}

        {/* Lines */}
        {visibleMetrics.map(m => (
          <path key={m.key} d={path(m.key)} fill="none" stroke={m.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Active line + dots */}
        {active && (
          <g>
            <line x1={ax} y1={padT} x2={ax} y2={height - padB} stroke="var(--ink-3)" strokeWidth="0.8" strokeDasharray="2,3" />
            {visibleMetrics.map(m => (
              <circle key={m.key} cx={ax} cy={yFor(activePoint[m.key], m.key)} r="3.5" fill="var(--bg-raised)" stroke={m.color} strokeWidth="1.5" />
            ))}
            <text x={ax} y={padT - 4} fontSize="10" fill="var(--ink-2)" textAnchor={ax > w / 2 ? 'end' : 'start'} fontFamily="Geist" fontWeight="500">
              {fmtDate(activePoint.date)}
            </text>
          </g>
        )}
      </svg>

      {/* Range picker */}
      <div className="seg" style={{ marginTop: 10 }}>
        {RANGES.map(r => (
          <button key={r.key} aria-pressed={range === r.key} onClick={() => setRange(r.key)}>{r.key}</button>
        ))}
      </div>
    </div>
  );
};

window.TrendChart = TrendChart;
