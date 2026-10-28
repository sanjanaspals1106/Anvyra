import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, PackageMinus, Send } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useFetch } from '../../hooks';
import { Badge, Card, EmptyState, Loaded, PageHeader, ProgressBar, ProgressRing } from '../../components/ui';
import { StatusBadge } from '../../components/UpdateParts';
import { fmtDate, num } from '../../utils/format';

export default function MyProject() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const project = useFetch(`/projects/${user.projectId}`);
  const mine = useFetch('/updates/mine');

  return (
    <Loaded state={project}>
      {(d) => {
        const low = d.materials.filter((m) => m.lowStock);
        return (
          <>
            <PageHeader title={d.project.name} subtitle={d.project.description} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="flex items-center gap-5">
                <ProgressRing percent={d.progressPercent} size={130} stroke={13} color={d.summary.onTrack ? '#2E9E44' : '#D93F3F'} />
                <div className="space-y-2">
                  <p className="text-sm font-extrabold uppercase text-ink/55">{t('home.progress')}</p>
                  <p className="text-sm font-bold text-ink/70">{t('home.planned', { n: num(d.project.plannedPercent) })}</p>
                  <Badge tone={d.summary.onTrack ? 'green' : 'red'}>{d.summary.onTrack ? t('home.onTrack') : t('home.delayed')}</Badge>
                  <div>
                    <Link to="/send" className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-primary-dark">
                      <Send className="h-4 w-4" />{t('home.sendFirst')}
                    </Link>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="mb-2 text-lg font-extrabold">{t('home.lowStock')}</h3>
                {low.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm font-bold text-success"><CheckCircle2 className="h-5 w-5" />{t('home.noLowStock')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {low.map((m) => (
                      <li key={m.materialId} className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
                        <PackageMinus className="h-4 w-4 shrink-0" />{t('home.lowStockText', { name: m.name, qty: num(m.stock), unit: m.unit })}
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="mb-2 mt-4 text-lg font-extrabold">{t('home.openIssues')}</h3>
                {d.openIssues.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm font-bold text-success"><CheckCircle2 className="h-5 w-5" />{t('home.noIssues')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {d.openIssues.map((i) => (
                      <li key={i._id} className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                        <span>{i.description}<span className="block text-xs font-semibold text-ink/55">{t(`mat.types.${i.type}`)} · {fmtDate(i.raisedAt)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <h3 className="mb-3 text-lg font-extrabold">{t('home.tasks')}</h3>
                <ul className="space-y-3">
                  {d.tasks.map((task) => (
                    <li key={task.taskId}>
                      <div className="mb-1 flex justify-between gap-2 text-sm font-bold">
                        <span>{task.name}</span>
                        <span className="shrink-0 text-ink/70">{num(task.doneQty)} / {num(task.plannedQty)} {task.unit}</span>
                      </div>
                      <ProgressBar percent={task.percent} color={task.percent >= 100 ? 'bg-success' : 'bg-primary'} />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">{t('home.lastUpdates')}</h3>
                  <Link to="/updates" className="text-sm font-extrabold text-primary-dark hover:underline">{t('home.seeAll')}</Link>
                </div>
                {mine.loading && !mine.data ? null : (mine.data?.updates || []).length === 0 ? <EmptyState text={t('home.noUpdates')} /> : (
                  <ul className="space-y-2">
                    {mine.data.updates.slice(0, 5).map((u) => (
                      <li key={u._id} className="rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-ink/55">{fmtDate(u.workDate)}</span>
                          <StatusBadge status={u.status} t={t} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold">{u.originalText}</p>
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
