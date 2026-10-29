import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui';
import { L, unitName } from '../utils/l10n';
import { fmtDate, num } from '../utils/format';

// "Columns - 2 nos" for one matched item (or the best guess in amber when it still needs a check).
export function itemLabel(item) {
  const name = L(item.matchedName || item.matches?.[0]?.name || '?');
  const qty = `${num(item.quantity)}${item.unit ? ` ${unitName(item.unit)}` : ''}`;
  return { name, qty, guess: !item.matchedName };
}

export function ItemChips({ items = [] }) {
  if (!items.length) return <span className="text-xs text-mute">-</span>;
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

const STATUS_TONE = { waiting: 'amber', approved: 'green', rejected: 'red' };
export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <Badge tone={STATUS_TONE[status] || 'gray'}>{t(`status.${status}`, { defaultValue: status })}</Badge>;
}

// The words of an update, in the language the person reads.
// In Hindi / Telugu: the original if it was written in that language, else the English text with a small "Original" toggle.
// In English: the English text.
export function UpdateText({ update, className = 'text-sm font-medium', toggle = true }) {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  const lang = i18n.language;
  const english = update.englishText && !update.translationFailed ? update.englishText : '';
  if (lang === 'en') return <p className={className}>{english || update.originalText}</p>;
  if (!toggle && lang !== update.language && english) return <p className={className}>{english}</p>;
  if (update.language === lang || !english || english === update.originalText) {
    return <p className={className}>{update.originalText}</p>;
  }
  return (
    <div>
      <p className={className}>{showOriginal ? update.originalText : english}</p>
      <button type="button" onClick={() => setShowOriginal(!showOriginal)} className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline">
        {showOriginal ? t('updateText.hide') : t('updateText.original')}
      </button>
    </div>
  );
}

// One update as a row: date, text, matched items, status.
export function UpdateRow({ update }) {
  const { t } = useTranslation();
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-mute">{fmtDate(update.workDate)}</span>
        <div className="flex items-center gap-1.5">
          {update.matchStatus === 'needs_check' && update.status === 'waiting' && <Badge tone="amber">{t('review.needsCheck')}</Badge>}
          <StatusBadge status={update.status} />
        </div>
      </div>
      <div className="mt-1.5"><UpdateText update={update} /></div>
      <div className="mt-2"><ItemChips items={update.items} /></div>
      {update.officerComment && <p className="mt-2 text-xs text-mute">{t('updateText.officer', { text: update.officerComment })}</p>}
    </li>
  );
}
