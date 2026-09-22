'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import styles from './cart.module.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { settings } = useSettings();

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <ShoppingBag size={64} strokeWidth={1} className={styles.emptyIcon} />
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven&apos;t added any organic goodness yet.</p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          <ArrowLeft size={18} />
          Start Shopping
        </Link>
      </div>
    );
  }

  // Shipping calculation based on admin controls
  const isFreeDelivery = settings?.shipping?.freeDelivery ?? false;
  const deliveryFee = settings?.shipping?.deliveryFee ?? 250;
  const threshold = settings?.shipping?.freeDeliveryThreshold ?? 2500;

  const shipping = isFreeDelivery ? 0 : (threshold > 0 && totalPrice >= threshold ? 0 : deliveryFee);
  const total = totalPrice + shipping;

  return (
    <div className={styles.cartPage}>
      <div className="container-wide">
        <h1 className={styles.title}>Shopping Cart</h1>
        <p className={styles.subtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>

        <div className={styles.cartLayout}>
          {/* Items */}
          <div className={styles.cartItems}>
            {/* Table Header */}
            <div className={styles.tableHeader}>
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span></span>
            </div>

            {items.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemProduct}>
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&fit=crop'} alt={item.name} className={styles.itemImage} />
                  <div>
                    <Link href={`/product/${item.slug}`} className={styles.itemName}>
                      {item.name}
                    </Link>
                    <p className={styles.itemCategory}>{item.category}</p>
                  </div>
                </div>
                <div className={styles.itemPrice}>
                  PKR {Number(item.price).toLocaleString()}
                </div>
                <div className={styles.itemQuantity}>
                  <div className={styles.quantity}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.itemTotal}>
                  PKR {Number(item.price * item.quantity).toLocaleString()}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className={styles.cartActions}>
              <Link href="/shop" className="btn btn-secondary">
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className={styles.cartSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>PKR {Number(totalPrice).toLocaleString()}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span>{shipping === 0 ? 'FREE' : `PKR ${Number(shipping).toLocaleString()}`}</span>
            </div>
            {shipping > 0 && threshold > totalPrice && (
              <p className={styles.shippingNote}>
                Add PKR {Number(threshold - totalPrice).toLocaleString()} more for free nationwide delivery!
              </p>
            )}
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>PKR {Number(total).toLocaleString()}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Proceed to Checkout
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
