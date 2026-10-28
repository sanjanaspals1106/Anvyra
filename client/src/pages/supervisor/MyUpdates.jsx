import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useFetch } from '../../hooks';
import { Card, EmptyState, Loaded, PageHeader } from '../../components/ui';
import { ItemChips, StatusBadge } from '../../components/UpdateParts';
import { fmtDate } from '../../utils/format';

export default function MyUpdates() {
  const { t } = useTranslation();
  const mine = useFetch('/updates/mine');
  const [filter, setFilter] = useState('');
  const tabs = [['', t('mine.all')], ['waiting', t('status.waiting')], ['approved', t('status.approved')], ['rejected', t('status.rejected')]];

  return (
    <>
      <PageHeader title={t('mine.title')}>
        <Link to="/send" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-primary-dark">
          <Send className="h-4 w-4" />{t('home.sendFirst')}
        </Link>
      </PageHeader>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([v, label]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${filter === v ? 'bg-primary text-white' : 'bg-white/90 text-ink/70 ring-1 ring-gray-300 hover:bg-primary/10'}`}>{label}</button>
        ))}
      </div>
      <Loaded state={mine}>
        {(d) => {
          const list = d.updates.filter((u) => !filter || u.status === filter);
          return list.length === 0 ? <Card><EmptyState text={t('mine.empty')} /></Card> : (
            <ul className="space-y-3">
              {list.map((u) => (
                <li key={u._id}>
                  <Card>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-ink/65">{t('mine.sentOn')}: {fmtDate(u.workDate)}</span>
                      <StatusBadge status={u.status} t={t} />
                    </div>
                    <p className="mt-2 text-lg font-bold leading-snug">{u.originalText}</p>
                    {u.language !== 'en' && u.englishText && !u.translationFailed && (
                      <p className="mt-1 text-sm font-semibold text-ink/60">{t('mine.english')}: {u.englishText}</p>
                    )}
                    <div className="mt-2"><ItemChips items={u.items} /></div>
                    {u.photoUrl && <a href={u.photoUrl} target="_blank" rel="noreferrer"><img src={u.photoUrl} alt="" className="mt-2 h-24 rounded-xl object-cover" /></a>}
                    {u.officerComment && (
                      <p className={`mt-3 rounded-xl p-3 text-sm font-bold ${u.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-white/80 ring-1 ring-black/5'}`}>
                        {t('mine.officerSaid')}: {u.officerComment}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          );
        }}
      </Loaded>
    </>
  );
}
