import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ClipboardCheck, AlertTriangle, Users, Home, Send, ListChecks, Package, LogOut, Menu, X, FolderKanban,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import { initials } from '../utils/format';
import { L } from '../utils/l10n';
import Logo from './Logo';
import LanguageSwitch from './LanguageSwitch';
import CountrysideBackground from './CountrysideBackground';

// Numbers shown on sidebar badges (updates waiting, open issues). Pages call refresh() after a change.
const CountsContext = createContext({ counts: {}, refresh: () => {} });
export const useCounts = () => useContext(CountsContext);

const OFFICER_NAV = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/review', key: 'nav.review', icon: ClipboardCheck, badge: 'waitingUpdates', badgeTone: 'bg-primary' },
  { to: '/issues', key: 'nav.issues', icon: AlertTriangle, badge: 'openIssues', badgeTone: 'bg-danger' },
  { to: '/supervisors', key: 'nav.supervisors', icon: Users },
];
const SUPERVISOR_NAV = [
  { to: '/', key: 'nav.myProject', icon: Home, end: true },
  { to: '/send', key: 'nav.sendUpdate', icon: Send },
  { to: '/updates', key: 'nav.myUpdates', icon: ListChecks },
  { to: '/materials', key: 'nav.materialsIssues', icon: Package },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
    isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
  }`;

function titleFor(pathname, t, nav) {
  if (pathname.startsWith('/projects/')) return t('nav.projectDetails');
  const hit = [...nav].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return hit ? t(hit.key) : 'ANVYRA';
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false); // sidebar on phones
  const [counts, setCounts] = useState({});
  const [projects, setProjects] = useState([]);
  const isOfficer = user.role === 'officer';

  const refresh = useCallback(() => {
    if (!isOfficer) return;
    api.get('/dashboard/counts').then((r) => setCounts(r.data)).catch(() => {});
  }, [isOfficer]);

  useEffect(() => {
    refresh();
    if (isOfficer) api.get('/projects').then((r) => setProjects(r.data.projects)).catch(() => {});
  }, [isOfficer, refresh]);

  useEffect(() => setOpen(false), [pathname]); // close the menu after choosing a page

  const nav = isOfficer ? OFFICER_NAV : SUPERVISOR_NAV;
  const pageTitle = titleFor(pathname, t, nav);

  // The browser tab title follows the page and the language.
  useEffect(() => { document.title = `${pageTitle} · ANVYRA`; }, [pageTitle, i18n.language]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        <button className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(false)} aria-label={t('nav.close')}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
            <n.icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t(n.key)}</span>
            {n.badge && counts[n.badge] > 0 && (
              <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium text-white ${n.badgeTone}`}>{counts[n.badge]}</span>
            )}
          </NavLink>
        ))}
        {isOfficer && projects.length > 0 && (
          <div className="pt-3">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-mute">{t('nav.projects')}</p>
            {projects.map((p) => (
              <NavLink key={p.projectId} to={`/projects/${p.projectId}`} className={linkClass}>
                <FolderKanban className="h-5 w-5 shrink-0" />
                <span className="truncate">{L(p.name)}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-mute">{isOfficer ? t('roles.officer') : t('roles.supervisor')}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-mute hover:bg-slate-100" aria-label={t('nav.signOut')} title={t('nav.signOut')}>
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <CountsContext.Provider value={{ counts, refresh }}>
      <CountrysideBackground />
      <div className="relative z-10 min-h-screen lg:flex">
        {/* Sidebar: fixed on large screens, slides in on phones */}
        <aside className="glass fixed inset-y-3 left-3 hidden w-64 !bg-white/90 lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
            <aside className="pop-in absolute inset-y-0 left-0 w-72 bg-white/95 shadow-xl backdrop-blur">{sidebar}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1 lg:pl-72">
          <header className="sticky top-0 z-30 flex items-center gap-3 px-3 py-3 sm:px-5 lg:pr-5">
            <button className="glass rounded-lg p-2.5 lg:hidden" onClick={() => setOpen(true)} aria-label={t('nav.menu')}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="glass flex min-w-0 flex-1 items-center justify-between gap-3 !bg-white/90 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight sm:text-lg">{pageTitle}</p>
                {!isOfficer && <ProjectName />}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!isOfficer && <LanguageSwitch className="hidden sm:inline-flex !bg-slate-100" />}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" title={user.name}>
                  {initials(user.name)}
                </div>
              </div>
            </div>
          </header>
          <div className="px-3 pb-1 sm:hidden"><LanguageSwitch className="flex w-full justify-center" /></div>
          <main className="mx-auto max-w-6xl px-3 pb-24 pt-2 sm:px-5">
            <Outlet />
          </main>
        </div>
      </div>
    </CountsContext.Provider>
  );
}

// Supervisor's project name under the page title.
function ProjectName() {
  useTranslation(); // redraw when the language changes
  const [name, setName] = useState('');
  useEffect(() => {
    api.get('/projects').then((r) => setName(r.data.projects[0]?.name || '')).catch(() => {});
  }, []);
  return name ? <p className="truncate text-xs text-mute">{L(name)}</p> : null;
}
