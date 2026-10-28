import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import api, { errorText } from '../../api';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Field, inputClass, PageHeader } from '../../components/ui';
import PipelineSteps from '../../components/PipelineSteps';
import { num, toInputDate } from '../../utils/format';

const MAX = 1000;
const SPEECH_LANG = { hi: 'hi-IN', te: 'te-IN', en: 'en-IN' };
const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// "Columns – 2 nos (91%)" or "Cement used – 40 bags (98%)"
function understoodLine(it, t) {
  const best = it.matches[0];
  const name = it.matchedName || best?.name || '?';
  const label = it.kind === 'material' ? t('send.used', { name }) : name;
  const qty = `${num(it.quantity)}${it.unit ? ` ${it.unit}` : ''}`;
  return { label: `${label} – ${qty}`, score: Math.round((best?.score || 0) * 100), sure: it.matchStatus === 'matched' };
}

export default function SendUpdate() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [workDate, setWorkDate] = useState(toInputDate());
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(false);
  const [stage, setStage] = useState(-1); // -1 = not sending; 0..3 = pipeline step in progress; 4 = all done
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const fileInput = useRef(null);
  const photoUrl = photo ? URL.createObjectURL(photo) : '';
  useEffect(() => () => photoUrl && URL.revokeObjectURL(photoUrl), [photoUrl]);

  // Live preview: wait ~700 ms after the last key press, then ask the matcher (nothing is saved).
  useEffect(() => {
    if (!text.trim()) { setPreview(null); setChecking(false); return undefined; }
    setChecking(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/match/preview', { text });
        if (!cancelled) setPreview(res.data);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [text]);

  // Voice typing with the browser's Web Speech API (hidden when the browser cannot do it).
  function toggleMic() {
    if (listening) { recognition.current?.stop(); return; }
    const rec = new SpeechRecognition();
    rec.lang = SPEECH_LANG[i18n.language] || 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      setText((old) => `${old}${old && !old.endsWith(' ') ? ' ' : ''}${said}`.slice(0, MAX));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  }

  const lang = preview?.language;
  const items = preview?.items || [];
  const needCheck = items.filter((i) => i.matchStatus === 'needs_check').length;
  const stepsFor = () => {
    if (stage >= 0) {
      // while sending, the four steps tick off one after another
      const labels = ['translated', 'split', 'matched', 'checks'];
      return labels.map((k, i) => ({ label: t(`pipeline.${k}`), state: stage > i ? 'done' : stage === i ? 'active' : 'pending' }));
    }
    if (!preview) return ['translated', 'split', 'matched', 'checks'].map((k) => ({ label: t(`pipeline.${k}`), state: checking ? 'active' : 'pending', detail: checking ? '' : t('pipeline.waiting') }));
    return [
      { label: t('pipeline.translated'), state: preview.translationFailed ? 'warn' : 'done',
        detail: lang === 'en' ? t('pipeline.en') : preview.translationFailed ? t('pipeline.notTranslated') : t('pipeline.toEnglish', { lang: t(`languages.${lang}`) }) },
      { label: t('pipeline.split'), state: 'done', detail: t('pipeline.parts', { n: preview.partsFound }) },
      { label: t('pipeline.matched'), state: needCheck || !items.length ? 'warn' : 'done',
        detail: t('pipeline.matchedN', { n: items.length - needCheck }) + (needCheck ? `, ${t('pipeline.needCheckN', { n: needCheck })}` : '') },
      { label: t('pipeline.checks'), state: preview.warnings.length ? 'warn' : 'done', detail: preview.warnings.length ? t('pipeline.warningsN', { n: preview.warnings.length }) : t('pipeline.clear') },
    ];
  };

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return setError(t('send.empty'));
    setError('');
    setStage(0);
    const ticker = setInterval(() => setStage((s) => (s >= 0 && s < 3 ? s + 1 : s)), 600);
    try {
      const form = new FormData();
      form.append('text', text);
      form.append('workDate', workDate);
      if (photo) form.append('photo', photo);
      await api.post('/updates', form);
      clearInterval(ticker);
      setStage(4);
      toast(t('send.sent'));
      setTimeout(() => navigate('/updates'), 1100);
    } catch (err) {
      clearInterval(ticker);
      setStage(-1);
      setError(errorText(err));
    }
  }

  const sending = stage >= 0;
  return (
    <>
      <PageHeader title={t('send.title')} />
      <form onSubmit={submit} className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Field label={t('send.question')}>
            <div className="relative">
              <textarea
                rows={6} maxLength={MAX} disabled={sending} value={text} onChange={(e) => setText(e.target.value)}
                placeholder={t('send.placeholder')} className={`${inputClass} !text-lg leading-relaxed ${SpeechRecognition ? 'pr-14' : ''}`}
              />
              {SpeechRecognition && (
                <button
                  type="button" onClick={toggleMic} disabled={sending}
                  aria-label={listening ? t('send.micStop') : t('send.mic')} title={listening ? t('send.micStop') : t('send.mic')}
                  className={`absolute right-2 top-2 rounded-full p-2.5 ${listening ? 'animate-pulse bg-danger text-white' : 'bg-primary/10 text-primary-dark hover:bg-primary/20'}`}
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}
            </div>
            <div className="mt-1 flex justify-between text-xs font-semibold text-ink/55">
              <span>{listening ? t('send.listening') : ''}</span><span>{text.length} / {MAX}</span>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('send.workDate')}>
              <input type="date" max={toInputDate()} className={inputClass} value={workDate} onChange={(e) => setWorkDate(e.target.value)} disabled={sending} />
            </Field>
            <div>
              <span className="mb-1 block text-sm font-bold text-ink/80">{t('send.photo')}</span>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files[0] || null)} />
              {photo ? (
                <div className="flex items-center gap-2">
                  <img src={photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <Button type="button" variant="ghost" onClick={() => { setPhoto(null); fileInput.current.value = ''; }}><X className="h-4 w-4" />{t('send.removePhoto')}</Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" onClick={() => fileInput.current.click()} disabled={sending}><Camera className="h-4 w-4" />{t('send.addPhoto')}</Button>
              )}
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p>}
          <Button type="submit" busy={sending} className="w-full !py-3.5 text-base">
            <Send className="h-5 w-5" />{sending ? t('send.sending') : t('send.submit')}
          </Button>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold"><Sparkles className="h-5 w-5 text-accent" />{t('send.preview')}</h3>
            {!text.trim() ? (
              <p className="text-sm font-semibold text-ink/55">{t('send.placeholder')}</p>
            ) : checking && !preview ? (
              <p className="text-sm font-semibold text-ink/60">{t('send.writing')}</p>
            ) : preview ? (
              items.length === 0 ? <p className="text-sm font-bold text-amber-700">{t('send.nothing')}</p> : (
                <>
                  <p className="mb-2 text-sm font-extrabold text-ink/70">{t('send.understood')}:</p>
                  <ul className="space-y-1.5">
                    {items.map((it, i) => {
                      const l = understoodLine(it, t);
                      return (
                        <li key={i} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-base font-extrabold ${l.sure ? 'bg-success/10' : 'bg-warning/15'}`}>
                          <span>{l.label}</span>
                          <Badge tone={l.sure ? 'green' : 'amber'}>{l.sure ? `${l.score}%` : t('send.notSure')}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                  {needCheck > 0 && <p className="mt-2 text-xs font-bold text-amber-700">{t('send.checkNote')}</p>}
                </>
              )
            ) : null}
          </Card>
          <Card>
            <PipelineSteps steps={stepsFor()} columns="grid-cols-2" />
          </Card>
        </div>
      </form>
    </>
  );
}
