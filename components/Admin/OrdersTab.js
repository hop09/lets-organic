'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  X,
  Printer,
  Save,
  ExternalLink,
  Search,
  CalendarDays,
  MapPin,
  StickyNote,
  History,
  Package,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage/SafeImage';
import { hasPermission } from '@/lib/permissionsClient';
import styles from './OrdersTab.module.css';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const LIMIT = 20;

const ADDRESS_FIELDS = [
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Street address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / Province' },
  { key: 'zip', label: 'ZIP / Postal code' },
  { key: 'country', label: 'Country' },
];

const money = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
}

function fmtDay(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
}

function statusClass(status) {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'confirmed':
      return styles.statusConfirmed;
    case 'shipped':
      return styles.statusShipped;
    case 'delivered':
      return styles.statusDelivered;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
}

function StatusBadge({ status }) {
  return <span className={`${styles.statusBadge} ${statusClass(status)}`}>{status}</span>;
}

/**
 * Orders management tab for the admin console.
 *
 * - Table with status/search/date-range filters, server-side pagination,
 *   and a per-row quick status changer (requires `orders.manage`).
 * - Order-detail modal: line items with thumbnails, editable delivery
 *   address, status timeline, admin notes, and a print-friendly invoice.
 * - Permission gating is client-side only for hiding controls; the API
 *   re-enforces `orders.view` / `orders.manage` on every request.
 */
