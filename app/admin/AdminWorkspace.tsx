'use client';

import { ReactNode, useState } from 'react';

type AdminView = 'orders' | 'calendar' | 'menu';

const views: { id: AdminView; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'menu', label: 'Menu' },
];

export default function AdminWorkspace({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AdminView>('orders');

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
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
