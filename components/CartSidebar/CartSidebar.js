'use client';

import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import styles from './CartSidebar.module.css';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <ShoppingBag size={20} />
            <h3>Your Cart ({totalItems})</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close cart">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingBag size={48} strokeWidth={1} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptyText}>Add some organic goodness!</p>
            <button className="btn btn-primary" onClick={() => setIsOpen(false)}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map(item => (
                <div key={item.id} className={styles.item}>
                  <img src={item.images[0]} alt={item.name} className={styles.itemImage} />
                  <div className={styles.itemInfo}>
                    <Link
                      href={`/product/${item.slug}`}
                      className={styles.itemName}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <p className={styles.itemPrice}>PKR {Number(item.price).toLocaleString()}</p>
                    <div className={styles.itemControls}>
                      <div className={styles.quantity}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span className={styles.subtotalPrice}>PKR {Number(totalPrice).toLocaleString()}</span>
              </div>
              <p className={styles.shippingNote}>Shipping calculated at checkout</p>
              <Link
                href="/cart"
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                className="btn btn-primary"
                onClick={() => setIsOpen(false)}
                style={{ width: '100%' }}
              >
                Checkout
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
