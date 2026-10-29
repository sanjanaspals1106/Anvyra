import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, ImageIcon, Languages, Inbox } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { useCounts } from '../../components/AppShell';
import { Badge, Button, Card, EmptyState, ErrorBox, inputClass, PageHeader, Spinner } from '../../components/ui';
import PipelineSteps from '../../components/PipelineSteps';
import { ItemChips, StatusBadge, UpdateText } from '../../components/UpdateParts';
import { fmtDate, num } from '../../utils/format';
import { L, reasonText, unitName, warningText } from '../../utils/l10n';

// What the AI did, step by step, for one update.
function pipelineFor(u, t) {
  const matched = u.items.filter((i) => i.matchStatus === 'matched').length;
  const needCheck = u.items.length - matched;
  const lang = t(`languages.${u.language}`);
  return [
    {
      label: t('pipeline.translated'),
      state: u.translationFailed ? 'warn' : 'done',
      detail: u.language === 'en' ? t('pipeline.en')
        : u.translationFailed ? t('pipeline.langNotTranslated', { lang }) : t('pipeline.toEnglish', { lang }),
    },
    { label: t('pipeline.split'), state: 'done', detail: t('pipeline.partsFound', { n: u.partsFound || u.items.length }) },
    {
      label: t('pipeline.matched'), state: needCheck ? 'warn' : u.items.length ? 'done' : 'warn',
      detail: u.items.length ? (needCheck ? t('pipeline.matchedNeed', { n: matched, m: needCheck }) : t('pipeline.matchedN', { n: matched })) : t('pipeline.nothing'),
    },
    { label: t('pipeline.checks'), state: u.warnings?.length ? 'warn' : 'done', detail: u.warnings?.length ? t('pipeline.warningsN', { n: u.warnings.length }) : t('pipeline.clear') },
  ];
}

