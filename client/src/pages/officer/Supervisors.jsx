import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCog } from 'lucide-react';
import api, { errorText } from '../../api';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { L } from '../../utils/l10n';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, inputClass, PageHeader, Spinner } from '../../components/ui';

const LANG_CODES = ['en', 'hi', 'te'];
const blank = { projectId: '', mode: 'new', supervisorId: '', name: '', email: '', password: '', language: 'hi' };

export default function Supervisors() {
  const { t } = useTranslation();
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
    if (current && !window.confirm(t('sup.confirm', { name: current.name }))) return;
    setBusy(true);
    setError('');
    try {
      const body = form.mode === 'new'
        ? { name: form.name, email: form.email, password: form.password, language: form.language }
        : { supervisorId: form.supervisorId };
      await api.put(`/projects/${form.projectId}/supervisor`, body);
      toast(t('sup.changed'));
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
      <PageHeader title={t('sup.title')} subtitle={t('sup.subtitle')} />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            {list.loading && !list.data ? <Spinner /> : list.error && !list.data ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.supervisors.length === 0 ? <EmptyState text={t('sup.empty')} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-mute"><tr><th className="pb-2 font-medium">{t('sup.project')}</th><th className="pb-2 font-medium">{t('sup.supervisor')}</th><th className="pb-2 font-medium">{t('sup.email')}</th><th className="pb-2 font-medium">{t('sup.language')}</th></tr></thead>
                  <tbody className="font-semibold">
                    {list.data.supervisors.map((s) => (
                      <tr key={s._id} className="border-t border-slate-200">
                        <td className="py-2.5">{L(s.projectId?.name)}</td>
                        <td className="py-2.5 font-medium">{s.name}</td>
                        <td className="py-2.5">{s.email}</td>
                        <td className="py-2.5"><Badge tone="blue">{t(`languages.${s.language}`)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {former.length > 0 && (
            <Card>
              <h3 className="mb-2 text-base font-semibold">{t('sup.former')}</h3>
              <p className="mb-2 text-xs text-mute">{t('sup.formerHint')}</p>
              <ul className="text-sm font-semibold">
                {former.map((s) => <li key={s._id} className="border-t border-slate-200 py-2">{s.name} <span className="text-mute">· {L(s.projectId?.name)}</span></li>)}
              </ul>
            </Card>
          )}
        </div>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><UserCog className="h-5 w-5 text-primary" strokeWidth={1.6} />{t('sup.change')}</h3>
          <form onSubmit={save} className="space-y-3">
            <Field label={t('sup.project')}>
              <select required className={inputClass} value={form.projectId} onChange={set('projectId')}>
                <option value="">{t('sup.chooseProject')}</option>
                {(projects.data?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{L(p.name)}</option>)}
              </select>
            </Field>
            {form.projectId && <p className="text-sm text-mute">{t('sup.now', { name: current ? current.name : t('sup.noSupervisor') })}</p>}
            <div className="flex gap-2" role="tablist">
              {[['new', t('sup.createNew')], ['existing', t('sup.chooseFormer')]].map(([v, label]) => (
                <button key={v} type="button" role="tab" aria-selected={form.mode === v} onClick={() => setForm({ ...form, mode: v })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${form.mode === v ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300'}`}>{label}</button>
              ))}
            </div>
            {form.mode === 'new' ? (
              <>
                <Field label={t('sup.name')}><input required className={inputClass} value={form.name} onChange={set('name')} /></Field>
                <Field label={t('sup.email')}><input required type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
                <Field label={t('sup.password')} hint={t('sup.passwordHint')}><input required type="text" minLength={6} className={inputClass} value={form.password} onChange={set('password')} /></Field>
                <Field label={t('sup.language')}>
                  <select className={inputClass} value={form.language} onChange={set('language')}>
                    {LANG_CODES.map((k) => <option key={k} value={k}>{t(`languages.${k}`)}</option>)}
                  </select>
                </Field>
              </>
            ) : former.length === 0 ? (
              <p className="text-sm text-mute">{t('sup.noFormer')}</p>
            ) : (
              <Field label={t('sup.formerLabel')}>
                <select required className={inputClass} value={form.supervisorId} onChange={set('supervisorId')}>
                  <option value="">{t('sup.choose')}</option>
                  {former.map((s) => <option key={s._id} value={s._id}>{s.name} ({L(s.projectId?.name)})</option>)}
                </select>
              </Field>
            )}
            {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" busy={busy} className="w-full">{t('sup.change')}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
