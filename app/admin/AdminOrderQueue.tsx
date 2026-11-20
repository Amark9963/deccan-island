'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminOrderActions } from './AdminOrderActions';

type OrderItem = {
  product_name: string;
  quantity: number;
  line_total_myr: number;
};

export type AdminOrder = {
  id: string;
  order_reference: string;
  status: string;
  payment_status: string;
  quantity: number;
  total_myr: number;
  customer_name: string;
  created_at: string;
  fulfillment_type?: string;
  delivery_status?: string;
  delivery_address?: string;
  delivery_postcode?: string;
  delivery_notes?: string;
  service_date?: string;
  order_items: OrderItem[];
};

type StatusView = 'all' | 'attention' | 'confirmed' | 'completed';
type FulfilmentView = 'all' | 'pickup' | 'delivery';

const statusViews: { id: StatusView; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
];

const needsAttention = (status: string) =>
  ['awaiting_payment', 'payment_under_review'].includes(status);

function formatDate(date?: string) {
  if (!date) return 'Date not set';
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(`${date}T12:00:00+08:00`));
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export default function AdminOrderQueue({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState('');
  const [statusView, setStatusView] = useState<StatusView>('all');
  const [fulfilment, setFulfilment] = useState<FulfilmentView>('all');
  const [date, setDate] = useState('all');
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const dates = useMemo(
    () => Array.from(new Set(orders.map((order) => order.service_date).filter(Boolean))) as string[],
    [orders],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !needle || [
        order.order_reference,
        order.customer_name,
        ...order.order_items.map((item) => item.product_name),
      ].some((value) => value.toLowerCase().includes(needle));
      const matchesStatus = statusView === 'all'
        || (statusView === 'attention' && needsAttention(order.status))
        || (statusView === 'confirmed' && order.status === 'confirmed')
        || (statusView === 'completed' && ['collected', 'delivered'].includes(order.status));
      const matchesFulfilment = fulfilment === 'all'
        || (fulfilment === 'pickup' && order.fulfillment_type !== 'delivery')
        || order.fulfillment_type === fulfilment;
      const matchesDate = date === 'all' || order.service_date === date;
      return matchesSearch && matchesStatus && matchesFulfilment && matchesDate;
    });
  }, [date, fulfilment, orders, query, statusView]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selected]);

  return (
    <>
      <div className="admin-order-tools">
        <label className="admin-search">
          <span className="sr-only">Search orders</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, order or dish"
          />
        </label>
        <div className="admin-order-selects">
          <label>
            <span>Service date</span>
            <select value={date} onChange={(event) => setDate(event.target.value)}>
              <option value="all">All dates</option>
              {dates.map((item) => <option value={item} key={item}>{formatDate(item)}</option>)}
            </select>
          </label>
          <label>
            <span>Fulfilment</span>
            <select value={fulfilment} onChange={(event) => setFulfilment(event.target.value as FulfilmentView)}>
              <option value="all">All types</option>
              <option value="pickup">Self-pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-filter-chips" aria-label="Order status filters">
        {statusViews.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={statusView === item.id}
            onClick={() => setStatusView(item.id)}
          >
            {item.label}
            {item.id === 'attention' && orders.filter((order) => needsAttention(order.status)).length > 0 && (
              <span>{orders.filter((order) => needsAttention(order.status)).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-order-list">
        {filtered.map((order) => (
          <button className="admin-order-card" type="button" key={order.id} onClick={() => setSelected(order)}>
            <span className="admin-order-card-topline">
              <strong>{order.order_reference}</strong>
              <strong>RM{Number(order.total_myr).toFixed(2)}</strong>
            </span>
            <span className="admin-order-customer">{order.customer_name} · {order.quantity} item{order.quantity === 1 ? '' : 's'}</span>
            <span className="admin-order-items">{order.order_items.map((item) => `${item.quantity}× ${item.product_name}`).join(' · ')}</span>
            <span className="admin-order-card-footer">
              <span>{order.fulfillment_type === 'delivery' ? 'Delivery' : 'Self-pickup'} · {formatDate(order.service_date)}</span>
              <span className={`admin-status-pill status-${order.status}`}>{statusLabel(order.status)}</span>
            </span>
          </button>
        ))}
        {filtered.length === 0 && <div className="admin-empty-state"><strong>No matching orders</strong><span>Try changing the filters or search.</span></div>}
      </div>

      {selected && (
        <div className="admin-drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}>
          <aside className="admin-order-drawer" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            <div className="admin-drawer-handle" />
            <header>
              <div>
                <p className="eyebrow">Order details</p>
                <h2 id="order-detail-title">{selected.order_reference}</h2>
              </div>
              <button type="button" className="admin-drawer-close" onClick={() => setSelected(null)} aria-label="Close order details">×</button>
            </header>
            <div className="admin-detail-summary">
              <div><span>Customer</span><strong>{selected.customer_name}</strong></div>
              <div><span>Service date</span><strong>{formatDate(selected.service_date)}</strong></div>
              <div><span>Fulfilment</span><strong>{selected.fulfillment_type === 'delivery' ? 'Delivery' : 'Self-pickup'}</strong></div>
              <div><span>Total</span><strong>RM{Number(selected.total_myr).toFixed(2)}</strong></div>
            </div>
            <section className="admin-detail-section">
              <h3>Items</h3>
              {selected.order_items.map((item, index) => (
                <div className="admin-detail-item" key={`${item.product_name}-${index}`}>
                  <span>{item.quantity}× {item.product_name}</span>
                  <strong>RM{Number(item.line_total_myr).toFixed(2)}</strong>
                </div>
              ))}
            </section>
            {selected.fulfillment_type === 'delivery' && (
              <section className="admin-detail-section">
                <h3>Delivery</h3>
                <p>{selected.delivery_address || 'Address not provided'}{selected.delivery_postcode ? `, ${selected.delivery_postcode}` : ''}</p>
                {selected.delivery_notes && <p className="admin-detail-note">{selected.delivery_notes}</p>}
              </section>
            )}
            <section className="admin-detail-section admin-detail-actions">
              <h3>Update order</h3>
              <AdminOrderActions
                id={selected.id}
                status={selected.status}
                paymentStatus={selected.payment_status}
                fulfillmentType={selected.fulfillment_type}
                deliveryStatus={selected.delivery_status}
              />
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
