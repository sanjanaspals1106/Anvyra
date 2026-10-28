import { useState } from 'react';
import { UserCog } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, inputClass, PageHeader, Spinner } from '../../components/ui';

const LANGS = { en: 'English', hi: 'Hindi', te: 'Telugu' };
const blank = { projectId: '', mode: 'new', supervisorId: '', name: '', email: '', password: '', language: 'hi' };

export default function Supervisors() {
  const toast = useToast();
  const list = useFetch('/supervisors');
  const projects = useFetch('/projects');
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const current = list.data?.supervisors.find((s) => s.projectId?._id === form.projectId);
  const former = list.data?.former || [];

  async function save(e) {
    e.preventDefault();
    if (current && !window.confirm(`${current.name} will no longer be able to sign in to this project. Continue?`)) return;
    setBusy(true);
    setError('');
    try {
      const body = form.mode === 'new'
        ? { name: form.name, email: form.email, password: form.password, language: form.language }
        : { supervisorId: form.supervisorId };
      await api.put(`/projects/${form.projectId}/supervisor`, body);
      toast('Supervisor changed');
      setForm(blank);
      list.reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Supervisors" subtitle="Each project has one supervisor who sends the daily updates." />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            {list.loading && !list.data ? <Spinner /> : list.error && !list.data ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.supervisors.length === 0 ? <EmptyState text="No supervisors yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-ink/55"><tr><th className="pb-2">Project</th><th className="pb-2">Supervisor</th><th className="pb-2">Email</th><th className="pb-2">Language</th></tr></thead>
                  <tbody className="font-semibold">
                    {list.data.supervisors.map((s) => (
                      <tr key={s._id} className="border-t border-gray-200">
                        <td className="py-2.5">{s.projectId?.name}</td>
                        <td className="py-2.5 font-extrabold">{s.name}</td>
                        <td className="py-2.5">{s.email}</td>
                        <td className="py-2.5"><Badge tone="blue">{LANGS[s.language]}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {former.length > 0 && (
            <Card>
              <h3 className="mb-2 text-lg font-extrabold">Former supervisors</h3>
              <p className="mb-2 text-xs font-semibold text-ink/60">They cannot sign in. Their past updates and activity are kept.</p>
              <ul className="text-sm font-semibold">
                {former.map((s) => <li key={s._id} className="border-t border-gray-200 py-2">{s.name} <span className="text-ink/55">· {s.projectId?.name}</span></li>)}
              </ul>
            </Card>
          )}
        </div>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><UserCog className="h-5 w-5 text-primary" />Change supervisor</h3>
          <form onSubmit={save} className="space-y-3">
            <Field label="Project">
              <select required className={inputClass} value={form.projectId} onChange={set('projectId')}>
                <option value="">Choose a project...</option>
                {(projects.data?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
              </select>
            </Field>
            {form.projectId && <p className="text-sm font-bold text-ink/70">Now: {current ? current.name : 'no supervisor'}</p>}
            <div className="flex gap-2" role="tablist">
              {[['new', 'Create a new supervisor'], ['existing', 'Choose a former one']].map(([v, label]) => (
                <button key={v} type="button" role="tab" aria-selected={form.mode === v} onClick={() => setForm({ ...form, mode: v })}
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${form.mode === v ? 'bg-primary text-white' : 'bg-white text-ink/70 ring-1 ring-gray-300'}`}>{label}</button>
              ))}
            </div>
            {form.mode === 'new' ? (
              <>
                <Field label="Name"><input required className={inputClass} value={form.name} onChange={set('name')} /></Field>
                <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
                <Field label="Password" hint="At least 6 characters."><input required type="text" minLength={6} className={inputClass} value={form.password} onChange={set('password')} /></Field>
                <Field label="Language">
                  <select className={inputClass} value={form.language} onChange={set('language')}>
                    {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
              </>
            ) : former.length === 0 ? (
              <p className="text-sm font-semibold text-ink/60">There are no former supervisors yet.</p>
            ) : (
              <Field label="Former supervisor">
                <select required className={inputClass} value={form.supervisorId} onChange={set('supervisorId')}>
                  <option value="">Choose...</option>
                  {former.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.projectId?.name})</option>)}
                </select>
              </Field>
            )}
            {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p>}
            <Button type="submit" busy={busy} className="w-full">Change supervisor</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
