// Small building blocks used on every page.
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Card({ className = '', children, ...rest }) {
  return <div className={`glass p-4 sm:p-5 ${className}`} {...rest}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl drop-shadow-sm">{title}</h1>
        {subtitle && <p className="text-sm font-semibold text-ink/70">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 py-12 font-semibold text-ink/70" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label || t('common.loading')}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center gap-2 py-8 text-center" role="alert">
      <AlertTriangle className="h-8 w-8 text-danger" />
      <p className="font-bold">{t('common.errorTitle')}</p>
      <p className="text-sm text-ink/70">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          {t('common.retry')}
        </button>
      )}
    </Card>
  );
}

export function EmptyState({ text, icon: Icon = Inbox }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-ink/60">
      <Icon className="h-8 w-8" />
      <p className="text-sm font-semibold">{text || t('common.nothingHere')}</p>
    </div>
  );
}

// Shows spinner / error / children depending on the state of a useFetch result.
export function Loaded({ state, children }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error && !state.data) return <ErrorBox message={state.error} onRetry={state.reload} />;
  return children(state.data);
}

const TONES = {
  green: 'bg-success/15 text-success',
  red: 'bg-danger/15 text-danger',
  amber: 'bg-warning/20 text-amber-700',
  blue: 'bg-primary/15 text-primary-dark',
  gray: 'bg-gray-200 text-gray-700',
  ochre: 'bg-accent/25 text-amber-800',
};
export function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

// Circle that fills up to `percent`. The planned % can be shown under it by the caller.
export function ProgressRing({ percent = 0, size = 96, stroke = 10, color = '#0E8FC6', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center font-extrabold leading-none" style={{ fontSize: size / 4.2 }}>
        {children ?? `${Math.round(p)}%`}
      </div>
    </div>
  );
}

export function ProgressBar({ percent = 0, color = 'bg-primary', height = 'h-2.5' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-gray-200 ${height}`}>
      <div className={`${height} rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/60">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-gray-400 focus:border-primary';

export function Button({ variant = 'primary', className = '', busy = false, children, ...rest }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    success: 'bg-success text-white hover:bg-green-700',
    danger: 'bg-danger text-white hover:bg-red-700',
    ghost: 'bg-white text-ink border border-gray-300 hover:bg-gray-50',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
