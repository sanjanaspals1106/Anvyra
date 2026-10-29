import axios from 'axios';
import i18n from './i18n';
import { messageForError } from './utils/l10n';

const TOKEN_KEY = 'anvyra.token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

// One Axios instance: adds the JWT to every request and signs out when the server says 401.
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) onUnauthorized();
    return Promise.reject(err);
  }
);

// Friendly message from an API error, in the chosen language.
export function errorText(err, fallback = i18n.t('errors.generic')) {
  if (err?.response?.data?.error) return messageForError(err.response.data, fallback);
  if (err?.code === 'ERR_NETWORK') return i18n.t('errors.network');
  // The dev proxy answers 5xx with no message when the API is not running.
  if (err?.response && err.response.status >= 500) return i18n.t('errors.serverDown');
  return fallback;
}

export default api;
