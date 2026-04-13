/**
 * Minimal SVG line chart with area fill.
 * Props: data=[{label, value}], color, formatValue
 */
const LineChart = ({ data = [], color = '#1A1A1A', formatValue = (v) => v }) => {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-xs text-[#6B7280]">No data</div>;

  const W = 300;
  const H = 120;
  const padX = 4;
  const padY = 10;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - (d.value / max) * chartH,
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${H - padY} ` +
    points.map((p) => `L${p.x},${p.y}`).join(' ') +
    ` L${points[points.length - 1].x},${H - padY} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 140 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX} y1={padY + chartH * (1 - t)}
            x2={W - padX} y2={padY + chartH * (1 - t)}
            stroke="#EAEAEA" strokeWidth="0.5"
          />
        ))}
        {/* Area */}
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
        ))}
      </svg>
      {/* Labels */}
      <div className="flex mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[9px] text-[#6B7280] truncate px-0.5">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
