import Link from 'next/link';
import { Truck, Banknote, Timer, PhoneCall, PackageCheck, CheckCircle2 } from 'lucide-react';
import styles from './shipping.module.css';

export const metadata = {
  title: 'Shipping & Delivery — Lets Organic',
  description:
    'Cash on Delivery across Pakistan. Standard delivery PKR 250, free delivery on orders over PKR 2500. Typical delivery in 2–4 working days.',
};

const highlights = [
  { icon: Banknote, value: 'Cash on Delivery', label: 'Pay in cash when your order arrives — no card needed' },
  { icon: Truck, value: 'PKR 250', label: 'Flat standard delivery fee, anywhere in Pakistan' },
  { icon: PackageCheck, value: 'Free over PKR 2,500', label: 'Orders above PKR 2,500 ship free, nationwide' },
  { icon: Timer, value: '2–4 working days', label: 'Typical delivery time after order confirmation' },
];

export default function ShippingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <Truck size={14} /> Shipping & Delivery
          </span>
          <h1 className={styles.title}>Delivered Across Pakistan, Paid at Your Door</h1>
          <p className={styles.subtitle}>
            We ship nationwide with Cash on Delivery. Here&rsquo;s exactly what to expect —
            no surprises, no hidden fees.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.highlightGrid}>
            {highlights.map((h) => (
              <div key={h.value} className={styles.highlightCard}>
                <span className={styles.highlightIcon}>
                  <h.icon size={24} />
                </span>
                <p className={styles.highlightValue}>{h.value}</p>
                <p className={styles.highlightLabel}>{h.label}</p>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionCardTitle}>
                <Banknote size={20} /> Payment — Cash on Delivery
              </h2>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    We currently accept <strong>Cash on Delivery (COD) only</strong>. Pay the exact
                    order total in cash when your parcel arrives.
                  </span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    No advance payment, no bank transfers, no card details — you never share any
                    payment information with us.
                  </span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    Please keep the exact amount ready for the courier to make handover smooth.
                  </span>
                </li>
              </ul>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionCardTitle}>
                <PhoneCall size={20} /> Order confirmation call
              </h2>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    Every order is confirmed with a quick <strong>phone call</strong> before dispatch —
                    we verify your items and delivery address with you.
                  </span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    If we can&rsquo;t reach you after a couple of attempts, your order is put on hold
                    and you&rsquo;ll be notified by SMS.
                  </span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} />
                  <span>
                    Please keep your phone nearby after placing an order so we can confirm it quickly.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionCardTitle}>
              <Timer size={20} /> Processing & delivery times
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Processing:</strong> 1–2 working days after your order is confirmed by phone.
                  Orders are packed with care to protect natural products during transit.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Delivery:</strong> typically 2–4 working days after dispatch for most cities
                  in Pakistan. Remote areas may take a little longer.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Working days:</strong> Monday–Saturday. Orders placed on Sunday or public
                  holidays are processed the next working day.
                </span>
              </li>
            </ul>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionCardTitle}>
              <Truck size={20} /> Delivery fees
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Standard delivery:</strong> flat PKR 250 per order, anywhere in Pakistan.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>Free delivery:</strong> all orders with a subtotal of PKR 2,500 or more ship
                  free — automatically applied at checkout.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} />
                <span>
                  The delivery fee is added to your COD total, so the amount you pay the courier is
                  always shown clearly before you confirm.
                </span>
              </li>
            </ul>
          </div>

          <p className={styles.note}>
            <strong>Changed your mind?</strong> If your order hasn&rsquo;t shipped yet, just{' '}
            <Link href="/contact" className={styles.link}>
              contact us
            </Link>{' '}
            and we&rsquo;ll update or cancel it at no charge. Once delivered, our{' '}
            <Link href="/returns" className={styles.link}>
              7-day return policy
            </Link>{' '}
            has you covered.
          </p>
        </div>
      </section>
    </div>
  );
}
