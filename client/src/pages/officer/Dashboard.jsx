import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import { TrendingUp, ClipboardCheck, AlertTriangle, Wallet, PackageMinus, Clock } from 'lucide-react';
import { useFetch } from '../../hooks';
import { Badge, Card, EmptyState, Loaded, PageHeader, ProgressRing, Spinner } from '../../components/ui';
import { UpdateRow } from '../../components/UpdateParts';
import { metaFor, COLORS } from '../../utils/projectMeta';
import { fmtDate, fmtDay, inr, num } from '../../utils/format';
import { L } from '../../utils/l10n';

function Stat({ icon: Icon, label, value, sub, tone = 'text-primary' }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200 ${tone}`}>
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-mute">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {sub && <p className="truncate text-xs text-mute">{sub}</p>}
      </div>
    </Card>
  );
}

function ProjectCard({ p }) {
  const { t } = useTranslation();
  const { icon: Icon, color } = metaFor(p.type);
  return (
    <Link to={`/projects/${p.projectId}`} className="glass group block p-4 transition hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: color }}><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
        <h3 className="flex-1 text-base font-semibold leading-tight">{L(p.name)}</h3>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="text-center">
          <ProgressRing percent={p.progressPercent} size={92} color={p.onTrack ? COLORS.onTrack : COLORS.late} />
          <p className="mt-1 text-xs text-mute">{t('dash.planned', { n: num(p.plannedPercent) })}</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <p className="truncate font-medium text-slate-700">{p.supervisor || '-'}</p>
          <p className="flex items-center gap-1 text-xs text-mute"><Clock className="h-3.5 w-3.5" />{fmtDate(p.lastUpdateDate)}</p>
          <Badge tone={p.onTrack ? 'green' : 'red'}>{p.onTrack ? t('home.onTrack') : t('home.delayed')}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.lowStockItems.map((m) => <Badge key={m} tone="red"><PackageMinus className="h-3 w-3" />{t('dash.lowStock', { name: L(m) })}</Badge>)}
        {p.openIssues > 0 && <Badge tone="red"><AlertTriangle className="h-3 w-3" />{t('dash.issues', { count: p.openIssues })}</Badge>}
        {p.budgetWarning && <Badge tone="amber"><Wallet className="h-3 w-3" />{t('dash.spendingAhead')}</Badge>}
        {p.waitingUpdates > 0 && <Badge tone="blue">{t('dash.waitingReview', { n: p.waitingUpdates })}</Badge>}
      </div>
    </Link>
  );
}

// Weekly progress for all projects: solid line = actual, dashed = planned.
function ProgressChart({ projects }) {
  const { t } = useTranslation();
  const rows = useMemo(() => {
    const byDate = {};
    projects.forEach((p) => p.points.forEach((pt) => {
      byDate[pt.date] = { ...(byDate[pt.date] || { date: pt.date }), [p.name]: pt.actual, [`${p.name} (planned)`]: pt.planned };
    }));
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [projects]);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 12, fill: COLORS.axis }} minTickGap={24} stroke={COLORS.grid} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.axis }} stroke={COLORS.grid} />
        <Tooltip labelFormatter={fmtDate} formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {projects.map((p) => (
          <Line key={p.name} dataKey={p.name} name={L(p.name)} stroke={metaFor(p.type).color} strokeWidth={2.5} dot={false} connectNulls />
        ))}
        {projects.map((p) => (
          <Line key={`${p.name}-plan`} dataKey={`${p.name} (planned)`} name={t('dash.chartPlanned', { name: L(p.name) })} stroke={metaFor(p.type).color} strokeWidth={1.4}
            strokeDasharray="5 4" dot={false} connectNulls legendType="none" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BudgetChart({ projects }) {
  const { t } = useTranslation();
  const data = projects.map((p) => ({ name: t(`projectKind.${p.type}`), full: L(p.name), spent: p.budget.percent, done: p.progressPercent }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.axis }} interval={0} stroke={COLORS.grid} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.axis }} stroke={COLORS.grid} />
        <Tooltip formatter={(v) => `${v}%`} labelFormatter={(label, payload) => payload?.[0]?.payload?.full || label} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="spent" name={t('dash.budgetSpent')} fill={COLORS.ochre} radius={[4, 4, 0, 0]} />
        <Bar dataKey="done" name={t('dash.workDone')} fill={COLORS.onTrack} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Tabs: one per project; inside, Waiting / Approved / Rejected lists.
function UpdatesByProject({ projects }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(projects[0]?.projectId);
  const state = useFetch(active ? `/projects/${active}/updates` : null);
  const groups = ['waiting', 'approved', 'rejected'];
  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {projects.map((p) => (
          <button
            key={p.projectId} role="tab" aria-selected={active === p.projectId} onClick={() => setActive(p.projectId)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${active === p.projectId ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}`}
          >
            {L(p.name)}{p.waitingUpdates > 0 && <span className="ml-1.5 rounded bg-white/25 px-1.5 text-xs">{p.waitingUpdates}</span>}
          </button>
        ))}
      </div>
      {state.loading && !state.data ? <Spinner /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map((key) => {
            const list = (state.data?.updates || []).filter((u) => u.status === key);
            return (
              <div key={key}>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">{t(`status.${key}`)} ({list.length})</h4>
                {list.length === 0 ? <EmptyState text={t('dash.nothing')} /> : (
                  <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {list.map((u) => <UpdateRow key={u._id} update={u} />)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const dash = useFetch('/dashboard');
  const history = useFetch('/dashboard/progress-history');
  return (
    <>
      <Loaded state={dash}>
        {(d) => (
          <>
            <PageHeader title={t('dash.villageTitle', { village: d.village })} subtitle={fmtDate(new Date())} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={TrendingUp} label={t('dash.progress')} value={`${num(d.overallPercent)}%`} sub={t('dash.progressSub')} tone="text-success" />
              <Link to="/review"><Stat icon={ClipboardCheck} label={t('dash.waiting')} value={d.waitingUpdates} sub={t('dash.waitingSub')} /></Link>
              <Link to="/issues"><Stat icon={AlertTriangle} label={t('dash.openIssues')} value={d.openIssues} sub={t('dash.openIssuesSub')} tone="text-danger" /></Link>
              <Stat icon={Wallet} label={t('dash.budget')} value={`${num(d.budget.percent)}%`} sub={t('dash.budgetSub', { spent: inr(d.budget.spent), total: inr(d.budget.sanctioned) })} tone="text-warning" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {d.projects.map((p) => <ProjectCard key={p.projectId} p={p} />)}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="mb-1 text-base font-semibold">{t('dash.chartProgress')}</h3>
                <p className="mb-2 text-xs text-mute">{t('dash.chartProgressHint')}</p>
                {history.loading && !history.data ? <Spinner /> : history.error ? <p className="py-8 text-center text-sm text-danger">{history.error}</p>
                  : <ProgressChart projects={history.data.projects} />}
              </Card>
              <Card>
                <h3 className="mb-1 text-base font-semibold">{t('dash.chartBudget')}</h3>
                <p className="mb-2 text-xs text-mute">{t('dash.chartBudgetHint')}</p>
                <BudgetChart projects={d.projects} />
              </Card>
            </div>

            <h2 className="mb-2 mt-6 text-lg font-semibold">{t('dash.updatesByProject')}</h2>
            <UpdatesByProject projects={d.projects} />
          </>
        )}
      </Loaded>
    </>
  );
}
