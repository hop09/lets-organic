'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  PackageSearch,
  ClipboardList,
  Check,
  Truck,
  PackageCheck,
  XCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage/SafeImage';
import styles from './track.module.css';

const STEPS = [
  { key: 'pending', label: 'Order Received', desc: 'We have your order' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Being prepared' },
  { key: 'shipped', label: 'Shipped', desc: 'On its way to you' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy!' },
];

const STATUS_META = {
  pending: { label: 'Order Received', tone: 'pending' },
  confirmed: { label: 'Confirmed', tone: 'active' },
  shipped: { label: 'Shipped', tone: 'active' },
  delivered: { label: 'Delivered', tone: 'done' },
  cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

function stepIndex(status) {
  return STEPS.findIndex((s) => s.key === status);
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!orderNumber.trim()) {
      setError('Please enter your order number (e.g. LO-482913).');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError('Please enter the phone number or email you used at checkout.');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ orderNumber: orderNumber.trim() });
      if (phone.trim()) params.set('phone', phone.trim());
      if (email.trim()) params.set('email', email.trim());
      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.tracking);
      } else {
        setError(data.error || 'Could not find your order.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
    setOrderNumber('');
    setPhone('');
    setEmail('');
  };

  const meta = result ? STATUS_META[result.status] || STATUS_META.pending : null;
  const currentIdx = result ? stepIndex(result.status) : -1;

  return (
    <div className={styles.trackPage}>
      <div className="container-wide">
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>
            <PackageSearch size={14} /> Order Tracking
          </span>
          <h1 className={styles.title}>Track Your Order</h1>
          <p className={styles.subtitle}>
            Enter your order number and the phone number or email you used at checkout.
          </p>
        </div>

        {!result ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className="input-label" htmlFor="orderNumber">Order Number *</label>
              <input
                id="orderNumber"
                className="input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. LO-482913"
                autoComplete="off"
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className="input-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                />
              </div>
              <div className={styles.orDivider}>or</div>
              <div className={styles.field}>
                <label className="input-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className={styles.spinner} /> Looking up…</>
              ) : (
                <><PackageSearch size={18} /> Track Order</>
              )}
            </button>
            <p className={styles.hint}>
              Your order number was shown on the confirmation screen after checkout.
            </p>
          </form>
        ) : (
          <div className={styles.resultWrap}>
            {/* Status banner */}
            <div className={`${styles.statusBanner} ${styles[meta.tone]}`}>
              <div className={styles.statusIcon}>
                {result.status === 'cancelled' ? <XCircle size={26} /> :
                 result.status === 'delivered' ? <PackageCheck size={26} /> :
                 result.status === 'shipped' ? <Truck size={26} /> :
                 result.status === 'confirmed' ? <Check size={26} /> :
                 <ClipboardList size={26} />}
              </div>
              <div>
                <p className={styles.statusLabel}>{meta.label}</p>
                <p className={styles.statusOrder}>Order {result.orderNumber}</p>
              </div>
              <button className={`btn btn-secondary ${styles.trackAnother}`} onClick={reset}>
                Track another
              </button>
            </div>

            {/* Timeline */}
            {result.status !== 'cancelled' ? (
              <div className={styles.timeline}>
                {STEPS.map((step, i) => {
                  const done = i < currentIdx || result.status === 'delivered';
                  const active = i === currentIdx && result.status !== 'delivered';
                  const reached = i <= currentIdx;
                  return (
                    <div key={step.key} className={styles.timelineStep}>
                      <div className={`${styles.dot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`}>
                        {done ? <Check size={16} /> : <span className={styles.dotNum}>{i + 1}</span>}
                      </div>
                      <div className={styles.stepText}>
                        <p className={`${styles.stepLabel} ${reached ? styles.stepReached : ''}`}>{step.label}</p>
                        <p className={styles.stepDesc}>{step.desc}</p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`${styles.connector} ${i < currentIdx || result.status === 'delivered' ? styles.connectorDone : ''}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.cancelledNote}>
                <XCircle size={18} />
                <p>This order was cancelled. If you paid anything in advance, our team will contact you about a refund.</p>
              </div>
            )}

            {/* Order summary */}
            <div className={styles.summaryGrid}>
              <div className={styles.itemsCard}>
                <h3>Items ({result.items.length})</h3>
                {result.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      width={56}
                      height={56}
                      className={styles.itemImg}
                    />
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemQty}>Qty: {item.quantity}</p>
                    </div>
                    <span className={styles.itemPrice}>
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.detailsCard}>
                <h3>Order Details</h3>
                <div className={styles.detailRow}>
                  <span>Placed on</span>
                  <span>{new Date(result.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Deliver to</span>
                  <span>{result.city}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Payment</span>
                  <span>Cash on Delivery</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Subtotal</span>
                  <span>PKR {Number(result.subtotal).toLocaleString()}</span>
                </div>
                {result.discount > 0 && (
                  <div className={styles.detailRow}>
                    <span>Discount{result.couponCode ? ` (${result.couponCode})` : ''}</span>
                    <span className={styles.discountVal}>− PKR {Number(result.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span>Delivery</span>
                  <span>{result.shipping === 0 ? 'FREE' : `PKR ${Number(result.shipping).toLocaleString()}`}</span>
                </div>
                <div className={`${styles.detailRow} ${styles.totalRow}`}>
                  <span>Total due on delivery</span>
                  <span>PKR {Number(result.total).toLocaleString()}</span>
                </div>

                {result.timeline?.length > 0 && (
                  <div className={styles.history}>
                    <h4>History</h4>
                    {result.timeline.map((h, i) => (
                      <div key={i} className={styles.historyRow}>
                        <span>{(STATUS_META[h.status] || {}).label || h.status}</span>
                        <span>{new Date(h.at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.helpBox}>
              <p>Need help with this order? <Link href="/contact">Contact us</Link> with your order number.</p>
              <Link href="/shop" className="btn btn-secondary">Continue Shopping <ArrowRight size={16} /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
