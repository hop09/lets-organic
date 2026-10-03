import { Leaf, HeartHandshake, Sprout } from 'lucide-react';
import styles from './about.module.css';

export const metadata = {
  title: 'About Us — Lets Organic',
  description:
    'Learn the story behind Lets Organic: a Pakistan-based store for honest organic skincare, superfoods, and wellness essentials, ethically sourced and delivered nationwide.',
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <Leaf size={14} /> Our Story
          </span>
          <h1 className={styles.title}>Rooted in Nature, Grown in Pakistan</h1>
          <p className={styles.subtitle}>
            Lets Organic began with a simple question: why is it so hard to find skincare and food
            you can actually trust? We built the store we wished existed — honest, organic,
            and made for real life.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.storyGrid}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Why we started</h2>
              <p className={styles.cardText}>
                Walk into most stores and the shelves are full of products promising &ldquo;natural&rdquo;
                on the label but hiding long chemical ingredient lists on the back. We wanted better
                for ourselves and our families — so Lets Organic was born in Lahore as a small,
                carefully curated shop for organic skincare, superfoods, and everyday wellness.
              </p>
              <p className={styles.cardText}>
                Every product we list is chosen the way we would choose for our own homes: simple
                ingredients, transparent sourcing, and no inflated claims. If we wouldn&rsquo;t use it
                ourselves, we won&rsquo;t sell it.
              </p>
            </div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>How we choose our products</h2>
              <p className={styles.cardText}>
                We work with growers, makers, and suppliers who share our standards — people who
                farm responsibly, harvest thoughtfully, and can tell us exactly what goes into
                every jar, bottle, and packet. We favour cold-pressed oils, raw botanicals, and
                minimally processed foods that keep nature&rsquo;s goodness intact.
              </p>
              <p className={styles.cardText}>
                We keep our range deliberately focused. Rather than a thousand options of varying
                quality, you get a tight edit of products we genuinely stand behind — and a team
                that will answer your questions honestly.
              </p>
            </div>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>
                <Leaf size={24} />
              </span>
              <h3 className={styles.valueTitle}>Pure by default</h3>
              <p className={styles.valueText}>
                No harsh chemicals, no hidden additives, no misleading labels. What you read on the
                ingredient list is what you get.
              </p>
            </div>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>
                <HeartHandshake size={24} />
              </span>
              <h3 className={styles.valueTitle}>Ethically sourced</h3>
              <p className={styles.valueText}>
                We buy from farmers and producers who are paid fairly and farm in ways that protect
                the soil, the water, and the people who grow your food and botanicals.
              </p>
            </div>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>
                <Sprout size={24} />
              </span>
              <h3 className={styles.valueTitle}>Made for Pakistan</h3>
              <p className={styles.valueText}>
                We&rsquo;re based in Lahore and deliver nationwide with Cash on Delivery — because
                shopping organic shouldn&rsquo;t require a credit card or a big-city address.
              </p>
            </div>
          </div>

          <div className={styles.promise}>
            <h2 className={styles.promiseTitle}>Our promise to you</h2>
            <p className={styles.promiseText}>
              Shop with confidence: fair prices in PKR, honest product descriptions, 7-day easy
              returns, and a real human on the other end of every message. If something isn&rsquo;t
              right, tell us — we&rsquo;ll make it right.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
