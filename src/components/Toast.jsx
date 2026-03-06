/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let globalAddToast = null;

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// For use outside React components (e.g. in store actions)
export const toast = {
  success: (message) => globalAddToast?.({ type: 'success', message }),
  error: (message) => globalAddToast?.({ type: 'error', message }),
  info: (message) => globalAddToast?.({ type: 'info', message }),
};

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };
const COLORS = {
  success: 'bg-emerald-600 border-emerald-500/50',
  error: 'bg-red-600 border-red-500/50',
  info: 'bg-blue-600 border-blue-500/50',
};

const ToastItem = ({ toast: t, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);

  return (
    <div className={`${COLORS[t.type]} border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 animate-fade-in min-w-[280px] max-w-sm`}>
      <span className="text-white font-bold text-sm">{ICONS[t.type]}</span>
      <span className="text-white text-sm font-medium flex-1">{t.message}</span>
      <button onClick={() => onDismiss(t.id)} className="text-white/60 hover:text-white text-xs">✕</button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, message }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global toast function
  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  const value = {
    success: (message) => addToast({ type: 'success', message }),
    error: (message) => addToast({ type: 'error', message }),
    info: (message) => addToast({ type: 'info', message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