export default function OrdersTab({ adminUser, notify, onPendingCount }) {
  const canManage = hasPermission(adminUser, 'orders.manage');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [rowBusy, setRowBusy] = useState(null);

  const safeNotify = useMemo(
    () => (typeof notify === 'function' ? notify : () => {}),
    [notify]
  );

  // Pending-orders count for the tab badge (owned by the parent page).
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?status=pending&limit=1');
      const data = await res.json();
      if (res.ok && data.success && typeof onPendingCount === 'function') {
        onPendingCount(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [onPendingCount]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, fromDate, toDate]);

  // Load orders on mount and whenever filters / page change (search is debounced below).
  useEffect(() => {
    // Async IIFE: state updates happen in the fetch continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await fetchOrders();
    })();
  }, [fetchOrders]);

  // Pending-orders badge: refresh once on mount, then after each mutation.
  useEffect(() => {
    // Async IIFE: state updates happen in the fetch continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await fetchPendingCount();
    })();
  }, [fetchPendingCount]);

  // Debounce the text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch((prev) => {
        if (prev !== trimmed) setPage(1);
        return trimmed;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const refreshAll = () => {
    fetchOrders();
    fetchPendingCount();
  };

  const applyOrderUpdate = useCallback(
    (orderId, updated) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      setSelected((prev) => (prev && prev._id === orderId ? updated : prev));
    },
    []
  );

  const handleUpdate = useCallback(
    async (orderId, payload, { successMsg } = {}) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        applyOrderUpdate(orderId, data.order);
        fetchPendingCount();
        if (successMsg) safeNotify('success', successMsg);
        return data.order;
      }
      safeNotify('error', data.error || 'Failed to update order.');
      return null;
    },
    [applyOrderUpdate, fetchPendingCount, safeNotify]
  );

  const changeStatus = useCallback(
    async (order, newStatus) => {
      if (!newStatus || newStatus === order.status) return;
      if (
        newStatus === 'cancelled' &&
        !window.confirm(
          `Cancel order ${order.orderNumber}? Stock will be returned to inventory.`
        )
      ) {
        return;
      }
      setRowBusy(order._id);
      try {
        await handleUpdate(order._id, { status: newStatus }, {
          successMsg: `Order ${order.orderNumber} marked as ${newStatus}.`,
        });
      } finally {
        setRowBusy(null);
      }
    },
    [handleUpdate]
  );

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchInput('');
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.tabTitle}>Order Management</h2>
          <p className={styles.tabSubtitle}>
            Review customer orders, update fulfillment status, and track deliveries. Click an order
            number for full details.
          </p>
        </div>
        <button onClick={refreshAll} className={styles.primaryActionBtn}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Search order #, name, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search orders"
          />
        </div>

        <div className={styles.dateWrap}>
          <CalendarDays size={15} className={styles.searchIcon} />
          <input
            className={styles.filterInput}
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            aria-label="Orders from date"
            title="From date"
          />
          <span className={styles.dateSep}>to</span>
          <input
            className={styles.filterInput}
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            aria-label="Orders to date"
            title="To date"
          />
        </div>

        <button onClick={clearFilters} className={styles.ghostBtn} title="Clear all filters">
          Clear
        </button>
      </div>

      {/* Orders table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                {canManage && <th>Quick update</th>}
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className={styles.emptyState}>
                    {loading ? 'Loading orders…' : 'No orders found for this filter.'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <button
                        onClick={() => setSelected(order)}
                        className={styles.orderLink}
                        title="View order details"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className={styles.dateCell}>{fmtDate(order.createdAt)}</td>
                    <td>
                      <div className={styles.customerName}>{order.customer?.fullName}</div>
                      <div className={styles.customerSub}>{order.customer?.phone}</div>
                    </td>
                    <td>
                      {(order.items || []).reduce((sum, i) => sum + i.quantity, 0)} pcs
                      <span className={styles.customerSub}>
                        {' '}
                        ({(order.items || []).length} lines)
                      </span>
                    </td>
                    <td>
                      <div className={styles.totalCell}>{money(order.total)}</div>
                      {order.paymentMethod && (
                        <div className={styles.customerSub}>{order.paymentMethod}</div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    {canManage && (
                      <td>
                        <select
                          className={styles.quickSelect}
                          value={order.status}
                          disabled={rowBusy === order._id}
                          onChange={(e) => changeStatus(order, e.target.value)}
                          aria-label={`Quick update status for ${order.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td>
                      <button
                        onClick={() => setSelected(order)}
                        className={styles.iconBtn}
                        title="View order details"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages} — {total} orders
          </span>
          <div className={styles.pageBtns}>
            <button
              className={styles.iconBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <button
              className={styles.iconBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {selected && (
        <OrderDetailModal
          key={selected._id}
          order={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onChangeStatus={changeStatus}
          rowBusy={rowBusy === selected._id}
          notify={safeNotify}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order detail modal                                                  */
/* ------------------------------------------------------------------ */

function OrderDetailModal({ order, canManage, onClose, onUpdate, onChangeStatus, rowBusy, notify }) {
  // The modal is keyed by order._id in the parent, so a fresh mount per order
  // lets us initialize the edit forms directly from the order — no reset effect.
  const initialAddress = () => {
    const c = order.customer || {};
    return {
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      zip: c.zip || '',
      country: c.country || '',
    };
  };
  const [addrForm, setAddrForm] = useState(initialAddress);
  const [notes, setNotes] = useState(() => order.adminNotes || '');
  const [saving, setSaving] = useState(null); // 'address' | 'notes' | null
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type, text) => setMsg({ type, text });

  const saveAddress = async () => {
    setSaving('address');
    try {
      const updated = await onUpdate(
        order._id,
        { address: addrForm },
        { successMsg: `Delivery address for ${order.orderNumber} updated.` }
      );
      showMsg(updated ? 'success' : 'error', updated ? 'Address saved.' : 'Could not save address.');
    } finally {
      setSaving(null);
    }
  };

  const saveNotes = async () => {
    setSaving('notes');
    try {
      const updated = await onUpdate(order._id, { adminNotes: notes }, {});
      if (updated) {
        showMsg('success', 'Admin notes saved.');
        notify('success', 'Admin notes saved.');
      } else {
        showMsg('error', 'Could not save notes.');
      }
    } finally {
      setSaving(null);
    }
  };

  const history = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(a.at) - new Date(b.at)
  );

  const customer = order.customer || {};

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderNumber}`}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Order {order.orderNumber}</h3>
          <div className={styles.modalHeaderActions}>
            <button
              onClick={() => window.print()}
              className={styles.ghostBtn}
              title="Print invoice"
            >
              <Printer size={15} />
              <span>Invoice</span>
            </button>
            <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status row */}
        <div className={styles.statusRow}>
          <StatusBadge status={order.status} />
          {canManage ? (
            <select
              className={styles.filterSelect}
              value={order.status}
              disabled={rowBusy}
              onChange={(e) => onChangeStatus(order, e.target.value)}
              aria-label="Update order status"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.readOnlyHint}>Status updates need the “manage orders” permission.</span>
          )}
          {rowBusy && <span className={styles.muted}>Updating…</span>}
          <span className={styles.placedAt}>Placed {fmtDate(order.createdAt)}</span>
        </div>

        {msg.text && (
          <div className={`${styles.inlineMsg} ${msg.type === 'error' ? styles.inlineError : styles.inlineSuccess}`}>
            {msg.text}
          </div>
        )}

        {/* Line items */}
        <h4 className={styles.sectionTitle}>
          <Package size={15} /> Items
        </h4>
        <div className={styles.itemsList}>
          {(order.items || []).map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <SafeImage
                src={item.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&h=100&fit=crop'}
                alt={item.name}
                className={styles.itemThumb}
                width={48}
                height={48}
              />
              <div className={styles.itemMeta}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.muted}>
                  {money(item.price)} × {item.quantity}
                  {item.slug && <span> · /{item.slug}</span>}
                </div>
              </div>
              <div className={styles.itemLineTotal}>{money(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className={styles.totalsBox}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>− {money(order.discount)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Delivery Fee</span>
            <span>{order.shipping === 0 ? 'FREE' : money(order.shipping)}</span>
          </div>
          <div className={styles.grandTotalRow}>
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
          <div className={styles.paymentLine}>Payment: {order.paymentMethod || 'COD'}</div>
        </div>

        {/* Customer & delivery address */}
        <h4 className={styles.sectionTitle}>
          <MapPin size={15} /> Customer & Delivery
        </h4>
        <div className={styles.customerCard}>
          <div className={styles.customerNameStrong}>{customer.fullName}</div>
          <div className={styles.muted}>
            {customer.email}
            {customer.notes && <span className={styles.customerNote}> · Notes: {customer.notes}</span>}
          </div>

          <div className={styles.addrGrid}>
            {ADDRESS_FIELDS.map(({ key, label }) => (
              <label key={key} className={styles.addrField}>
                <span className={styles.addrLabel}>{label}</span>
                <input
                  className={styles.filterInput}
                  value={addrForm[key]}
                  disabled={!canManage}
                  onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          {canManage && (
            <button
              onClick={saveAddress}
              className={styles.primaryActionBtn}
              disabled={saving === 'address'}
              style={{ marginTop: '0.75rem' }}
            >
              <Save size={15} />
              <span>{saving === 'address' ? 'Saving…' : 'Save address'}</span>
            </button>
          )}
        </div>

        {/* Status timeline */}
        <h4 className={styles.sectionTitle}>
          <History size={15} /> Status timeline
        </h4>
        {history.length === 0 ? (
          <p className={styles.muted} style={{ margin: '0 0 1.5rem' }}>
            No history yet — this order was placed before status tracking was added.
          </p>
        ) : (
          <ol className={styles.timeline}>
            {history.map((h, i) => (
              <li key={i} className={styles.timelineItem}>
                <span className={`${styles.timelineDot} ${statusClass(h.status)}`} />
                <div className={styles.timelineBody}>
                  <span className={styles.timelineStatus}>{h.status}</span>
                  <span className={styles.muted}>
                    {' '}
                    · {fmtDate(h.at)}
                    {h.by && ` · by ${h.by}`}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Admin notes */}
        <h4 className={styles.sectionTitle}>
          <StickyNote size={15} /> Admin notes
        </h4>
        {canManage ? (
          <>
            <textarea
              className={styles.notesArea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes — only visible to the team (max 2000 characters)."
              maxLength={2000}
              rows={3}
            />
            <button
              onClick={saveNotes}
              className={styles.primaryActionBtn}
              disabled={saving === 'notes'}
              style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}
            >
              <Save size={15} />
              <span>{saving === 'notes' ? 'Saving…' : 'Save notes'}</span>
            </button>
          </>
        ) : (
          <p className={styles.muted} style={{ margin: '0 0 1.5rem' }}>
            {order.adminNotes || 'No admin notes on this order.'}
          </p>
        )}
      </div>

      {/* Print-only invoice (hidden on screen, shown via @media print) */}
      <InvoiceSheet order={order} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print-friendly invoice (rendered hidden; @media print reveals it)   */
/* ------------------------------------------------------------------ */

function InvoiceSheet({ order }) {
  const c = order.customer || {};
  return (
    <div className={styles.invoiceSheet} aria-hidden="true">
      <div className={styles.invoiceStore}>Lets Organic</div>
      <div className={styles.invoiceSub}>Sales Invoice</div>

      <div className={styles.invoiceMeta}>
        <div>
          <strong>Order:</strong> {order.orderNumber}
          <br />
          <strong>Date:</strong> {fmtDate(order.createdAt)}
          <br />
          <strong>Payment:</strong> {order.paymentMethod || 'COD'}
        </div>
        <div>
          <strong>Bill / ship to</strong>
          <br />
          {c.fullName}
          <br />
          {c.phone} · {c.email}
          <br />
          {c.address}
          <br />
          {c.city}
          {c.state ? `, ${c.state}` : ''} {c.zip}
          <br />
          {c.country}
        </div>
      </div>

      <table className={styles.invoiceTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{money(item.price)}</td>
              <td>{money(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.invoiceTotals}>
        <div>
          <span>Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div>
          <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
          <span>− {money(order.discount)}</span>
        </div>
        <div>
          <span>Delivery fee</span>
          <span>{order.shipping === 0 ? 'FREE' : money(order.shipping)}</span>
        </div>
        <div className={styles.invoiceGrandTotal}>
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </div>

      <div className={styles.invoiceFoot}>
        Thank you for shopping with Lets Organic.
      </div>
    </div>
  );
}
