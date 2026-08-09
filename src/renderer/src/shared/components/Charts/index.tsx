import React from 'react';
import { t } from 'i18next';
import { format } from 'date-fns';
import { cn } from '@web/shared/utils/cn';
import { price } from '@web/shared/functions/words';
import { CategorySlice, RevenuePoint } from '@web/shared/hooks/useDashboard';

const PALETTE = [
  'hsl(160 84% 39%)',
  'hsl(199 89% 48%)',
  'hsl(38 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(346 77% 49%)',
  'hsl(226 70% 55%)',
  'hsl(152 69% 55%)',
];

const compact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
};

interface TrendChartProps {
  data: RevenuePoint[];
  blurred?: boolean;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, blurred }) => {
  const W = 720;
  const H = 240;
  const pad = { left: 48, right: 16, top: 20, bottom: 30 };

  const values = data.map((d) => d.total);
  const maxVal = Math.max(...values, 1) * 1.15;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const x = (i: number) => pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / maxVal) * innerH;

  const points = data.map((d, i) => ({ x: x(i), y: y(d.total) }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${pad.top + innerH} L${points[0].x.toFixed(1)},${pad.top + innerH} Z`;

  const gridLines = [0, 1, 2, 3, 4].map((i) => {
    const gv = (maxVal / 4) * i;
    const gy = y(gv);
    return { gy, label: compact(gv) };
  });

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={g.gy} y2={g.gy} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
          <text
            x={pad.left - 8}
            y={g.gy + 4}
            textAnchor="end"
            fontSize="11"
            fill="hsl(var(--muted-foreground))"
            className={cn(blurred && 'blur-[5px] select-none')}
          >
            {g.label}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#trendFill)" />
      <path d={linePath} fill="none" stroke="hsl(160 84% 39%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--card))" stroke="hsl(160 84% 39%)" strokeWidth="2" />
      ))}

      {data.map((d, i) =>
        i % labelStep === 0 || i === data.length - 1 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fill="hsl(var(--muted-foreground))"
            className={cn(blurred && 'blur-[5px] select-none')}
          >
            {format(new Date(`${d.date}T00:00:00`), 'd MMM')}
          </text>
        ) : null
      )}
    </svg>
  );
};

interface DonutChartProps {
  data: CategorySlice[];
  blurred?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, blurred }) => {
  const size = 176;
  const r = 68;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="22" />
          )}
          {total > 0 && data.map((slice, i) => {
            const frac = slice.value / total;
            const dash = Math.max(frac * C - gap, 0.5);
            const offset = C - cumulative * C;
            cumulative += frac;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="hsl(var(--muted-foreground))">
            {t('totalRevenue')}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="hsl(var(--card-foreground))"
            className={cn(blurred && 'blur-[5px] select-none')}
          >
            {compact(total)}
          </text>
        </svg>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        )}
        {data.slice(0, 6).map((slice, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">{slice.name}</span>
            <span className={cn('text-sm font-semibold tabular-nums text-muted-foreground', blurred && 'blur-[5px] select-none')}>
              {price(slice.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { TrendChart, DonutChart };
