import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../i18n';
import api, { getToken, setToken, setUnauthorizedHandler } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Officer pages are English only; a supervisor uses the language saved on their account.
function applyLanguage(user) {
  if (!user) return;
  i18n.changeLanguage(user.role === 'officer' ? 'en' : user.language || 'en');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api.get('/auth/me')
      .then((res) => { setUser(res.data.user); applyLanguage(res.data.user); })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    applyLanguage(res.data.user);
    return res.data.user;
  }, []);

  // Switching language: remember it in the browser and on the supervisor's account.
  const changeLanguage = useCallback(async (lang) => {
    await i18n.changeLanguage(lang);
    if (user && user.role === 'supervisor') {
      try {
        const res = await api.patch('/auth/language', { language: lang });
        setUser(res.data.user);
      } catch { /* the page is already translated; saving can fail quietly */ }
    }
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, logout, changeLanguage }), [user, loading, login, logout, changeLanguage]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
