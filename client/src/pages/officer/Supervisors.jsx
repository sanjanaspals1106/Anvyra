import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, inputClass, PageHeader, Spinner } from '../../components/ui';

const LANGS = { en: 'English', hi: 'Hindi', te: 'Telugu' };
const empty = { name: '', email: '', password: '', language: 'hi', projectId: '' };

export default function Supervisors() {
  const toast = useToast();
  const list = useFetch('/supervisors');
  const projects = useFetch('/projects');
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/supervisors', form);
      toast('Supervisor added');
      setForm(empty);
      list.reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Supervisors" subtitle="People who send daily updates from the sites." />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          {list.loading && !list.data ? <Spinner /> : list.error && !list.data ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.supervisors.length === 0 ? <EmptyState text="No supervisors yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-ink/55"><tr><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Project</th><th className="pb-2">Language</th></tr></thead>
                <tbody className="font-semibold">
                  {list.data.supervisors.map((s) => (
                    <tr key={s._id} className="border-t border-gray-200">
                      <td className="py-2.5 font-extrabold">{s.name}</td>
                      <td className="py-2.5">{s.email}</td>
                      <td className="py-2.5">{s.projectId?.name}</td>
                      <td className="py-2.5"><Badge tone="blue">{LANGS[s.language]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><UserPlus className="h-5 w-5 text-primary" />Add a supervisor</h3>
          <form onSubmit={add} className="space-y-3">
            <Field label="Name"><input required className={inputClass} value={form.name} onChange={set('name')} /></Field>
            <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
            <Field label="Password" hint="At least 6 characters."><input required type="text" minLength={6} className={inputClass} value={form.password} onChange={set('password')} /></Field>
            <Field label="Language">
              <select className={inputClass} value={form.language} onChange={set('language')}>
                {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Project" hint="The new supervisor becomes the project's supervisor on the dashboard.">
              <select required className={inputClass} value={form.projectId} onChange={set('projectId')}>
                <option value="">Choose a project...</option>
                {(projects.data?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
              </select>
            </Field>
            {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p>}
            <Button type="submit" busy={busy} className="w-full">Add supervisor</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
