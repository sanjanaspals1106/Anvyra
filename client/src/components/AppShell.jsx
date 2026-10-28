import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ClipboardCheck, AlertTriangle, Users, Home, Send, ListChecks, Package, LogOut, Menu, X, FolderKanban,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import { initials } from '../utils/format';
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
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold transition ${
    isActive ? 'bg-primary text-white shadow' : 'text-ink/80 hover:bg-primary/10'
  }`;

function titleFor(pathname, t) {
  if (pathname.startsWith('/projects/')) return t('nav.projectDetails');
  const all = [...OFFICER_NAV, ...SUPERVISOR_NAV];
  const hit = [...all].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return hit ? t(hit.key) : 'ANVYRA';
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        <button className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(false)} aria-label={t('nav.close')}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
            <n.icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t(n.key)}</span>
            {n.badge && counts[n.badge] > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold text-white ${n.badgeTone}`}>{counts[n.badge]}</span>
            )}
          </NavLink>
        ))}
        {isOfficer && projects.length > 0 && (
          <div className="pt-3">
            <p className="px-3 pb-1 text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('nav.projects')}</p>
            {projects.map((p) => (
              <NavLink key={p.projectId} to={`/projects/${p.projectId}`} className={linkClass}>
                <FolderKanban className="h-5 w-5 shrink-0" />
                <span className="truncate">{p.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-white">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{user.name}</p>
            <p className="truncate text-xs font-semibold text-ink/60">{isOfficer ? t('nav.villageOfficer') : t('nav.siteSupervisor')}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-ink/70 hover:bg-gray-100" aria-label={t('nav.signOut')} title={t('nav.signOut')}>
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
        <aside className="glass fixed inset-y-3 left-3 hidden w-64 lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <aside className="pop-in absolute inset-y-0 left-0 w-72 bg-white/95 shadow-2xl backdrop-blur">{sidebar}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1 lg:pl-72">
          <header className="sticky top-0 z-30 flex items-center gap-3 px-3 py-3 sm:px-5 lg:pr-5">
            <button className="glass rounded-xl p-2.5 lg:hidden" onClick={() => setOpen(true)} aria-label={t('nav.menu')}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="glass flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold leading-tight">{titleFor(pathname, t)}</p>
                {!isOfficer && <ProjectName />}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!isOfficer && <LanguageSwitch className="hidden sm:inline-flex !bg-gray-100" />}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white" title={user.name}>
                  {initials(user.name)}
                </div>
              </div>
            </div>
          </header>
          {!isOfficer && (
            <div className="px-3 pb-1 sm:hidden"><LanguageSwitch className="w-full justify-center" /></div>
          )}
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
  const [name, setName] = useState('');
  useEffect(() => {
    api.get('/projects').then((r) => setName(r.data.projects[0]?.name || '')).catch(() => {});
  }, []);
  return name ? <p className="truncate text-xs font-bold text-primary-dark">{name}</p> : null;
}
