'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Receipt,
  TrendingUp,
  Package,
  RefreshCw,
  AlertTriangle,
  Shield,
  Star,
  Users,
  TicketPercent,
  ArrowRight,
  PackageOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { hasPermission } from '@/lib/permissionsClient';
import styles from './DashboardTab.module.css';

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
  { key: 'all', label: 'All time' },
];

const STATUS_COLORS = {
  pending: '#C8956C',
  confirmed: '#79A36E',
  shipped: '#7FA8C9',
  delivered: '#75E089',
  cancelled: '#FF808A',
};
const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const money = (n) => `PKR ${Number(n || 0).toLocaleString('en-US')}`;
const shortMoney = (v) =>
  Math.abs(v) >= 1000 ? `PKR ${(v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k` : `PKR ${v}`;

function fmtTick(dateStr) {
  if (!dateStr) return '';
  try {
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [y, m] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function fmtFull(dateStr) {
  if (!dateStr) return '';
  try {
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [y, m] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function fmtDateTime(d) {
  try {
    return new Date(d).toLocaleString();
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

const tooltipStyle = {
  backgroundColor: '#151B16',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  color: '#FFFFFF',
  fontSize: '0.8rem',
};

const axisTick = { fill: '#8C9988', fontSize: 11 };
const axisLine = { stroke: 'rgba(255,255,255,0.12)' };

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon}>
        <Icon size={20} />
      </div>
      <div>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiValue}>{value}</div>
        {sub && <div className={styles.kpiSub}>{sub}</div>}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div className={styles.kpiGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${styles.kpiCard} ${styles.skeleton}`} style={{ height: 96 }} />
        ))}
      </div>
      <div className={styles.chartsGrid}>
        <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ height: 340 }} />
        <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ height: 340 }} />
      </div>
    </div>
  );
}

/**
 * Analytics dashboard tab for the admin console.
 *
 * Fetches aggregated store metrics from `/api/analytics` for the selected
 * date range and renders KPI cards, recharts visualizations (dark-themed),
 * and insight tables. Renders friendly empty states when there are no
 * orders in range instead of broken charts.
 */
export default function DashboardTab({ adminUser, onViewOrders }) {
  const canView = hasPermission(adminUser, 'analytics.view');

  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  // Loading starts true only when the viewer has permission; the no-permission
  // branch renders the access notice without a synchronous setState in an effect.
  const [loading, setLoading] = useState(canView);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async (r) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics?range=${encodeURIComponent(r)}`);
      const payload = await res.json();
      if (res.ok && payload.success) {
        setData(payload);
      } else {
        setError(payload.error || 'Failed to load analytics.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async IIFE: state updates happen in the fetch continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await Promise.resolve();
      if (!canView) return;
      await fetchAnalytics(range);
    })();
  }, [canView, range, fetchAnalytics]);

  if (!canView) {
    return (
      <div className={styles.accessCard}>
        <Shield size={36} color="#8C9988" style={{ marginBottom: '1rem' }} />
        <h2 className={styles.tabTitle}>Restricted area</h2>
        <p className={styles.tabSubtitle}>
          Your account doesn&apos;t have the <strong>analytics.view</strong> permission.
          Please contact the store owner if you need access to the dashboard.
        </p>
      </div>
    );
  }

  const rangeLabel = RANGES.find((r) => r.key === range)?.label || range;
  const hasOrders = !!data && data.orders.total > 0;

  const statusData = data
    ? STATUS_ORDER.map((s) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: data.orders.byStatus?.[s] || 0,
        color: STATUS_COLORS[s],
      })).filter((d) => d.value > 0)
    : [];

  const categoryData = (data?.revenueByCategory || []).map((c) => ({
    ...c,
    short: c.category.length > 18 ? `${c.category.slice(0, 17)}…` : c.category,
  }));

  return (
    <div>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.tabTitle}>Store Dashboard</h2>
          <p className={styles.tabSubtitle}>
            Revenue, orders, customers and inventory at a glance — {rangeLabel.toLowerCase()}.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.rangeSelector} role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`${styles.rangeBtn} ${range === r.key ? styles.rangeBtnActive : ''}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchAnalytics(range)}
            disabled={loading}
            title="Refresh analytics"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className={styles.errorCard}>
          <AlertTriangle size={20} />
          <div>
            <strong>Couldn&apos;t load analytics</strong>
            <p>{error}</p>
          </div>
          <button type="button" className={styles.ghostBtn} onClick={() => fetchAnalytics(range)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI cards */}
          <div className={styles.kpiGrid}>
            <KpiCard icon={Banknote} label="Revenue" value={money(data.revenue.total)} sub="Excludes cancelled orders" />
            <KpiCard icon={Receipt} label="Orders" value={data.orders.total.toLocaleString()} sub={`${data.orders.byStatus?.pending || 0} pending`} />
            <KpiCard icon={TrendingUp} label="Avg. order value" value={money(data.aov)} sub="Revenue ÷ orders" />
            <KpiCard icon={Package} label="Items sold" value={data.itemsSold.toLocaleString()} sub="Units across all orders" />
          </div>

          {!hasOrders ? (
            <div className={styles.emptyHero}>
              <PackageOpen size={44} color="#79A36E" style={{ marginBottom: '1rem' }} />
              <h3>No orders yet — share your store to get started</h3>
              <p>
                Once customers start placing orders, revenue charts, top products,
                customer insights and inventory alerts will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Charts */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Revenue over time</div>
                  <div className={styles.chartBody}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.revenue.byDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#79A36E" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#79A36E" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtTick} tick={axisTick} axisLine={axisLine} tickLine={false} minTickGap={28} />
                        <YAxis tickFormatter={shortMoney} tick={axisTick} axisLine={false} tickLine={false} width={72} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={fmtFull}
                          formatter={(v) => [money(v), 'Revenue']}
                          cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#79A36E" strokeWidth={2.5} fill="url(#revFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Orders by status</div>
                  <div className={styles.chartBody}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={3} strokeWidth={0}>
                          {statusData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} orders`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.donutLegend}>
                    {statusData.map((d) => (
                      <span key={d.name} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: d.color }} />
                        {d.name} · {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Orders over time</div>
                  <div className={styles.chartBody}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.orders.byDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtTick} tick={axisTick} axisLine={axisLine} tickLine={false} minTickGap={28} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelFormatter={fmtFull}
                          formatter={(v) => [`${v} orders`, 'Orders']}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="orders" fill="#C8956C" radius={[5, 5, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Revenue by category</div>
                  <div className={styles.chartBody}>
                    {categoryData.length === 0 ? (
                      <div className={styles.chartEmpty}>No category data for this range.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                          <XAxis type="number" tickFormatter={shortMoney} tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="short" tick={axisTick} axisLine={false} tickLine={false} width={110} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, item) => [money(v), item?.payload?.category || 'Revenue']} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                          <Bar dataKey="revenue" fill="#79A36E" radius={[0, 5, 5, 0]} maxBarSize={26} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Insight strip */}
              <div className={styles.insightsGrid}>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div className={styles.insightLabel}>Customers</div>
                    <div className={styles.insightValue}>
                      {data.customers.total.toLocaleString()} total · {data.customers.repeat.toLocaleString()} repeat
                    </div>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>
                    <Star size={18} />
                  </div>
                  <div>
                    <div className={styles.insightLabel}>Reviews</div>
                    <div className={styles.insightValue}>
                      {data.reviews.total.toLocaleString()} total · {data.reviews.pending.toLocaleString()} pending
                      {data.reviews.avgRating != null && ` · ★ ${data.reviews.avgRating}`}
                    </div>
                  </div>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightIcon}>
                    <TicketPercent size={18} />
                  </div>
                  <div>
                    <div className={styles.insightLabel}>Coupons</div>
                    <div className={styles.insightValue}>
                      {data.coupons.length} codes · {data.coupons.reduce((s, c) => s + (c.uses || 0), 0)} uses
                    </div>
                  </div>
                </div>
              </div>

              {/* Tables */}
              <div className={styles.tablesGrid}>
                <div className={`${styles.tableCard} ${styles.tableWide}`}>
                  <div className={styles.tableHeaderRow}>
                    <h3 className={styles.tableTitle}>Recent orders</h3>
                    {typeof onViewOrders === 'function' && (
                      <button type="button" className={styles.linkBtn} onClick={onViewOrders}>
                        View all <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={styles.emptyState}>No orders in this range.</td>
                          </tr>
                        ) : (
                          data.recentOrders.map((o) => (
                            <tr key={o.orderNumber}>
                              <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                              <td>{o.customer}</td>
                              <td style={{ color: '#8C9988', fontSize: '0.8rem' }}>{fmtDateTime(o.createdAt)}</td>
                              <td style={{ fontWeight: 600 }}>{money(o.total)}</td>
                              <td>
                                <span className={`${styles.statusBadge} ${statusClass(o.status)}`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <h3 className={styles.tableTitle}>Top products</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topProducts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={styles.emptyState}>No product sales in this range.</td>
                          </tr>
                        ) : (
                          data.topProducts.map((p) => (
                            <tr key={p.slug || p.name}>
                              <td>
                                {p.slug ? (
                                  <Link href={`/product/${p.slug}`} target="_blank" className={styles.productLink}>
                                    {p.name}
                                  </Link>
                                ) : (
                                  p.name
                                )}
                              </td>
                              <td>{p.qty.toLocaleString()}</td>
                              <td style={{ fontWeight: 600 }}>{money(p.revenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <h3 className={styles.tableTitle}>Top customers</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Orders</th>
                          <th>Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.customers.top.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={styles.emptyState}>No customers in this range.</td>
                          </tr>
                        ) : (
                          data.customers.top.map((c) => (
                            <tr key={c.email || c.name}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                {c.email && (
                                  <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>{c.email}</div>
                                )}
                              </td>
                              <td>{c.orders}</td>
                              <td style={{ fontWeight: 600 }}>{money(c.spent)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <h3 className={styles.tableTitle}>
                    <AlertTriangle size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: '#C8956C' }} />
                    Low stock alerts
                  </h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowStock.length === 0 ? (
                          <tr>
                            <td colSpan={2} className={styles.emptyState}>All stocked up — nothing running low.</td>
                          </tr>
                        ) : (
                          data.lowStock.map((p) => (
                            <tr key={p.slug || p.name}>
                              <td>
                                {p.slug ? (
                                  <Link href={`/product/${p.slug}`} target="_blank" className={styles.productLink}>
                                    {p.name}
                                  </Link>
                                ) : (
                                  p.name
                                )}
                              </td>
                              <td>
                                <span className={`${styles.stockPill} ${p.stockCount <= 5 ? styles.stockCritical : ''}`}>
                                  {p.stockCount} left
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <h3 className={styles.tableTitle}>Coupon usage</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Uses</th>
                          <th>Discount given</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.coupons.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={styles.emptyState}>No coupons created yet.</td>
                          </tr>
                        ) : (
                          data.coupons.map((c) => (
                            <tr key={c.code}>
                              <td style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{c.code}</td>
                              <td>{c.uses.toLocaleString()}</td>
                              <td>{c.discountGiven != null ? money(c.discountGiven) : '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
