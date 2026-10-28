import { Badge } from './ui';
import { fmtDate, num } from '../utils/format';

// "Columns - 2 nos" for one matched item (or the best guess in grey when it still needs a check).
export function itemLabel(item) {
  const name = item.matchedName || item.matches?.[0]?.name || '?';
  const qty = `${num(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`;
  return { name, qty, guess: !item.matchedName };
}

export function ItemChips({ items = [] }) {
  if (!items.length) return <span className="text-xs font-semibold text-ink/50">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => {
        const { name, qty, guess } = itemLabel(it);
        return (
          <Badge key={i} tone={guess ? 'amber' : it.kind === 'material' ? 'ochre' : 'blue'}>
            {guess ? '? ' : ''}{name} · {qty}
          </Badge>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status, t }) {
  const map = { waiting: ['amber', 'Waiting'], approved: ['green', 'Approved'], rejected: ['red', 'Rejected'] };
  const [tone, label] = map[status] || ['gray', status];
  return <Badge tone={tone}>{t ? t(`status.${status}`, label) : label}</Badge>;
}

// One update as a row: date, English text, matched items, status.
export function UpdateRow({ update, t }) {
  return (
    <li className="rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-ink/60">{fmtDate(update.workDate)}</span>
        <div className="flex items-center gap-1.5">
          {update.matchStatus === 'needs_check' && update.status === 'waiting' && <Badge tone="amber">Needs check</Badge>}
          <StatusBadge status={update.status} t={t} />
        </div>
      </div>
      <p className="mt-1 text-sm font-semibold">{update.englishText || update.originalText}</p>
      <div className="mt-2"><ItemChips items={update.items} /></div>
      {update.officerComment && <p className="mt-2 text-xs font-semibold text-ink/70">Officer: {update.officerComment}</p>}
    </li>
  );
}
