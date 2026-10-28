import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import { TrendingUp, ClipboardCheck, AlertTriangle, Wallet, PackageMinus, Clock } from 'lucide-react';
import { useFetch } from '../../hooks';
import { Badge, Card, EmptyState, Loaded, PageHeader, ProgressRing, Spinner } from '../../components/ui';
import { UpdateRow } from '../../components/UpdateParts';
import { metaFor } from '../../utils/projectMeta';
import { fmtDate, inr, num } from '../../utils/format';

function Stat({ icon: Icon, label, value, sub, tone = 'text-primary' }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold uppercase tracking-wide text-ink/55">{label}</p>
        <p className="text-3xl font-black leading-tight">{value}</p>
        {sub && <p className="truncate text-xs font-bold text-ink/60">{sub}</p>}
      </div>
    </Card>
  );
}

function ProjectCard({ p }) {
  const { icon: Icon, color } = metaFor(p.type);
  return (
    <Link to={`/projects/${p.projectId}`} className="glass group block p-4 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: color }}><Icon className="h-5 w-5" /></span>
        <h3 className="flex-1 text-lg font-extrabold leading-tight">{p.name}</h3>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="text-center">
          <ProgressRing percent={p.progressPercent} size={92} color={p.onTrack ? '#2E9E44' : '#D93F3F'} />
          <p className="mt-1 text-xs font-bold text-ink/60">Planned {num(p.plannedPercent)}%</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-sm font-semibold">
          <p className="truncate text-ink/80">{p.supervisor || '-'}</p>
          <p className="flex items-center gap-1 text-xs text-ink/60"><Clock className="h-3.5 w-3.5" />{fmtDate(p.lastUpdateDate)}</p>
          <Badge tone={p.onTrack ? 'green' : 'red'}>{p.onTrack ? 'On track' : 'Delayed'}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.lowStockItems.map((m) => <Badge key={m} tone="red"><PackageMinus className="h-3 w-3" />Low stock: {m}</Badge>)}
        {p.openIssues > 0 && <Badge tone="red"><AlertTriangle className="h-3 w-3" />{p.openIssues} open {p.openIssues === 1 ? 'issue' : 'issues'}</Badge>}
        {p.budgetWarning && <Badge tone="amber"><Wallet className="h-3 w-3" />Spending ahead of work</Badge>}
        {p.waitingUpdates > 0 && <Badge tone="blue">{p.waitingUpdates} waiting for review</Badge>}
      </div>
    </Link>
  );
}

// Weekly progress for all projects: solid line = actual, dashed = planned.
function ProgressChart({ projects }) {
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
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d).slice(0, 6)} tick={{ fontSize: 12 }} minTickGap={24} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={fmtDate} formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {projects.map((p) => (
          <Line key={p.name} dataKey={p.name} stroke={metaFor(p.type).color} strokeWidth={3} dot={false} connectNulls />
        ))}
        {projects.map((p) => (
          <Line key={`${p.name}-plan`} dataKey={`${p.name} (planned)`} stroke={metaFor(p.type).color} strokeWidth={1.5}
            strokeDasharray="5 4" dot={false} connectNulls legendType="none" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BudgetChart({ projects }) {
  const data = projects.map((p) => ({ name: p.name, 'Budget spent': p.budget.percent, 'Work done': p.progressPercent }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickFormatter={(n) => n.replace("Government ", "").replace("Overhead ", "").replace(" Lines", "")} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Budget spent" fill="#D9A441" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Work done" fill="#2E9E44" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Tabs: one per project; inside, Waiting / Approved / Rejected lists.
function UpdatesByProject({ projects }) {
  const [active, setActive] = useState(projects[0]?.projectId);
  const state = useFetch(active ? `/projects/${active}/updates` : null);
  const groups = [['waiting', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']];
  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {projects.map((p) => (
          <button
            key={p.projectId} role="tab" aria-selected={active === p.projectId} onClick={() => setActive(p.projectId)}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition ${active === p.projectId ? 'bg-primary text-white' : 'bg-white text-ink/70 ring-1 ring-gray-300 hover:bg-primary/10'}`}
          >
            {p.name}{p.waitingUpdates > 0 && <span className="ml-1.5 rounded-full bg-white/30 px-1.5 text-xs">{p.waitingUpdates}</span>}
          </button>
        ))}
      </div>
      {state.loading && !state.data ? <Spinner /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map(([key, label]) => {
            const list = (state.data?.updates || []).filter((u) => u.status === key);
            return (
              <div key={key}>
                <h4 className="mb-2 text-sm font-extrabold text-ink/70">{label} ({list.length})</h4>
                {list.length === 0 ? <EmptyState text="Nothing here" /> : (
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
  const dash = useFetch('/dashboard');
  const history = useFetch('/dashboard/progress-history');
  return (
    <>
      <Loaded state={dash}>
        {(d) => (
          <>
            <PageHeader title={`${d.village} Village`} subtitle={fmtDate(new Date())} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={TrendingUp} label="Village progress" value={`${num(d.overallPercent)}%`} sub="Average of all projects" tone="text-success" />
              <Link to="/review"><Stat icon={ClipboardCheck} label="Updates waiting" value={d.waitingUpdates} sub="For your review" /></Link>
              <Link to="/issues"><Stat icon={AlertTriangle} label="Open issues" value={d.openIssues} sub="Not yet resolved" tone="text-danger" /></Link>
              <Stat icon={Wallet} label="Budget spent" value={`${num(d.budget.percent)}%`} sub={`${inr(d.budget.spent)} of ${inr(d.budget.sanctioned)}`} tone="text-accent" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {d.projects.map((p) => <ProjectCard key={p.projectId} p={p} />)}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="mb-1 text-lg font-extrabold">Progress over time</h3>
                <p className="mb-2 text-xs font-semibold text-ink/60">Solid line: work done. Dashed line: plan.</p>
                {history.loading && !history.data ? <Spinner /> : history.error ? <p className="py-8 text-center text-sm text-danger">{history.error}</p>
                  : <ProgressChart projects={history.data.projects} />}
              </Card>
              <Card>
                <h3 className="mb-1 text-lg font-extrabold">Money spent and work done</h3>
                <p className="mb-2 text-xs font-semibold text-ink/60">If the gold bar is much taller than the green one, spending is ahead of the work.</p>
                <BudgetChart projects={d.projects} />
              </Card>
            </div>

            <h2 className="mb-2 mt-6 text-xl font-extrabold">Updates by project</h2>
            <UpdatesByProject projects={d.projects} />
          </>
        )}
      </Loaded>
    </>
  );
}
