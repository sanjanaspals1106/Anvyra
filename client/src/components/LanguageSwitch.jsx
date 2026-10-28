import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
];

export default function LanguageSwitch({ className = '' }) {
  const { i18n, t } = useTranslation();
  const { changeLanguage } = useAuth();
  return (
    <div className={`inline-flex rounded-full bg-white/90 p-1 shadow ${className}`} role="group" aria-label={t('common.language')}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => changeLanguage(l.code)}
          aria-pressed={i18n.language === l.code}
          className={`rounded-full px-3 py-1 text-sm font-bold transition ${
            i18n.language === l.code ? 'bg-primary text-white' : 'text-ink/70 hover:bg-gray-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
