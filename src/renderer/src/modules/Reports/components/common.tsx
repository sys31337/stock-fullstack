import React from 'react';
import { t } from 'i18next';
import { format } from 'date-fns';
import { cn } from '@web/shared/utils/cn';
import { money } from '@web/shared/functions/words';
import { Button } from '@web/shared/components/ui/button';
import { DatePicker } from '@web/shared/components/ui/date-picker';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const toDateParam = (d: Date | undefined): string | undefined =>
  d ? format(d, 'yyyy-MM-dd') : undefined;

export const fmtDate = (value: string | Date | undefined | null): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return format(d, 'dd/MM/yyyy');
};

interface ReportHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  actions?: React.ReactNode;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, description, backTo, actions }) => {
  const navigate = useNavigate();
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(backTo)}
            title={t('back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: number;
  amount?: boolean;
  tone?: string;
  sub?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, amount, tone = 'bg-primary/10 text-primary', sub }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t(label)}
      </p>
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tone)} />
    </div>
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className="text-xl font-bold tracking-tight tabular-nums text-card-foreground">
        {amount ? money(value) : value.toLocaleString()}
      </span>
      {amount && <span className="text-[10px] font-semibold uppercase text-muted-foreground">DZD</span>}
    </div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

interface DateRangeBarProps {
  startDate?: Date;
  endDate?: Date;
  onStartChange: (d: Date | undefined) => void;
  onEndChange: (d: Date | undefined) => void;
  onApply: () => void;
  onToday?: () => void;
  showToday?: boolean;
}

export const DateRangeBar: React.FC<DateRangeBarProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onApply,
  onToday,
  showToday = true,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="w-36">
      <DatePicker value={startDate} onSelect={onStartChange} />
    </div>
    <span className="text-sm text-muted-foreground">{t('to')}</span>
    <div className="w-36">
      <DatePicker value={endDate} onSelect={onEndChange} />
    </div>
    {showToday && (
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onToday}>
        {t('today')}
      </Button>
    )}
    <Button size="sm" className="h-8 text-xs" onClick={onApply}>
      {t('apply')}
    </Button>
  </div>
);

const TYPE_TONES: Record<string, string> = {
  SALE: 'bg-blue-500/10 text-blue-600',
  BUY: 'bg-red-500/10 text-red-600',
  DELIVERY: 'bg-violet-500/10 text-violet-600',
  FUND: 'bg-purple-500/10 text-purple-600',
  ORDER: 'bg-amber-500/10 text-amber-600',
};

export const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', TYPE_TONES[type] || 'bg-muted text-muted-foreground')}>
    {t(type.toLowerCase())}
  </span>
);

export const AmountCell: React.FC<{ value: number }> = ({ value }) => (
  <span className={cn('tabular-nums font-medium', value > 0 && 'text-emerald-600', value < 0 && 'text-red-600')}>
    {money(value)}
  </span>
);

export const EmptyState: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
    {message || t('noData')}
  </div>
);
