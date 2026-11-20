'use client';

import { ReactNode, useState } from 'react';

type AdminView = 'home' | 'orders' | 'schedule' | 'menu';

const views: { id: AdminView; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></svg> },
  { id: 'orders', label: 'Orders', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg> },
  { id: 'schedule', label: 'Schedule', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg> },
  { id: 'menu', label: 'Menu', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/></svg> },
];

export default function AdminWorkspace({ children, attentionCount = 0 }: { children: ReactNode; attentionCount?: number }) {
  const [view, setView] = useState<AdminView>('home');

  return (
    <div className="admin-workspace" data-view={view}>
      <nav className="admin-workspace-nav" aria-label="Admin sections">
        <div role="tablist" aria-label="Admin workspace">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.icon}
              {item.label}
              {item.id === 'orders' && attentionCount > 0 && <span className="admin-nav-badge">{attentionCount}</span>}
            </button>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
