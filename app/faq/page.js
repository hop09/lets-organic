'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';
import styles from './faq.module.css';

const FAQS = [
  {
    q: 'How do I place an order?',
    a: (
      <>
        <p>
          Browse the <Link href="/shop">shop</Link>, add products to your cart, and head to checkout.
          Fill in your name, phone number, and delivery address, then confirm — that&rsquo;s it. No
          account or advance payment needed.
        </p>
        <p>
          After you order, we&rsquo;ll call you to confirm your items and address before dispatching
          your parcel.
        </p>
      </>
    ),
  },
  {
    q: 'Is Cash on Delivery (COD) available?',
    a: (
      <p>
        Yes — Cash on Delivery is our only payment method right now, and it&rsquo;s available
        nationwide across Pakistan. You pay in cash when your order arrives. We never ask for card
        details or advance payments.
      </p>
    ),
  },
  {
    q: 'How long does delivery take, and what does it cost?',
    a: (
      <>
        <p>
          Orders are processed within 1–2 working days after phone confirmation, and delivery
          typically takes 2–4 working days after dispatch.
        </p>
        <p>
          Standard delivery costs a flat <strong>PKR 250</strong> anywhere in Pakistan — and orders
          with a subtotal of <strong>PKR 2,500 or more ship free</strong>. See our{' '}
          <Link href="/shipping">shipping page</Link> for full details.
        </p>
      </>
    ),
  },
  {
    q: 'What is your return policy?',
    a: (
      <p>
        We offer <strong>7-day easy returns</strong>. If a product is unused and unopened, you can
        return it within 7 days of delivery for a full refund (issued via bank transfer). Start a
        return through our <Link href="/contact">contact page</Link> — full details are on our{' '}
        <Link href="/returns">returns page</Link>.
      </p>
    ),
  },
  {
    q: 'Are your products really organic?',
    a: (
      <>
        <p>
          Yes. We curate products made with genuinely organic ingredients — no harsh chemicals, no
          hidden additives, no misleading labels. We work with growers and makers who farm
          responsibly and can tell us exactly what goes into every product.
        </p>
        <p>
          We don&rsquo;t make claims we can&rsquo;t stand behind: if a product says organic on our
          store, it&rsquo;s because we&rsquo;ve vetted its ingredients and sourcing ourselves.
        </p>
      </>
    ),
  },
  {
    q: 'How do I use a discount code?',
    a: (
      <>
        <p>
          It&rsquo;s easy: add items to your cart and go to checkout. You&rsquo;ll see a{' '}
          <strong>&ldquo;Discount code&rdquo;</strong> field — enter your code (for example{' '}
          <strong>ORGANIC25</strong>) and click Apply. The discount is applied to your order total
          instantly.
        </p>
        <p>
          Codes may have a minimum order value or expiry date, which we&rsquo;ll show if a code
          doesn&rsquo;t apply.
        </p>
      </>
    ),
  },
  {
    q: 'Do I need an account to shop?',
    a: (
      <p>
        No. You can check out as a guest with just your name, phone number, and delivery address.
        We keep checkout simple on purpose.
      </p>
    ),
  },
  {
    q: 'Which areas do you deliver to?',
    a: (
      <p>
        We deliver <strong>nationwide across Pakistan</strong> — every city and town our courier
        partners serve. Remote areas may take a day or two longer than the usual 2–4 working days.
      </p>
    ),
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <HelpCircle size={14} /> Help Center
          </span>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          <p className={styles.subtitle}>
            Everything you need to know about ordering, delivery, payments, and returns.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.faqList}>
            {FAQS.map((item, i) => {
              const open = openIndex === i;
              return (
                <div key={item.q} className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenIndex(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    <span>{item.q}</span>
                    <span className={styles.faqChevron}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {open && <div className={styles.faqAnswer}>{item.a}</div>}
                </div>
              );
            })}
          </div>

          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>Still have a question?</h2>
            <p className={styles.ctaText}>
              We&rsquo;re happy to help — reach out and our team will get back to you within 1–2
              working days.
            </p>
            <Link href="/contact" className="btn btn-primary btn-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
