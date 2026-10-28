import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, PackageMinus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, Field, inputClass, Loaded, PageHeader, ProgressBar, ProgressRing } from '../../components/ui';
import { UpdateRow } from '../../components/UpdateParts';
import { metaFor } from '../../utils/projectMeta';
import { fmtDate, inr, num, toInputDate } from '../../utils/format';

function AddExpense({ projectId, onSaved }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', date: toInputDate(), note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/projects/${projectId}/expenses`, form);
      toast('Expense added');
      setForm({ amount: '', date: toInputDate(), note: '' });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add expense</Button>;
  return (
    <form onSubmit={save} className="space-y-3 rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount (₹)"><input required type="number" min="1" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Date"><input required type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      <Field label="What was it for?"><input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" busy={busy}>Save expense</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

const ACTION_TEXT = {
  update_submitted: 'Update sent', update_approved: 'Update approved', update_rejected: 'Update rejected',
  material_received: 'Material received', issue_raised: 'Issue reported', issue_resolved: 'Issue resolved',
  expense_added: 'Expense added', supervisor_added: 'Supervisor added',
};

export default function ProjectDetails() {
  const { id } = useParams();
  const detail = useFetch(`/projects/${id}`);
  const expenses = useFetch(`/projects/${id}/expenses`);
  const issues = useFetch(`/projects/${id}/issues`);
  const updates = useFetch(`/projects/${id}/updates`);
  const activity = useFetch(`/projects/${id}/activity`);

  return (
    <Loaded state={detail}>
      {(d) => {
        const { icon: Icon, color } = metaFor(d.project.type);
        const s = d.summary;
        const open = (issues.data?.issues || []).filter((i) => i.status === 'open');
        const resolved = (issues.data?.issues || []).filter((i) => i.status === 'resolved');
        return (
          <>
            <PageHeader title={d.project.name} subtitle={d.project.description} />
            <Card className="flex flex-wrap items-center gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: color }}><Icon className="h-7 w-7" /></span>
              <ProgressRing percent={d.progressPercent} size={96} color={s.onTrack ? '#2E9E44' : '#D93F3F'} />
              <div className="space-y-1 text-sm font-bold">
                <Badge tone={s.onTrack ? 'green' : 'red'}>{s.onTrack ? 'On track' : 'Delayed'}</Badge>
                <p className="text-ink/70">Planned today: {num(d.project.plannedPercent)}%</p>
                <p className="text-ink/70">Supervisor: {d.project.supervisorId?.name || '-'}</p>
                <p className="text-ink/70">{fmtDate(d.project.startDate)} to {fmtDate(d.project.endDate)}</p>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-3 text-lg font-extrabold">Work progress</h3>
                <ul className="space-y-3">
                  {d.tasks.map((t) => (
                    <li key={t.taskId}>
                      <div className="mb-1 flex justify-between gap-2 text-sm font-bold">
                        <span>{t.name}</span>
                        <span className="shrink-0 text-ink/70">{num(t.doneQty)} / {num(t.plannedQty)} {t.unit} ({num(t.percent)}%)</span>
                      </div>
                      <ProgressBar percent={t.percent} color={t.percent >= 100 ? 'bg-success' : 'bg-primary'} />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="mb-3 text-lg font-extrabold">Materials</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-ink/55">
                      <tr><th className="pb-2">Material</th><th className="pb-2 text-right">Received</th><th className="pb-2 text-right">Used</th><th className="pb-2 text-right">In stock</th></tr>
                    </thead>
                    <tbody className="font-semibold">
                      {d.materials.map((m) => (
                        <tr key={m.materialId} className={`border-t border-gray-200 ${m.lowStock ? 'bg-danger/10' : ''}`}>
                          <td className="py-2">{m.name} <span className="text-xs text-ink/50">({m.unit})</span></td>
                          <td className="py-2 text-right">{num(m.received)}</td>
                          <td className="py-2 text-right">{num(m.used)}</td>
                          <td className={`py-2 text-right font-extrabold ${m.lowStock ? 'text-danger' : ''}`}>
                            {m.lowStock && <PackageMinus className="mr-1 inline h-4 w-4" />}{num(m.stock)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold">Budget</h3>
                  {s.budgetWarning && <Badge tone="amber">Spending ahead of work</Badge>}
                </div>
                <p className="text-3xl font-black">{inr(d.budget.spent)}</p>
                <p className="mb-2 text-sm font-bold text-ink/65">spent of {inr(d.budget.sanctioned)} ({num(d.budget.percent)}%)</p>
                <ProgressBar percent={d.budget.percent} color={s.budgetWarning ? 'bg-warning' : 'bg-accent'} height="h-3" />
                <ul className="my-4 divide-y divide-gray-200 text-sm font-semibold">
                  {(expenses.data?.expenses || []).map((e) => (
                    <li key={e._id} className="flex justify-between gap-3 py-2">
                      <span>{e.note || 'Expense'} <span className="text-xs text-ink/50">· {fmtDate(e.date)}</span></span>
                      <span className="shrink-0 font-extrabold">{inr(e.amount)}</span>
                    </li>
                  ))}
                  {expenses.data?.expenses.length === 0 && <li className="py-2 text-ink/55">No expenses yet.</li>}
                </ul>
                <AddExpense projectId={id} onSaved={() => { expenses.reload(); detail.reload(); }} />
              </Card>

              <Card>
                <h3 className="mb-3 text-lg font-extrabold">Issues</h3>
                {issues.loading && !issues.data ? null : (
                  <>
                    {open.length === 0 && <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-success"><CheckCircle2 className="h-4 w-4" />No open issues</p>}
                    <ul className="space-y-2">
                      {open.map((i) => (
                        <li key={i._id} className="rounded-xl bg-danger/10 p-3 text-sm font-semibold">
                          <p className="mb-1 flex items-center gap-1.5 font-extrabold text-danger"><AlertTriangle className="h-4 w-4" /><span className="capitalize">{i.type}</span> · {fmtDate(i.raisedAt)}</p>
                          {i.description}
                        </li>
                      ))}
                      {resolved.map((i) => (
                        <li key={i._id} className="rounded-xl bg-white/70 p-3 text-sm font-semibold ring-1 ring-black/5">
                          <p className="mb-1 text-xs font-extrabold text-success">Resolved {fmtDate(i.resolvedAt)} · <span className="capitalize">{i.type}</span></p>
                          {i.description}
                          <p className="mt-1 text-xs text-ink/60">Note: {i.resolutionNote}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-3 text-lg font-extrabold">Update history</h3>
                {(updates.data?.updates || []).length === 0 ? <EmptyState text="No updates yet." /> : (
                  <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                    {updates.data.updates.map((u) => <UpdateRow key={u._id} update={u} />)}
                  </ul>
                )}
              </Card>
              <Card>
                <h3 className="mb-3 text-lg font-extrabold">Activity log</h3>
                {(activity.data?.activity || []).length === 0 ? <EmptyState text="No activity yet." /> : (
                  <ul className="max-h-[28rem] divide-y divide-gray-200 overflow-y-auto pr-1 text-sm">
                    {activity.data.activity.map((a) => (
                      <li key={a._id} className="py-2">
                        <p className="flex justify-between gap-2 text-xs font-extrabold text-ink/55"><span>{ACTION_TEXT[a.action]}</span><span>{fmtDate(a.at)}</span></p>
                        <p className="font-semibold">{a.details}</p>
                        <p className="text-xs font-semibold text-ink/50">by {a.userId?.name || 'someone'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        );
      }}
    </Loaded>
  );
}
