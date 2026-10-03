import { ShieldCheck } from 'lucide-react';
import styles from './privacy.module.css';

export const metadata = {
  title: 'Privacy Policy — Lets Organic',
  description:
    'How Lets Organic collects, uses, and protects your personal data. Cash on Delivery means we never store payment information.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <ShieldCheck size={14} /> Your Privacy
          </span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>
            We collect only what we need to run the store — and we never sell your data.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.policyCard}>
            <p className={styles.updated}>Last updated: October 2026</p>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>1. What data we collect</h2>
              <p className={styles.policyText}>
                When you shop with Lets Organic, we collect the minimum information needed to
                fulfil your order and run the store:
              </p>
              <ul className={styles.policyList}>
                <li>
                  <strong>Order details:</strong> your name, phone number, email address, and
                  delivery address — used to confirm, pack, and deliver your order.
                </li>
                <li>
                  <strong>Product reviews:</strong> your name, email, rating, and review text if you
                  leave feedback on a product. Reviews are published only after our team approves them.
                </li>
                <li>
                  <strong>Contact messages:</strong> the details you share when you write to us
                  through the contact form, so we can respond.
                </li>
                <li>
                  <strong>Newsletter subscriptions:</strong> your email address, only if you choose
                  to subscribe. You can unsubscribe at any time.
                </li>
              </ul>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>2. Payment data</h2>
              <p className={styles.policyText}>
                We operate on <strong>Cash on Delivery only</strong>. We do not process online
                payments, and we never collect, store, or see your bank or card details. There is
                simply no payment data for us to hold.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>3. How we use your data</h2>
              <p className={styles.policyText}>Your information is used only to:</p>
              <ul className={styles.policyList}>
                <li>Confirm your order by phone and deliver it to your address</li>
                <li>Handle returns, refunds, and customer support requests</li>
                <li>Send the newsletter, only if you subscribed</li>
                <li>Improve our store, products, and service</li>
              </ul>
              <p className={styles.policyText}>
                We do not sell, rent, or trade your personal data to anyone. We share it only with
                the courier partners needed to deliver your order, and only the delivery details
                they require.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>4. Cookies</h2>
              <p className={styles.policyText}>
                Our store uses a small number of essential cookies to keep your cart and wishlist
                working as you browse. We don&rsquo;t use advertising trackers or sell browsing data.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>5. Data security & retention</h2>
              <p className={styles.policyText}>
                Access to customer data is limited to our small team and protected by secure,
                authenticated systems. We keep order records only as long as needed for fulfilment,
                returns, and legal accounting requirements, then remove them.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>6. Your rights</h2>
              <p className={styles.policyText}>
                You can ask us at any time to see, correct, or delete the personal data we hold
                about you — including unsubscribing from the newsletter. Write to us at{' '}
                <a href="mailto:admin@letsorganic.store" className={styles.link}>
                  admin@letsorganic.store
                </a>{' '}
                or through our{' '}
                <a href="/contact" className={styles.link}>
                  contact page
                </a>
                , and we&rsquo;ll respond within a few working days.
              </p>
            </div>

            <div className={styles.policySection}>
              <h2 className={styles.policySectionTitle}>7. Changes to this policy</h2>
              <p className={styles.policyText}>
                If we change how we handle your data, we&rsquo;ll update this page and the date
                above. Continued use of the store after changes means you accept the updated policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
