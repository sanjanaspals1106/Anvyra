import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, PackageMinus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, Field, inputClass, Loaded, PageHeader, ProgressBar, ProgressRing } from '../../components/ui';
import { UpdateRow } from '../../components/UpdateParts';
import { metaFor, COLORS } from '../../utils/projectMeta';
import { fmtDate, inr, num, toInputDate } from '../../utils/format';
import { L, Ldesc, unitName, activityText } from '../../utils/l10n';

function AddExpense({ projectId, onSaved }) {
  const { t } = useTranslation();
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
      toast(t('proj.expenseAdded'));
      setForm({ amount: '', date: toInputDate(), note: '' });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t('proj.addExpense')}</Button>;
  return (
    <form onSubmit={save} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('proj.amount')}><input required type="number" min="1" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label={t('proj.date')}><input required type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      <Field label={t('proj.whatFor')}><input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" busy={busy}>{t('proj.saveExpense')}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
      </div>
    </form>
  );
}

export default function ProjectDetails() {
  const { t } = useTranslation();
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
            <PageHeader title={L(d.project.name)} subtitle={Ldesc(d.project.description)} />
            <Card className="flex flex-wrap items-center gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg text-white" style={{ background: color }}><Icon className="h-7 w-7" strokeWidth={1.5} /></span>
              <ProgressRing percent={d.progressPercent} size={96} color={s.onTrack ? COLORS.onTrack : COLORS.late} />
              <div className="space-y-1 text-sm">
                <Badge tone={s.onTrack ? 'green' : 'red'}>{s.onTrack ? t('home.onTrack') : t('home.delayed')}</Badge>
                <p className="text-mute">{t('proj.plannedToday', { n: num(d.project.plannedPercent) })}</p>
                <p className="text-mute">{t('proj.supervisor', { name: d.project.supervisorId?.name || '-' })}</p>
                <p className="text-mute">{t('proj.period', { from: fmtDate(d.project.startDate), to: fmtDate(d.project.endDate) })}</p>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-3 text-base font-semibold">{t('proj.workProgress')}</h3>
                <ul className="space-y-3">
                  {d.tasks.map((task) => (
                    <li key={task.taskId}>
                      <div className="mb-1 flex justify-between gap-2 text-sm font-medium">
                        <span>{L(task.name)}</span>
                        <span className="shrink-0 text-mute">{num(task.doneQty)} / {num(task.plannedQty)} {unitName(task.unit)} ({num(task.percent)}%)</span>
                      </div>
                      <ProgressBar percent={task.percent} color={task.percent >= 100 ? 'bg-success' : 'bg-primary'} />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="mb-3 text-base font-semibold">{t('proj.materials')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-mute">
                      <tr><th className="pb-2 text-left font-medium">{t('proj.material')}</th><th className="pb-2 text-right font-medium">{t('proj.received')}</th><th className="pb-2 text-right font-medium">{t('proj.used')}</th><th className="pb-2 text-right font-medium">{t('proj.inStock')}</th></tr>
                    </thead>
                    <tbody className="font-semibold">
                      {d.materials.map((m) => (
                        <tr key={m.materialId} className={`border-t border-slate-200 ${m.lowStock ? 'bg-danger/5' : ''}`}>
                          <td className="py-2">{L(m.name)} <span className="text-xs text-mute">({unitName(m.unit)})</span></td>
                          <td className="py-2 text-right">{num(m.received)}</td>
                          <td className="py-2 text-right">{num(m.used)}</td>
                          <td className={`py-2 text-right font-semibold ${m.lowStock ? 'text-danger' : ''}`}>
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
                  <h3 className="text-base font-semibold">{t('proj.budget')}</h3>
                  {s.budgetWarning && <Badge tone="amber">{t('dash.spendingAhead')}</Badge>}
                </div>
                <p className="text-2xl font-semibold">{inr(d.budget.spent)}</p>
                <p className="mb-2 text-sm text-mute">{t('proj.spentOf', { total: inr(d.budget.sanctioned), n: num(d.budget.percent) })}</p>
                <ProgressBar percent={d.budget.percent} color={s.budgetWarning ? 'bg-warning' : 'bg-accent'} height="h-3" />
                <ul className="my-4 divide-y divide-slate-200 text-sm font-semibold">
                  {(expenses.data?.expenses || []).map((e) => (
                    <li key={e._id} className="flex justify-between gap-3 py-2">
                      <span>{e.note || t('proj.expense')} <span className="text-xs text-mute">· {fmtDate(e.date)}</span></span>
                      <span className="shrink-0 font-semibold">{inr(e.amount)}</span>
                    </li>
                  ))}
                  {expenses.data?.expenses.length === 0 && <li className="py-2 text-mute">{t('proj.noExpenses')}</li>}
                </ul>
                <AddExpense projectId={id} onSaved={() => { expenses.reload(); detail.reload(); }} />
              </Card>

              <Card>
                <h3 className="mb-3 text-base font-semibold">{t('proj.issues')}</h3>
                {issues.loading && !issues.data ? null : (
                  <>
                    {open.length === 0 && <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" />{t('proj.noOpenIssues')}</p>}
                    <ul className="space-y-2">
                      {open.map((i) => (
                        <li key={i._id} className="rounded-lg bg-danger/5 p-3 text-sm">
                          <p className="mb-1 flex items-center gap-1.5 font-semibold text-danger"><AlertTriangle className="h-4 w-4" />{t(`mat.types.${i.type}`)} · {fmtDate(i.raisedAt)}</p>
                          {i.description}
                        </li>
                      ))}
                      {resolved.map((i) => (
                        <li key={i._id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                          <p className="mb-1 text-xs font-medium text-success">{t('proj.resolvedOn', { date: fmtDate(i.resolvedAt) })} · {t(`mat.types.${i.type}`)}</p>
                          {i.description}
                          <p className="mt-1 text-xs text-mute">{t('proj.note', { text: i.resolutionNote })}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-3 text-base font-semibold">{t('proj.history')}</h3>
                {(updates.data?.updates || []).length === 0 ? <EmptyState text={t('proj.noUpdates')} /> : (
                  <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                    {updates.data.updates.map((u) => <UpdateRow key={u._id} update={u} />)}
                  </ul>
                )}
              </Card>
              <Card>
                <h3 className="mb-3 text-base font-semibold">{t('proj.activity')}</h3>
                {(activity.data?.activity || []).length === 0 ? <EmptyState text={t('proj.noActivity')} /> : (
                  <ul className="max-h-[28rem] divide-y divide-slate-200 overflow-y-auto pr-1 text-sm">
                    {activity.data.activity.map((a) => (
                      <li key={a._id} className="py-2">
                        <p className="flex justify-between gap-2 text-xs font-medium text-mute"><span>{t(`activity.${a.action}`, { defaultValue: a.action })}</span><span>{fmtDate(a.at)}</span></p>
                        <p>{activityText(a.details)}</p>
                        <p className="text-xs text-mute">{t('proj.by', { name: a.userId?.name || t('proj.someone') })}</p>
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