// One matched item: top 3 suggestions as bars, a dropdown to choose, and the quantity.
function ItemEditor({ item, index, edit, setEdit, options, readOnly, liveWarnings }) {
  const { t } = useTranslation();
  const isTask = item.kind === 'task';
  const chosen = options.find((o) => String(o.id) === String(edit.ref));
  const unit = chosen ? chosen.unit : item.unit;
  const warnings = [...item.warnings.map(warningText), ...liveWarnings].filter((w, i, a) => a.indexOf(w) === i);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {t('review.part', { n: index + 1 })}: <span className="font-normal text-mute">"{item.text}"</span>
        </p>
        <Badge tone={isTask ? 'blue' : 'ochre'}>{isTask ? t('review.workDone') : t('review.materialUsed')}</Badge>
      </div>

      <div className="space-y-1.5">
        {item.matches.map((m) => {
          const selected = String(edit.ref) === String(m.refId);
          return (
            <button
              key={m.refId} type="button" disabled={readOnly} onClick={() => setEdit({ ...edit, ref: String(m.refId) })}
              className={`block w-full rounded-lg p-2 text-left ring-1 transition ${selected ? 'bg-primary/5 ring-primary' : 'bg-white ring-slate-200 hover:ring-primary/40'} disabled:cursor-default`}
            >
              <div className="flex items-center justify-between gap-2 text-sm font-medium">
                <span>{L(m.name)}</span><span>{Math.round(m.score * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-1.5 rounded-full ${m.score >= 0.6 ? 'bg-success' : m.score >= 0.4 ? 'bg-accent' : 'bg-slate-400'}`} style={{ width: `${Math.round(m.score * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-mute">{m.reasons.map(reasonText).join(' · ')}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-700">{isTask ? t('review.task') : t('review.material')}</span>
          <select className={inputClass} disabled={readOnly} value={edit.ref} onChange={(e) => setEdit({ ...edit, ref: e.target.value })}>
            <option value="">{isTask ? t('review.chooseTask') : t('review.chooseMaterial')}</option>
            {options.map((o) => <option key={o.id} value={o.id}>{L(o.name)} ({unitName(o.unit)})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-700">{t('review.quantity')}{unit ? ` (${unitName(unit)})` : ''}</span>
          <input type="number" min="0" step="any" className={inputClass} disabled={readOnly} value={edit.quantity}
            onChange={(e) => setEdit({ ...edit, quantity: e.target.value })} />
        </label>
      </div>
      {item.reportedQty !== undefined && Number(edit.quantity) !== item.reportedQty && (
        <p className="mt-1 text-xs text-mute">{t('review.supervisorWrote', { n: num(item.reportedQty) })}</p>
      )}
      {warnings.map((w) => (
        <p key={w} className="mt-2 flex items-start gap-1.5 text-xs font-medium text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}
        </p>
      ))}
    </div>
  );
}

function ReviewDetail({ update, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const project = useFetch(`/projects/${update.projectId._id}`);
  const readOnly = update.status !== 'waiting';
  const [edits, setEdits] = useState([]);
  const [comment, setComment] = useState(update.officerComment || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // Start from what the AI picked (nothing picked when it needs a check).
  useEffect(() => {
    setEdits(update.items.map((it) => ({ ref: String(it.taskId || it.materialId || ''), quantity: String(it.quantity) })));
  }, [update]);

  const optionsFor = (kind) => {
    if (!project.data) return [];
    return kind === 'task'
      ? project.data.tasks.map((x) => ({ id: x.taskId, name: x.name, unit: x.unit, done: x.doneQty, planned: x.plannedQty }))
      : project.data.materials.map((m) => ({ id: m.materialId, name: m.name, unit: m.unit, stock: m.stock }));
  };

  // Live checks that follow the officer's own choices.
  const live = useMemo(() => {
    const out = update.items.map(() => []);
    let over = false;
    const added = {};
    update.items.forEach((it, i) => {
      const e = edits[i];
      if (!e?.ref) return;
      if (it.kind === 'task') added[e.ref] = (added[e.ref] || 0) + (Number(e.quantity) || 0);
    });
    update.items.forEach((it, i) => {
      const e = edits[i];
      if (!e?.ref || !project.data) return;
      const q = Number(e.quantity) || 0;
      if (it.kind === 'task') {
        const task = project.data.tasks.find((x) => String(x.taskId) === e.ref);
        if (task && task.doneQty + added[e.ref] > task.plannedQty) {
          over = true;
          out[i].push(t('review.overPlannedWarning', { name: L(task.name), total: num(task.doneQty + added[e.ref]), unit: unitName(task.unit), planned: num(task.plannedQty) }));
        }
      } else {
        const m = project.data.materials.find((x) => String(x.materialId) === e.ref);
        if (m && q > m.stock) out[i].push(t('review.overStockWarning', { name: L(m.name), qty: num(q), unit: unitName(m.unit), stock: num(m.stock) }));
      }
    });
    return { out, over };
  }, [edits, project.data, update.items, t]);
  const overPlanned = live.over;
  const incomplete = edits.some((e) => !e.ref || !(Number(e.quantity) > 0));

  async function decide(kind) {
    setBusy(kind);
    setError('');
    try {
      const body = kind === 'approve'
        ? { comment, items: update.items.map((it, i) => ({ _id: it._id, quantity: Number(edits[i].quantity), [it.kind === 'task' ? 'taskId' : 'materialId']: edits[i].ref })) }
        : { comment };
      await api.patch(`/updates/${update._id}/${kind}`, body);
      toast(kind === 'approve' ? t('review.approvedToast') : t('review.rejectedToast'));
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy('');
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{L(update.projectId.name)}</h2>
            <p className="text-sm text-mute">{update.supervisorId?.name} · {t('review.workDate', { date: fmtDate(update.workDate) })}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {update.matchStatus === 'needs_check' && !readOnly && <Badge tone="amber">{t('review.needsCheck')}</Badge>}
            <StatusBadge status={update.status} />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-mute"><Languages className="h-3.5 w-3.5" />{t('review.original', { lang: t(`languages.${update.language}`) })}</p>
            <p className="rounded-lg bg-slate-50 p-3 text-base">{update.originalText}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-mute">{t('review.inEnglish')}</p>
            <p className="rounded-lg bg-slate-50 p-3 text-base">
              {update.translationFailed ? <span className="text-warning">{t('review.couldNotTranslate')}</span> : update.englishText}
            </p>
          </div>
        </div>
        {update.photoUrl ? (
          <a href={update.photoUrl} target="_blank" rel="noreferrer" className="mt-3 block">
            <img src={update.photoUrl} alt={t('review.photoAlt')} className="max-h-64 rounded-lg object-cover ring-1 ring-slate-200" />
          </a>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-mute"><ImageIcon className="h-4 w-4" />{t('review.noPhoto')}</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">{t('pipeline.title')}</h3>
        <PipelineSteps steps={pipelineFor(update, t)} />
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">{t('review.understood')}</h3>
        {project.loading && !project.data ? <Spinner /> : project.error && !project.data ? <ErrorBox message={project.error} onRetry={project.reload} /> : (
          <div className="space-y-3">
            {update.items.length === 0 && (
              <p className="rounded-lg bg-accent/15 p-3 text-sm font-medium text-warning">{t('review.nothingUnderstood')}</p>
            )}
            {update.items.map((it, i) => edits[i] && (
              <ItemEditor key={it._id} item={it} index={i} edit={edits[i]} options={optionsFor(it.kind)} readOnly={readOnly}
                setEdit={(e) => setEdits(edits.map((x, k) => (k === i ? e : x)))} liveWarnings={live.out[i]} />
            ))}
          </div>
        )}
        {update.warnings?.some((w) => /translate/i.test(w)) && (
          <p className="mt-2 text-xs font-medium text-warning">{warningText(update.warnings.find((w) => /translate/i.test(w)))}</p>
        )}
      </Card>

      <Card>
        {readOnly ? (
          <div className="text-sm">
            <StatusBadge status={update.status} /> {update.reviewedAt && <span className="ml-2 text-mute">{t('review.onDate', { date: fmtDate(update.reviewedAt) })}</span>}
            {update.officerComment && <p className="mt-2 rounded-lg bg-slate-50 p-3">{t('review.yourComment', { text: update.officerComment })}</p>}
          </div>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {t('review.comment')} {overPlanned ? <span className="text-danger">{t('review.commentOver')}</span> : <span className="font-normal text-mute">{t('review.commentReject')}</span>}
              </span>
              <textarea className={inputClass} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('review.commentPlaceholder')} />
            </label>
            {error && <p role="alert" className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="success" busy={busy === 'approve'} disabled={!!busy || incomplete || (overPlanned && !comment.trim())} onClick={() => decide('approve')}>
                <CheckCircle2 className="h-4 w-4" />{t('review.approve')}
              </Button>
              <Button variant="danger" busy={busy === 'reject'} disabled={!!busy || !comment.trim()} onClick={() => decide('reject')}>
                <XCircle className="h-4 w-4" />{t('review.reject')}
              </Button>
              {incomplete && update.items.length > 0 && <p className="self-center text-xs text-mute">{t('review.chooseAll')}</p>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ReviewUpdates() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('waiting');
  const queue = useFetch(`/updates/review?status=${status}`);
  const { refresh } = useCounts();
  const [selected, setSelected] = useState(null);

  const updates = useMemo(() => queue.data?.updates || [], [queue.data]);
  // Keep a valid selection: first item when the list changes.
  useEffect(() => {
    if (!updates.length) return setSelected(null);
    if (!updates.some((u) => u._id === selected)) setSelected(updates[0]._id);
  }, [updates, selected]);
  const current = updates.find((u) => u._id === selected);

  function done() {
    refresh();
    queue.reload();
  }

  const emptyText = { waiting: t('review.emptyWaiting'), approved: t('review.emptyApproved'), rejected: t('review.emptyRejected') }[status];

  return (
    <>
      <PageHeader title={t('review.title')} subtitle={t('review.subtitle')} />
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {['waiting', 'approved', 'rejected'].map((s) => (
          <button key={s} role="tab" aria-selected={status === s} onClick={() => { setStatus(s); setSelected(null); }}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${status === s ? 'bg-primary text-white' : 'bg-white/95 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}`}>
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {queue.loading && !queue.data ? <Spinner /> : queue.error && !queue.data ? <ErrorBox message={queue.error} onRetry={queue.reload} /> : updates.length === 0 ? (
        <Card><EmptyState icon={Inbox} text={emptyText} /></Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className="space-y-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
            {updates.map((u) => (
              <li key={u._id}>
                <button onClick={() => setSelected(u._id)}
                  className={`glass block w-full p-3 text-left transition ${u._id === selected ? 'ring-2 ring-primary' : 'hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{L(u.projectId.name)}</span>
                    {u.matchStatus === 'needs_check' && u.status === 'waiting' ? <Badge tone="amber">{t('review.needsCheck')}</Badge> : u.status === 'waiting' ? <Badge tone="green">{t('review.matched')}</Badge> : <StatusBadge status={u.status} />}
                  </div>
                  <p className="text-xs text-mute">{u.supervisorId?.name} · {fmtDate(u.workDate)}</p>
                  <div className="mt-1 line-clamp-3"><UpdateText update={u} toggle={false} /></div>
                  <div className="mt-2"><ItemChips items={u.items} /></div>
                </button>
              </li>
            ))}
          </ul>
          {current && <ReviewDetail key={current._id} update={current} onDone={done} />}
        </div>
      )}
    </>
  );
}
