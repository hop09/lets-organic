'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, ArrowRight, Leaf, Heart, Package } from 'lucide-react';
import styles from './thankyou.module.css';

const confettiColors = ['#5B7553', '#C8956C', '#E8F0E5', '#F5E6D8', '#3F5238', '#A87450', '#E8A634'];

function ConfettiPiece({ index }) {
  const style = {
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${3 + Math.random() * 4}s`,
    backgroundColor: confettiColors[index % confettiColors.length],
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  };

  return <div className={styles.confettiPiece} style={style} />;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={styles.thankYouPage}>
      {/* Confetti */}
      {mounted && (
        <div className={styles.confetti}>
          {[...Array(50)].map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      <div className={styles.content}>
        {/* Success Icon */}
        <div className={styles.iconWrap}>
          <div className={styles.iconCircle}>
            <CheckCircle size={48} className={styles.checkIcon} />
          </div>
          <div className={styles.iconRing} />
          <div className={styles.iconRing2} />
        </div>

        <h1 className={styles.title}>Thank You!</h1>
        <p className={styles.subtitle}>Your order has been placed successfully</p>

        {orderNumber && (
          <div className={styles.orderNumberBox}>
            <Package size={20} />
            <div>
              <p className={styles.orderNumberLabel}>Your order number</p>
              <p className={styles.orderNumberValue}>{orderNumber}</p>
            </div>
          </div>
        )}

        <div className={styles.messageBox}>
          <Leaf size={20} className={styles.messageIcon} />
          <div>
            <p className={styles.messageTitle}>Order Received — Cash on Delivery</p>
            <p className={styles.messageText}>
              We&apos;ve received your order. We&apos;ll call you shortly to confirm it before dispatch.
              Please keep your phone nearby and have the exact amount ready when your order arrives.
            </p>
          </div>
        </div>

        <div className={styles.thankNote}>
          <Heart size={16} className={styles.heartIcon} />
          <p>Thank you for choosing organic. Every purchase you make supports sustainable farming and a healthier planet.</p>
        </div>

        <div className={styles.actions}>
          <Link href="/shop" className="btn btn-primary btn-lg">
            <ShoppingBag size={18} />
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
          <Link href="/" className="btn btn-secondary btn-lg">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.thankYouPage}>
          <div className={styles.content}>
            <h1 className={styles.title}>Thank You!</h1>
            <p className={styles.subtitle}>Loading your order confirmation...</p>
          </div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
