import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { useCounts } from '../../components/AppShell';
import { Badge, Button, Card, EmptyState, ErrorBox, inputClass, PageHeader, Spinner } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import { L } from '../../utils/l10n';

function Resolve({ issue, onDone }) {
  const { t } = useTranslation();
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
      toast(t('issuesPage.resolvedToast'));
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="mt-3 space-y-2">
      <textarea required rows={2} className={inputClass} placeholder={t('issuesPage.howSolved')} value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" variant="success" busy={busy} disabled={!note.trim()}><CheckCircle2 className="h-4 w-4" />{t('issuesPage.resolve')}</Button>
    </form>
  );
}

export default function Issues() {
  const { t } = useTranslation();
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('open');
  const projects = useFetch('/projects');
  const query = new URLSearchParams({ ...(project && { projectId: project }), ...(status && { status }) }).toString();
  const issues = useFetch(`/issues?${query}`);
  const { refresh } = useCounts();
  const [resolving, setResolving] = useState(null);

  return (
    <>
      <PageHeader title={t('issuesPage.title')} subtitle={t('issuesPage.subtitle')} />
      <Card className="mb-3 flex flex-wrap items-center gap-3">
        <select aria-label={t('issuesPage.project')} className={`${inputClass} !w-auto`} value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">{t('issuesPage.allProjects')}</option>
          {(projects.data?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{L(p.name)}</option>)}
        </select>
        <div className="flex gap-2" role="tablist">
          {[['open', t('status.open')], ['resolved', t('status.resolved')], ['', t('common.all')]].map(([v, label]) => (
            <button key={v} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${status === v ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'}`}>{label}</button>
          ))}
        </div>
      </Card>

      {issues.loading && !issues.data ? <Spinner /> : issues.error && !issues.data ? <ErrorBox message={issues.error} onRetry={issues.reload} /> : issues.data.issues.length === 0 ? (
        <Card><EmptyState icon={CheckCircle2} text={t('issuesPage.empty')} /></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {issues.data.issues.map((i) => (
            <li key={i._id}>
              <Card className="h-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{L(i.projectId?.name)}</span>
                  <div className="flex gap-1.5">
                    <Badge tone="gray">{t(`mat.types.${i.type}`)}</Badge>
                    <Badge tone={i.status === 'open' ? 'red' : 'green'}>{t(`status.${i.status}`)}</Badge>
                  </div>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-base font-semibold">
                  {i.status === 'open' && <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-danger" />}{i.description}
                </p>
                {i.photoUrl && <img src={i.photoUrl} alt={t('issuesPage.photoAlt')} className="mt-2 max-h-48 rounded-lg object-cover" />}
                <p className="mt-2 text-xs text-mute">{t('issuesPage.reportedBy', { name: i.raisedBy?.name, date: fmtDate(i.raisedAt) })}</p>
                {i.status === 'resolved' && (
                  <p className="mt-2 rounded-lg bg-success/10 p-2 text-sm">
                    {t('issuesPage.resolvedBy', { date: fmtDate(i.resolvedAt), name: i.resolvedBy?.name, note: i.resolutionNote })}
                  </p>
                )}
                {i.status === 'open' && (resolving === i._id
                  ? <Resolve issue={i} onDone={() => { setResolving(null); issues.reload(); refresh(); }} />
                  : <Button className="mt-3" variant="ghost" onClick={() => setResolving(i._id)}>{t('issuesPage.resolveThis')}</Button>)}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
