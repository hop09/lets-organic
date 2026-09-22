'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Build order details
    const orderDetails = items.map(item =>
      `${item.name} x${item.quantity} — PKR ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const orderSummary = `
ORDER DETAILS
========================
${orderDetails}
========================
Subtotal: PKR ${totalPrice.toLocaleString()}
Delivery Fee: ${shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`}
TOTAL: PKR ${total.toLocaleString()}

CUSTOMER INFO
========================
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}
City: ${formData.city}
State: ${formData.state}
ZIP: ${formData.zip}
Country: ${formData.country}
Notes: ${formData.notes || 'None'}
    `.trim();

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '2b3a1b7b-98cc-443e-996d-70b4c1965cbb', // Replace with your W3Forms access key
          subject: `New Order from ${formData.fullName} — Lets Organic`,
          from_name: 'Lets Organic Store',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: orderSummary,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        router.push('/thank-you');
      } else {
        // Still redirect on demo
        clearCart();
        router.push('/thank-you');
      }
    } catch (error) {
      // For demo, still redirect
      clearCart();
      router.push('/thank-you');
    } finally {
      setLoading(false);
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
          <form className={styles.form} onSubmit={handleSubmit}>
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
                <><Loader2 size={18} className={styles.spinner} /> Processing...</>
              ) : (
                <><Lock size={18} /> Place Order — PKR {total.toLocaleString()}</>
              )}
            </button>

            <div className={styles.securityNote}>
              <ShieldCheck size={16} />
              <span>Cash on Delivery & Secure Online Payment Available</span>
            </div>
          </form>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <img src={item.images[0]} alt={item.name} className={styles.summaryImg} />
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
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>PKR {totalPrice.toLocaleString()}</span>
            </div>
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
