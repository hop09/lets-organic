import Link from 'next/link';
import { Undo2, MessageCircle, PackageSearch, Banknote, CheckCircle2, XCircle } from 'lucide-react';
import styles from './returns.module.css';

export const metadata = {
  title: 'Returns & Refunds — Lets Organic',
  description:
    'Our 7-day easy return policy: unused and unopened products returned within 7 days of delivery, with refunds via bank transfer.',
};

const steps = [
  {
    icon: MessageCircle,
    title: 'Reach out',
    text: 'Contact us within 7 days of delivery with your order number and the reason for return.',
  },
  {
    icon: PackageSearch,
    title: 'We arrange pickup',
    text: 'Our team schedules a courier pickup from your address — no need to visit a post office.',
  },
  {
    icon: CheckCircle2,
    title: 'Quality check',
    text: 'Returned items are inspected to confirm they are unused and unopened.',
  },
  {
    icon: Banknote,
    title: 'Refund issued',
    text: 'Approved refunds are sent via bank transfer within 5–7 working days.',
  },
];

export default function ReturnsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <Undo2 size={14} /> Returns & Refunds
          </span>
          <h1 className={styles.title}>7-Day Easy Returns</h1>
          <p className={styles.subtitle}>
            Changed your mind? No stress. Return any unused, unopened product within 7 days of
            delivery for a full refund.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={s.title} className={styles.stepCard}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepIcon}>
                  <s.icon size={22} />
                </span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>

          <div className={styles.twoCol}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionCardTitle}>
                <CheckCircle2 size={20} /> Eligible for return
              </h2>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} className={styles.ok} />
                  <span>Unused and unopened products in their original packaging</span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} className={styles.ok} />
                  <span>Returned within 7 days of the delivery date</span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} className={styles.ok} />
                  <span>Wrong or damaged item received — we&rsquo;ll fix it at our cost</span>
                </li>
                <li className={styles.listItem}>
                  <CheckCircle2 size={16} className={styles.ok} />
                  <span>Factory-sealed supplements, oils, and skincare in resellable condition</span>
                </li>
              </ul>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionCardTitle}>
                <XCircle size={20} /> Not eligible
              </h2>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <XCircle size={16} className={styles.no} />
                  <span>Products that have been opened or used, for hygiene and safety reasons</span>
                </li>
                <li className={styles.listItem}>
                  <XCircle size={16} className={styles.no} />
                  <span>Items returned after the 7-day window has passed</span>
                </li>
                <li className={styles.listItem}>
                  <XCircle size={16} className={styles.no} />
                  <span>Products damaged by misuse or improper storage after delivery</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.sectionCard} style={{ marginBottom: 'var(--space-lg)' }}>
            <h2 className={styles.sectionCardTitle}>
              <Banknote size={20} /> How refunds work
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} className={styles.ok} />
                <span>
                  Since we operate on <strong>Cash on Delivery</strong>, refunds are issued via{' '}
                  <strong>bank transfer</strong> to the account you nominate.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} className={styles.ok} />
                <span>
                  Refunds are processed within <strong>5–7 working days</strong> after your returned
                  items pass inspection.
                </span>
              </li>
              <li className={styles.listItem}>
                <CheckCircle2 size={16} className={styles.ok} />
                <span>
                  If we sent the wrong or a damaged item, return shipping is on us — you pay nothing.
                </span>
              </li>
            </ul>
          </div>

          <p className={styles.note}>
            <strong>Ready to start a return?</strong> Reach out through our{' '}
            <Link href="/contact" className={styles.link}>
              contact page
            </Link>{' '}
            with your order number and a photo of the item (if damaged). We&rsquo;ll take it from there.
          </p>
        </div>
      </section>
    </div>
  );
}
