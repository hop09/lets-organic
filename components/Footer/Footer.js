'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import styles from './Footer.module.css';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
);

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSettings();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', text: '' });
  const [newsletterSending, setNewsletterSending] = useState(false);

  // Hide footer on hidden admin panel
  if (pathname?.startsWith('/console-gate-4527')) {
    return null;
  }

  const siteName = settings?.siteName || settings?.logoText || 'Lets Organic';
  const email = settings?.contactEmail || 'admin@letsorganic.store';
  const phone = settings?.contactPhone || '+92 300 1234567';
  const address = settings?.contactAddress || 'Lets Organic Hub, Lahore, Pakistan';

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (newsletterSending) return;

    const trimmed = newsletterEmail.trim();
    if (!trimmed) {
      setNewsletterStatus({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setNewsletterSending(true);
    setNewsletterStatus({ type: '', text: '' });
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewsletterStatus({
          type: 'success',
          text: data.alreadySubscribed
            ? 'You are already subscribed — thank you!'
            : 'Subscribed! Welcome to the Lets Organic community.',
        });
        setNewsletterEmail('');
      } else {
        setNewsletterStatus({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      setNewsletterStatus({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setNewsletterSending(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className="container-wide">
          <div className={styles.footerGrid}>
            {/* Brand */}
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.footerLogo}>
                <Leaf size={22} />
                <span>{siteName}</span>
              </Link>
              <p className={styles.footerDesc}>
                Your trusted destination for premium organic products. We believe in pure, sustainable living that&apos;s kind to your body and our planet.
              </p>
              <div className={styles.socials}>
                <a href="#" className={styles.socialLink} aria-label="Instagram"><InstagramIcon /></a>
                <a href="#" className={styles.socialLink} aria-label="Facebook"><FacebookIcon /></a>
                <a href="#" className={styles.socialLink} aria-label="Twitter"><TwitterIcon /></a>
                <a href="#" className={styles.socialLink} aria-label="YouTube"><YoutubeIcon /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/shop">Shop All</Link></li>
                <li><Link href="/shop?category=skincare">Skincare</Link></li>
                <li><Link href="/shop?category=superfoods">Superfoods</Link></li>
                <li><Link href="/shop?category=wellness">Wellness</Link></li>
                <li><Link href="/shop?category=essentials">Essential Oils</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Help</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/shipping">Shipping Info</Link></li>
                <li><Link href="/returns">Returns & Refunds</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Contact</h4>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <Mail size={16} />
                  <span>{email}</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={16} />
                  <span>{phone}</span>
                </div>
                <div className={styles.contactItem}>
                  <MapPin size={16} />
                  <span>{address}</span>
                </div>
              </div>

              {/* Newsletter */}
              <div className={styles.newsletter}>
                <p className={styles.newsletterLabel}>Subscribe to updates</p>
                <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder="Your email"
                    className={styles.newsletterInput}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    aria-label="Email for newsletter"
                    maxLength={254}
                  />
                  <button type="submit" className={styles.newsletterBtn} aria-label="Subscribe" disabled={newsletterSending}>
                    <ArrowRight size={18} />
                  </button>
                </form>
                {newsletterStatus.text && (
                  <p className={`${styles.newsletterStatus} ${newsletterStatus.type === 'error' ? styles.newsletterStatusError : ''}`}>
                    {newsletterStatus.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className="container-wide">
          <div className={styles.footerBottomInner}>
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className={styles.footerBottomLinks}>
              <Link href="/privacy">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/privacy">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
