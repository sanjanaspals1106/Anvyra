import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

// toast("Saved") or toast("Failed", "error"). Disappears after 4 seconds.
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Math.random();
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className="pop-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-lg">
            {i.type === 'error' ? <XCircle className="h-5 w-5 shrink-0 text-danger" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
