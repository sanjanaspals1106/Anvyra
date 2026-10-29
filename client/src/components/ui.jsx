// Small building blocks used on every page.
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Card({ className = '', children, ...rest }) {
  return <div className={`glass p-4 sm:p-6 ${className}`} {...rest}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl drop-shadow-sm">{title}</h1>
        {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Spinner({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-mute" role="status">
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
      <p className="font-medium">{t('common.errorTitle')}</p>
      <p className="text-sm text-mute">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          {t('common.retry')}
        </button>
      )}
    </Card>
  );
}

export function EmptyState({ text, icon: Icon = Inbox }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-mute">
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
  green: 'bg-success/12 text-success',
  red: 'bg-danger/5 text-danger',
  amber: 'bg-accent/20 text-warning',
  blue: 'bg-primary/10 text-primary',
  gray: 'bg-slate-100 text-slate-600',
  ochre: 'bg-accent/15 text-warning',
};
export function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

// Circle that fills up to `percent`. The planned % can be shown under it by the caller.
export function ProgressRing({ percent = 0, size = 96, stroke = 9, color = '#2F5D62', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8edf2" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center font-semibold leading-none text-ink" style={{ fontSize: size / 4.2 }}>
        {children ?? `${Math.round(p)}%`}
      </div>
    </div>
  );
}

export function ProgressBar({ percent = 0, color = 'bg-primary', height = 'h-2' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
      <div className={`${height} rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-primary';

export function Button({ variant = 'primary', className = '', busy = false, children, ...rest }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    success: 'bg-success text-white hover:brightness-95',
    danger: 'bg-danger text-white hover:brightness-95',
    ghost: 'bg-white text-ink border border-slate-300 hover:bg-slate-50',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
