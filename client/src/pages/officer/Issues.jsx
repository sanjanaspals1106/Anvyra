import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { useCounts } from '../../components/AppShell';
import { Badge, Button, Card, EmptyState, ErrorBox, inputClass, PageHeader, Spinner } from '../../components/ui';
import { fmtDate } from '../../utils/format';

function Resolve({ issue, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/issues/${issue._id}/resolve`, { note });
      toast('Issue resolved');
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="mt-3 space-y-2">
      <textarea required rows={2} className={inputClass} placeholder="How was it solved? (needed)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <Button type="submit" variant="success" busy={busy} disabled={!note.trim()}><CheckCircle2 className="h-4 w-4" />Resolve</Button>
    </form>
  );
}

export default function Issues() {
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('open');
  const projects = useFetch('/projects');
  const query = new URLSearchParams({ ...(project && { projectId: project }), ...(status && { status }) }).toString();
  const issues = useFetch(`/issues?${query}`);
  const { refresh } = useCounts();
  const [resolving, setResolving] = useState(null);

  return (
    <>
      <PageHeader title="Issues" subtitle="Problems reported by the site supervisors." />
      <Card className="mb-3 flex flex-wrap items-center gap-3">
        <select aria-label="Project" className={`${inputClass} !w-auto`} value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All projects</option>
          {(projects.data?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
        </select>
        <div className="flex gap-2" role="tablist">
          {[['open', 'Open'], ['resolved', 'Resolved'], ['', 'All']].map(([v, label]) => (
            <button key={label} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${status === v ? 'bg-primary text-white' : 'bg-white text-ink/70 ring-1 ring-gray-300 hover:bg-primary/10'}`}>{label}</button>
          ))}
        </div>
      </Card>

      {issues.loading && !issues.data ? <Spinner /> : issues.error && !issues.data ? <ErrorBox message={issues.error} onRetry={issues.reload} /> : issues.data.issues.length === 0 ? (
        <Card><EmptyState icon={CheckCircle2} text="No issues here." /></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {issues.data.issues.map((i) => (
            <li key={i._id}>
              <Card className="h-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">{i.projectId?.name}</span>
                  <div className="flex gap-1.5">
                    <Badge tone="gray"><span className="capitalize">{i.type}</span></Badge>
                    <Badge tone={i.status === 'open' ? 'red' : 'green'}>{i.status === 'open' ? 'Open' : 'Resolved'}</Badge>
                  </div>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-base font-semibold">
                  {i.status === 'open' && <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-danger" />}{i.description}
                </p>
                {i.photoUrl && <img src={i.photoUrl} alt="Issue photo" className="mt-2 max-h-48 rounded-xl object-cover" />}
                <p className="mt-2 text-xs font-bold text-ink/55">Reported by {i.raisedBy?.name} on {fmtDate(i.raisedAt)}</p>
                {i.status === 'resolved' && (
                  <p className="mt-2 rounded-xl bg-success/10 p-2 text-sm font-semibold">
                    Resolved {fmtDate(i.resolvedAt)} by {i.resolvedBy?.name}: {i.resolutionNote}
                  </p>
                )}
                {i.status === 'open' && (resolving === i._id
                  ? <Resolve issue={i} onDone={() => { setResolving(null); issues.reload(); refresh(); }} />
                  : <Button className="mt-3" variant="ghost" onClick={() => setResolving(i._id)}>Resolve this issue</Button>)}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
