/**
 * Minimal SVG bar chart.
 * Props: data=[{label, value}], color, formatValue, height
 */
const BarChart = ({ data = [], color = '#1A1A1A', formatValue = (v) => v, height = 160 }) => {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-xs text-[#6B7280]">No data</div>;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 20);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 20 - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barH} fill={color} rx="2" opacity="0.85" />
            </g>
          );
        })}
        {/* baseline */}
        <line x1="0" y1={height - 20} x2="100" y2={height - 20} stroke="#EAEAEA" strokeWidth="0.5" />
      </svg>
      {/* Labels */}
      <div className="flex mt-1" style={{ gap: 0 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[9px] text-[#6B7280] truncate px-0.5">{d.label}</p>
            <p className="text-[9px] font-medium text-[#1A1A1A] truncate px-0.5">{formatValue(d.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
