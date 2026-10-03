'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowLeft, Loader2, Tag, X, AlertTriangle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import SafeImage from '@/components/SafeImage/SafeImage';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const errorRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'Pakistan',
    notes: '',
  });

  const isFreeDelivery = settings?.shipping?.freeDelivery ?? false;
  const deliveryFee = settings?.shipping?.deliveryFee ?? 250;
  const threshold = settings?.shipping?.freeDeliveryThreshold ?? 2500;
  const shipping = isFreeDelivery ? 0 : (threshold > 0 && totalPrice >= threshold ? 0 : deliveryFee);
  const total = totalPrice + shipping;

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setAppliedCoupon(code);
    setCouponInput('');
    if (serverError) setServerError('');
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ slug: i.slug || i.id, quantity: i.quantity })),
          customer: formData,
          couponCode: appliedCoupon || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearCart();
        router.push('/thank-you?order=' + encodeURIComponent(data.orderNumber));
      } else {
        // Keep the cart intact so the customer can fix the problem and retry
        setServerError(data.error || 'Could not place your order. Please try again.');
        setLoading(false);
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      // Network failure — keep the cart intact
      setServerError('Network error. Please check your connection and try again.');
      setLoading(false);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyCheckout}>
        <h2>No items to checkout</h2>
        <p>Add some products to your cart first.</p>
        <Link href="/shop" className="btn btn-primary">Go to Shop</Link>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className="container-wide">
        <Link href="/cart" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.checkoutLayout}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div ref={errorRef} className={styles.errorBanner} role="alert">
                <AlertTriangle size={20} />
                <span>{serverError}</span>
              </div>
            )}

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Contact Information</h3>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className={`input ${errors.fullName ? 'input-error' : ''}`}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="input-error-text">{errors.fullName}</p>}
                </div>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="email">Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="input-error-text">{errors.email}</p>}
                </div>
              </div>
              <div className={styles.field}>
                <label className="input-label" htmlFor="phone">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                />
                {errors.phone && <p className="input-error-text">{errors.phone}</p>}
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Shipping Address</h3>
              <div className={styles.field}>
                <label className="input-label" htmlFor="address">Address *</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className={`input ${errors.address ? 'input-error' : ''}`}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House #12, Street 4, Sector F-7/2"
                />
                {errors.address && <p className="input-error-text">{errors.address}</p>}
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="city">City *</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Islamabad / Lahore / Karachi"
                  />
                  {errors.city && <p className="input-error-text">{errors.city}</p>}
                </div>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="state">Province / State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="input"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Punjab / Sindh / KPK / Balochistan"
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="zip">Postal Code *</label>
                  <input
                    id="zip"
                    name="zip"
                    type="text"
                    className={`input ${errors.zip ? 'input-error' : ''}`}
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="44000"
                  />
                  {errors.zip && <p className="input-error-text">{errors.zip}</p>}
                </div>
                <div className={styles.field}>
                  <label className="input-label" htmlFor="country">Country *</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className={`input ${errors.country ? 'input-error' : ''}`}
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Pakistan"
                  />
                  {errors.country && <p className="input-error-text">{errors.country}</p>}
                </div>
              </div>
              <div className={styles.field}>
                <label className="input-label" htmlFor="notes">Order Notes (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  className={`input ${styles.textarea}`}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={18} className={styles.spinner} /> Placing your order...</>
              ) : (
                <><Lock size={18} /> Place Order — PKR {total.toLocaleString()}</>
              )}
            </button>

            <div className={styles.securityNote}>
              <ShieldCheck size={16} />
              <span>Cash on Delivery — pay when your order arrives</span>
            </div>
          </form>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <SafeImage src={item.images[0]} alt={item.name} className={styles.summaryImg} width={56} height={56} />
                  <div className={styles.summaryItemInfo}>
                    <p className={styles.summaryItemName}>{item.name}</p>
                    <p className={styles.summaryItemQty}>Qty: {item.quantity}</p>
                  </div>
                  <span className={styles.summaryItemPrice}>
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.summaryDivider} />

            {/* Coupon */}
            <div className={styles.couponBox}>
              {appliedCoupon ? (
                <div className={styles.couponChip}>
                  <Tag size={14} />
                  <span>{appliedCoupon}</span>
                  <button type="button" onClick={removeCoupon} className={styles.couponRemove} aria-label="Remove coupon">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={styles.couponInputRow}>
                  <input
                    type="text"
                    className="input"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                  />
                  <button type="button" onClick={applyCoupon} className="btn btn-secondary">
                    Apply
                  </button>
                </div>
              )}
              <p className={styles.couponHint}>
                {appliedCoupon
                  ? 'Your coupon will be validated when you place the order.'
                  : 'Have a coupon? Enter it above — it will be validated at checkout.'}
              </p>
            </div>

            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>PKR {totalPrice.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className={styles.summaryRow}>
                <span>Discount ({appliedCoupon})</span>
                <span>Applied at order time</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Delivery Fee</span>
              <span>{shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
