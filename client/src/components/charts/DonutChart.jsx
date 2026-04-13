/**
 * SVG donut chart.
 * Props: data=[{label, value, color}], size
 */
const DonutChart = ({ data = [], size = 140 }) => {
  if (!data.length) return <div className="h-36 flex items-center justify-center text-xs text-[#6B7280]">No data</div>;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="h-36 flex items-center justify-center text-xs text-[#6B7280]">No data</div>;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const strokeW = size * 0.14;

  // Build arcs
  let cumulative = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startPct, endPct) => {
    const startAngle = startPct * 360;
    const endAngle = endPct * 360 - 0.5; // small gap
    const s = polarToCartesian(cx, cy, r, startAngle);
    const e = polarToCartesian(cx, cy, r, endAngle);
    const large = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F5F5F5" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, r, s.start, s.start + s.pct)}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeLinecap="butt"
          />
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.13} fill="#1A1A1A" fontWeight="300">
          {total}
        </text>
        <text x={cx} y={cy + size * 0.1} textAnchor="middle" fontSize={size * 0.08} fill="#6B7280">
          total
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-[#6B7280] truncate">{d.label}</span>
            <span className="text-xs font-medium text-[#1A1A1A] ml-auto pl-2 shrink-0">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
