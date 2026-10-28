import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ImageIcon, Languages, Inbox } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { useCounts } from '../../components/AppShell';
import { Badge, Button, Card, EmptyState, ErrorBox, inputClass, PageHeader, Spinner } from '../../components/ui';
import PipelineSteps from '../../components/PipelineSteps';
import { ItemChips, StatusBadge } from '../../components/UpdateParts';
import { fmtDate, num } from '../../utils/format';

const LANG_NAME = { hi: 'Hindi', te: 'Telugu', en: 'English' };

// What the AI did, step by step, for one update.
function pipelineFor(u) {
  const matched = u.items.filter((i) => i.matchStatus === 'matched').length;
  const needCheck = u.items.length - matched;
  return [
    {
      label: 'Translated',
      state: u.translationFailed ? 'warn' : 'done',
      detail: u.language === 'en' ? 'Already in English'
        : u.translationFailed ? `${LANG_NAME[u.language]}: could not translate` : `${LANG_NAME[u.language]} to English`,
    },
    { label: 'Split into parts', state: 'done', detail: `${u.partsFound || u.items.length} part(s) found` },
    {
      label: 'Matched', state: needCheck ? 'warn' : u.items.length ? 'done' : 'warn',
      detail: u.items.length ? `${matched} matched${needCheck ? `, ${needCheck} need a check` : ''}` : 'Nothing understood',
    },
    { label: 'Checks', state: u.warnings?.length ? 'warn' : 'done', detail: u.warnings?.length ? `${u.warnings.length} warning(s)` : 'All clear' },
  ];
}

