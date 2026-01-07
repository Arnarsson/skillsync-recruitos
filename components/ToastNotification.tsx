
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface Props {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastNotification: React.FC<Props> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={`
            pointer-events-auto w-80 p-4 rounded-lg shadow-2xl border backdrop-blur-md animate-slideInRight flex items-start
            ${t.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' : 
              t.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' :
              t.type === 'warning' ? 'bg-amber-900/80 border-amber-500/50 text-amber-100' :
              'bg-apex-800/90 border-apex-600 text-slate-200'}
          `}
        >
          <div className={`mr-3 mt-0.5 ${
             t.type === 'success' ? 'text-emerald-400' : 
             t.type === 'error' ? 'text-red-400' :
             t.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
          }`}>
            <i className={`fa-solid ${
                t.type === 'success' ? 'fa-circle-check' : 
                t.type === 'error' ? 'fa-triangle-exclamation' :
                t.type === 'warning' ? 'fa-bolt' : 'fa-circle-info'
            }`}></i>
          </div>
          <div className="flex-1">
             <h4 className="text-xs font-bold uppercase tracking-wide mb-1 opacity-80">{t.type}</h4>
             <p className="text-xs leading-relaxed font-mono">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-100 opacity-60">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
