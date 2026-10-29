import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useFetch } from '../../hooks';
import { Card, EmptyState, Loaded, PageHeader } from '../../components/ui';
import { ItemChips, StatusBadge, UpdateText } from '../../components/UpdateParts';
import { fmtDate } from '../../utils/format';

export default function MyUpdates() {
  const { t } = useTranslation();
  const mine = useFetch('/updates/mine');
  const [filter, setFilter] = useState('');
  const tabs = [['', t('mine.all')], ['waiting', t('status.waiting')], ['approved', t('status.approved')], ['rejected', t('status.rejected')]];

  return (
    <>
      <PageHeader title={t('mine.title')}>
        <Link to="/send" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <Send className="h-4 w-4" />{t('home.sendFirst')}
        </Link>
      </PageHeader>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([v, label]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${filter === v ? 'bg-primary text-white' : 'bg-white/95 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}`}>{label}</button>
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
                      <span className="text-sm font-semibold text-mute">{t('mine.sentOn')}: {fmtDate(u.workDate)}</span>
                      <StatusBadge status={u.status} t={t} />
                    </div>
                    <div className="mt-2"><UpdateText update={u} className="text-base font-medium leading-snug" /></div>
                    <div className="mt-2"><ItemChips items={u.items} /></div>
                    {u.photoUrl && <a href={u.photoUrl} target="_blank" rel="noreferrer"><img src={u.photoUrl} alt="" className="mt-2 h-24 rounded-lg object-cover" /></a>}
                    {u.officerComment && (
                      <p className={`mt-3 rounded-lg p-3 text-sm font-medium ${u.status === 'rejected' ? 'bg-danger/5 text-danger' : 'bg-slate-50 border border-slate-200'}`}>
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
