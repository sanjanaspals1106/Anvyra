import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '../i18n';
import api, { getToken, setToken, setUnauthorizedHandler } from '../api';
import { setNames } from '../utils/l10n';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Everyone (officer and supervisor) uses the language saved on their account.
function applyLanguage(user) {
  if (user?.language) i18n.changeLanguage(user.language);
}

// Hindi / Telugu names of projects, tasks and materials, loaded once after sign-in.
async function loadNames() {
  try {
    const res = await api.get('/names');
    setNames(res.data);
  } catch { /* English names are used */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const pickedBeforeLogin = useRef(false); // language chosen on the login page

  const logout = useCallback(() => {
    setToken(null);
    setNames({});
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api.get('/auth/me')
      .then(async (res) => { applyLanguage(res.data.user); await loadNames(); setUser(res.data.user); })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    let me = res.data.user;
    if (pickedBeforeLogin.current) {
      // The person chose a language on the login page: keep it and save it on their account.
      try { me = (await api.patch('/auth/language', { language: i18n.language })).data.user; } catch { /* keep going */ }
    } else {
      applyLanguage(me);
    }
    await loadNames();
    setUser(me);
    return me;
  }, []);

  // Switching language: change the page, remember it in the browser, and save it on the account.
  const changeLanguage = useCallback(async (lang) => {
    await i18n.changeLanguage(lang);
    if (!user) { pickedBeforeLogin.current = true; return; }
    try {
      const res = await api.patch('/auth/language', { language: lang });
      setUser(res.data.user);
    } catch { /* the page is already translated; saving can fail quietly */ }
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, logout, changeLanguage }), [user, loading, login, logout, changeLanguage]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