// One matched item: top 3 suggestions as bars, a dropdown to choose, and the quantity.
function ItemEditor({ item, index, edit, setEdit, options, readOnly, liveWarnings }) {
  const isTask = item.kind === 'task';
  const chosen = options.find((o) => String(o.id) === String(edit.ref));
  return (
    <div className="rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold">
          Part {index + 1}: <span className="font-semibold text-ink/70">"{item.text}"</span>
        </p>
        <Badge tone={item.kind === 'task' ? 'blue' : 'ochre'}>{isTask ? 'Work done' : 'Material used'}</Badge>
      </div>

      <div className="space-y-1.5">
        {item.matches.map((m) => {
          const selected = String(edit.ref) === String(m.refId);
          return (
            <button
              key={m.refId} type="button" disabled={readOnly} onClick={() => setEdit({ ...edit, ref: String(m.refId) })}
              className={`block w-full rounded-lg p-2 text-left ring-1 transition ${selected ? 'bg-primary/10 ring-primary' : 'bg-white ring-gray-200 hover:ring-primary/50'} disabled:cursor-default`}
            >
              <div className="flex items-center justify-between gap-2 text-sm font-bold">
                <span>{m.name}</span><span>{Math.round(m.score * 100)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className={`h-2 rounded-full ${m.score >= 0.6 ? 'bg-success' : m.score >= 0.4 ? 'bg-warning' : 'bg-gray-400'}`} style={{ width: `${Math.round(m.score * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs font-semibold text-ink/60">{m.reasons.join(' · ')}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-ink/70">{isTask ? 'Task' : 'Material'}</span>
          <select className={inputClass} disabled={readOnly} value={edit.ref} onChange={(e) => setEdit({ ...edit, ref: e.target.value })}>
            <option value="">Choose {isTask ? 'a task' : 'a material'}...</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.unit})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-ink/70">Quantity {chosen ? `(${chosen.unit})` : item.unit ? `(${item.unit})` : ''}</span>
          <input type="number" min="0" step="any" className={inputClass} disabled={readOnly} value={edit.quantity}
            onChange={(e) => setEdit({ ...edit, quantity: e.target.value })} />
        </label>
      </div>
      {item.reportedQty !== undefined && Number(edit.quantity) !== item.reportedQty && (
        <p className="mt-1 text-xs font-semibold text-ink/60">Supervisor wrote {num(item.reportedQty)}.</p>
      )}
      {[...item.warnings, ...liveWarnings].filter((w, i, a) => a.indexOf(w) === i).map((w) => (
        <p key={w} className="mt-2 flex items-start gap-1.5 text-xs font-bold text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}
        </p>
      ))}
    </div>
  );
}

function ReviewDetail({ update, onDone }) {
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
      ? project.data.tasks.map((t) => ({ id: t.taskId, name: t.name, unit: t.unit, done: t.doneQty, planned: t.plannedQty }))
      : project.data.materials.map((m) => ({ id: m.materialId, name: m.name, unit: m.unit, stock: m.stock }));
  };

  // Live checks that follow the officer's own choices.
  const live = useMemo(() => {
    const out = update.items.map(() => []);
    const added = {};
    update.items.forEach((it, i) => {
      const e = edits[i];
      if (!e?.ref) return;
      const q = Number(e.quantity) || 0;
      if (it.kind === 'task') added[e.ref] = (added[e.ref] || 0) + q;
    });
    update.items.forEach((it, i) => {
      const e = edits[i];
      if (!e?.ref || !project.data) return;
      const q = Number(e.quantity) || 0;
      if (it.kind === 'task') {
        const t = project.data.tasks.find((x) => String(x.taskId) === e.ref);
        if (t && t.doneQty + added[e.ref] > t.plannedQty) out[i].push(`${t.name}: ${num(t.doneQty + added[e.ref])} ${t.unit} would be more than the planned ${num(t.plannedQty)} ${t.unit}.`);
      } else {
        const m = project.data.materials.find((x) => String(x.materialId) === e.ref);
        if (m && q > m.stock) out[i].push(`${m.name}: ${num(q)} ${m.unit} used is more than the stock of ${num(m.stock)} ${m.unit}.`);
      }
    });
    return out;
  }, [edits, project.data, update.items]);
  const overPlanned = live.flat().some((w) => /more than the planned/.test(w));
  const incomplete = edits.some((e) => !e.ref || !(Number(e.quantity) > 0));

  async function decide(kind) {
    setBusy(kind);
    setError('');
    try {
      const body = kind === 'approve'
        ? { comment, items: update.items.map((it, i) => ({ _id: it._id, quantity: Number(edits[i].quantity), [it.kind === 'task' ? 'taskId' : 'materialId']: edits[i].ref })) }
        : { comment };
      await api.patch(`/updates/${update._id}/${kind}`, body);
      toast(kind === 'approve' ? 'Update approved' : 'Update rejected');
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
          <div>
            <h2 className="text-xl font-extrabold">{update.projectId.name}</h2>
            <p className="text-sm font-semibold text-ink/65">{update.supervisorId?.name} · Work date {fmtDate(update.workDate)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {update.matchStatus === 'needs_check' && !readOnly && <Badge tone="amber">Needs check</Badge>}
            <StatusBadge status={update.status} />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-extrabold uppercase text-ink/55"><Languages className="h-3.5 w-3.5" />Original ({LANG_NAME[update.language]})</p>
            <p className="rounded-xl bg-white/80 p-3 text-base font-semibold ring-1 ring-black/5">{update.originalText}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase text-ink/55">In English</p>
            <p className="rounded-xl bg-white/80 p-3 text-base font-semibold ring-1 ring-black/5">
              {update.translationFailed ? <span className="text-amber-700">Could not translate. Please read the original text.</span> : update.englishText}
            </p>
          </div>
        </div>
        {update.photoUrl ? (
          <a href={update.photoUrl} target="_blank" rel="noreferrer" className="mt-3 block">
            <img src={update.photoUrl} alt="Photo from the site" className="max-h-64 rounded-xl object-cover ring-1 ring-black/10" />
          </a>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink/50"><ImageIcon className="h-4 w-4" />No photo sent</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink/60">AI pipeline</h3>
        <PipelineSteps steps={pipelineFor(update)} />
      </Card>

      <Card>
        <h3 className="mb-2 text-lg font-extrabold">What the AI understood</h3>
        {project.loading && !project.data ? <Spinner /> : project.error && !project.data ? <ErrorBox message={project.error} onRetry={project.reload} /> : (
          <div className="space-y-3">
            {update.items.length === 0 && (
              <p className="rounded-xl bg-warning/15 p-3 text-sm font-bold text-amber-800">Nothing about the project work was understood. Please reject it with a comment, or ask the supervisor to resend.</p>
            )}
            {update.items.map((it, i) => edits[i] && (
              <ItemEditor key={it._id} item={it} index={i} edit={edits[i]} options={optionsFor(it.kind)} readOnly={readOnly}
                setEdit={(e) => setEdits(edits.map((x, k) => (k === i ? e : x)))} liveWarnings={live[i]} />
            ))}
          </div>
        )}
        {update.warnings?.some((w) => /translate/i.test(w)) && (
          <p className="mt-2 text-xs font-bold text-amber-700">{update.warnings.find((w) => /translate/i.test(w))}</p>
        )}
      </Card>

      <Card>
        {readOnly ? (
          <div className="text-sm font-semibold">
            <StatusBadge status={update.status} /> {update.reviewedAt && <span className="ml-2 text-ink/60">on {fmtDate(update.reviewedAt)}</span>}
            {update.officerComment && <p className="mt-2 rounded-xl bg-white/80 p-3">Your comment: {update.officerComment}</p>}
          </div>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-extrabold">
                Comment {overPlanned ? <span className="text-danger">(needed: this is above the planned quantity)</span> : <span className="font-semibold text-ink/55">(needed only to reject)</span>}
              </span>
              <textarea className={inputClass} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a short note for the supervisor" />
            </label>
            {error && <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="success" busy={busy === 'approve'} disabled={!!busy || incomplete || (overPlanned && !comment.trim())} onClick={() => decide('approve')}>
                <CheckCircle2 className="h-4 w-4" />Approve
              </Button>
              <Button variant="danger" busy={busy === 'reject'} disabled={!!busy || !comment.trim()} onClick={() => decide('reject')}>
                <XCircle className="h-4 w-4" />Reject
              </Button>
              {incomplete && update.items.length > 0 && <p className="self-center text-xs font-bold text-ink/60">To approve, choose a task or material and a quantity for every part.</p>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ReviewUpdates() {
  const [status, setStatus] = useState('waiting');
  const queue = useFetch(`/updates/review?status=${status}`);
  const { refresh } = useCounts();
  const [selected, setSelected] = useState(null);

  const updates = queue.data?.updates || [];
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

  return (
    <>
      <PageHeader title="Review Updates" subtitle="Check what the AI understood, then approve, change or reject." />
      <div className="mb-3 flex gap-2" role="tablist">
        {['waiting', 'approved', 'rejected'].map((s) => (
          <button key={s} role="tab" aria-selected={status === s} onClick={() => { setStatus(s); setSelected(null); }}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold capitalize transition ${status === s ? 'bg-primary text-white' : 'bg-white/90 text-ink/70 ring-1 ring-gray-300 hover:bg-primary/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {queue.loading && !queue.data ? <Spinner /> : queue.error && !queue.data ? <ErrorBox message={queue.error} onRetry={queue.reload} /> : updates.length === 0 ? (
        <Card><EmptyState icon={Inbox} text={status === 'waiting' ? 'All caught up. No updates are waiting.' : `No ${status} updates yet.`} /></Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
          <ul className="space-y-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
            {updates.map((u) => (
              <li key={u._id}>
                <button onClick={() => setSelected(u._id)}
                  className={`glass block w-full p-3 text-left transition ${u._id === selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-extrabold">{u.projectId.name}</span>
                    {u.matchStatus === 'needs_check' && u.status === 'waiting' ? <Badge tone="amber">Needs check</Badge> : u.status === 'waiting' ? <Badge tone="green">Matched</Badge> : <StatusBadge status={u.status} />}
                  </div>
                  <p className="text-xs font-bold text-ink/55">{u.supervisorId?.name} · {fmtDate(u.workDate)}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">{u.englishText || u.originalText}</p>
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
