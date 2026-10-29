import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, PackagePlus, Siren } from 'lucide-react';
import api, { errorText } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useFetch } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, EmptyState, Field, inputClass, Loaded, PageHeader } from '../../components/ui';
import { fmtDate, num, toInputDate } from '../../utils/format';
import { L, unitName } from '../../utils/l10n';

const TYPES = ['weather', 'material', 'labour', 'land', 'other'];

function ReceiptForm({ projectId, materials, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const blank = { materialId: '', quantity: '', date: toInputDate(), note: '' };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!form.materialId || !form.quantity) return setError(t('errors.required'));
    setBusy(true);
    setError('');
    try {
      await api.post(`/projects/${projectId}/receipts`, form);
      toast(t('mat.saved'));
      setForm(blank);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  const unit = materials.find((m) => m.materialId === form.materialId)?.unit;
  return (
    <form onSubmit={save} className="space-y-3">
      <Field label={t('mat.name')}>
        <select className={inputClass} value={form.materialId} onChange={set('materialId')}>
          <option value="">{t('mat.chooseMaterial')}</option>
          {materials.map((m) => <option key={m.materialId} value={m.materialId}>{L(m.name)} ({unitName(m.unit)})</option>)}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`${t('mat.quantity')}${unit ? ` (${unitName(unit)})` : ''}`}><input type="number" min="0" step="any" className={inputClass} value={form.quantity} onChange={set('quantity')} /></Field>
        <Field label={t('mat.date')}><input type="date" max={toInputDate()} className={inputClass} value={form.date} onChange={set('date')} /></Field>
      </div>
      <Field label={t('mat.note')}><input className={inputClass} value={form.note} onChange={set('note')} /></Field>
      {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" busy={busy} className="w-full"><PackagePlus className="h-4 w-4" />{t('mat.save')}</Button>
    </form>
  );
}

function IssueForm({ projectId, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ type: 'material', description: '' });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const file = useRef(null);

  async function save(e) {
    e.preventDefault();
    if (!form.description.trim()) return setError(t('errors.required'));
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('type', form.type);
      body.append('description', form.description);
      if (photo) body.append('photo', photo);
      await api.post(`/projects/${projectId}/issues`, body);
      toast(t('mat.reported'));
      setForm({ type: 'material', description: '' });
      setPhoto(null);
      if (file.current) file.current.value = '';
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <Field label={t('mat.type')}>
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((k) => <option key={k} value={k}>{t(`mat.types.${k}`)}</option>)}
        </select>
      </Field>
      <Field label={t('mat.description')}>
        <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">{t('mat.photoOptional')}</span>
        <input ref={file} type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0] || null)} className="block w-full text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-medium file:text-primary-dark" />
        {photo && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-mute"><Camera className="h-3.5 w-3.5" />{photo.name}</p>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" variant="danger" busy={busy} className="w-full"><Siren className="h-4 w-4" />{t('mat.report')}</Button>
    </form>
  );
}

export default function MaterialsIssues() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pid = user.projectId;
  const project = useFetch(`/projects/${pid}`);
  const issues = useFetch(`/projects/${pid}/issues`);

  return (
    <>
      <PageHeader title={t('nav.materialsIssues')} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-lg font-semibold">{t('mat.stockTitle')}</h3>
            <Loaded state={project}>
              {(d) => (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-mute">
                      <tr><th className="pb-2">{t('mat.name')}</th><th className="pb-2 text-right">{t('mat.received')}</th><th className="pb-2 text-right">{t('mat.used')}</th><th className="pb-2 text-right">{t('mat.stock')}</th></tr>
                    </thead>
                    <tbody className="font-semibold">
                      {d.materials.map((m) => (
                        <tr key={m.materialId} className={`border-t border-slate-200 ${m.lowStock ? 'bg-danger/10' : ''}`}>
                          <td className="py-2">{L(m.name)} <span className="text-xs text-mute">({unitName(m.unit)})</span></td>
                          <td className="py-2 text-right">{num(m.received)}</td>
                          <td className="py-2 text-right">{num(m.used)}</td>
                          <td className={`py-2 text-right font-semibold ${m.lowStock ? 'text-danger' : ''}`}>{num(m.stock)} {m.lowStock && <Badge tone="red">{t('mat.low')}</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Loaded>
          </Card>
          <Card>
            <h3 className="mb-3 text-lg font-semibold">{t('mat.receiveTitle')}</h3>
            {project.data && <ReceiptForm projectId={pid} materials={project.data.materials} onSaved={project.reload} />}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-lg font-semibold">{t('mat.issueTitle')}</h3>
            <IssueForm projectId={pid} onSaved={issues.reload} />
          </Card>
          <Card>
            <h3 className="mb-3 text-lg font-semibold">{t('mat.myIssues')}</h3>
            {(issues.data?.issues || []).length === 0 ? <EmptyState text={t('mat.noIssues')} /> : (
              <ul className="space-y-2">
                {issues.data.issues.map((i) => (
                  <li key={i._id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-mute">{t(`mat.types.${i.type}`)} · {fmtDate(i.raisedAt)}</span>
                      <Badge tone={i.status === 'open' ? 'red' : 'green'}>{t(`status.${i.status}`)}</Badge>
                    </div>
                    {i.description}
                    {i.status === 'resolved' && <p className="mt-1 text-xs font-medium text-success">{t('mat.resolvedNote')}: {i.resolutionNote}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
