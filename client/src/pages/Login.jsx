import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Languages, ShieldCheck, BarChart3, UserCog, HardHat } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { errorText } from '../api';
import CountrysideBackground from '../components/CountrysideBackground';
import LanguageSwitch from '../components/LanguageSwitch';
import Logo from '../components/Logo';
import { Button, Field, inputClass } from '../components/ui';

// Demo accounts shown as quick-login buttons. Password is the same for all.
const DEMO_PASSWORD = 'password123';
const DEMOS = [
  { email: 'officer@anvyra.test', officer: true },
  { email: 'housing@anvyra.test', project: 'Government Houses' },
  { email: 'watertank@anvyra.test', project: 'Overhead Water Tank' },
  { email: 'canal@anvyra.test', project: 'Canal' },
  { email: 'electric@anvyra.test', project: 'Electric Lines' },
];

export default function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError(t('login.needBoth'));
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorText(err, t('login.failed')));
      setBusy(false);
    }
  }

  const features = [
    { icon: Languages, text: t('features.ai') },
    { icon: ShieldCheck, text: t('features.approval') },
    { icon: BarChart3, text: t('features.all') },
  ];

  return (
    <>
      <CountrysideBackground />
      <div className="relative z-10 min-h-screen px-4 py-5 sm:px-8">
        <div className="flex justify-end"><LanguageSwitch /></div>
        <div className="mx-auto mt-4 grid max-w-5xl items-center gap-8 lg:mt-10 lg:grid-cols-2">
          {/* Left: what ANVYRA is */}
          <section className="glass p-6 lg:bg-white/70">
            <Logo size={52} />
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{t('app.tagline')}</h1>
            <p className="mt-3 text-base font-semibold text-ink/75">{t('app.description')}</p>
            <ul className="mt-5 space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-3 font-bold">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-dark">
                    <f.icon className="h-5 w-5" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </section>

          {/* Right: sign in */}
          <section className="glass p-6">
            <h2 className="text-2xl font-extrabold">{t('login.title')}</h2>
            <p className="mb-4 text-sm font-semibold text-ink/65">{t('login.subtitle')}</p>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label={t('login.email')}>
                <input type="email" autoComplete="username" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label={t('login.password')}>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} autoComplete="current-password"
                    className={`${inputClass} pr-11`} value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button" onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/60 hover:bg-gray-100"
                    aria-label={show ? t('login.hide') : t('login.show')}
                  >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>
              {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p>}
              <Button type="submit" busy={busy} className="w-full !py-3 text-base">
                {busy ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-sm font-extrabold">{t('login.demo')}</p>
              <p className="mb-2 text-xs font-semibold text-ink/60">{t('login.demoHint')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMOS.map((d) => (
                  <button
                    key={d.email} type="button"
                    onClick={() => { setEmail(d.email); setPassword(DEMO_PASSWORD); setError(''); }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-bold transition hover:bg-primary/10 ${
                      d.officer ? 'border-primary/40 sm:col-span-2' : 'border-gray-300'
                    }`}
                  >
                    {d.officer ? <UserCog className="h-4 w-4 shrink-0 text-primary" /> : <HardHat className="h-4 w-4 shrink-0 text-accent" />}
                    {d.officer ? t('login.officer') : t('login.supervisorOf', { project: d.project })}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
