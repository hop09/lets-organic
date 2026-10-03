'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, MessagesSquare, Send } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import styles from './contact.module.css';

export default function ContactPage() {
  const { settings } = useSettings();

  const email = settings?.contactEmail || 'admin@letsorganic.store';
  const phone = settings?.contactPhone || '+92 300 1234567';
  const address = settings?.contactAddress || 'Lets Organic Hub, Lahore, Pakistan';

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Please fill in your name, email, and message.' });
      return;
    }

    setSending(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          type: 'success',
          text: 'Thank you! Your message has been sent. Our team will get back to you within 1–2 working days.',
        });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container-wide">
          <span className={styles.badge}>
            <MessagesSquare size={14} /> Get in Touch
          </span>
          <h1 className={styles.title}>We&rsquo;d Love to Hear From You</h1>
          <p className={styles.subtitle}>
            Questions about a product, your order, or anything else? Send us a message —
            a real person from our Lahore team will reply.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container-wide">
          <div className={styles.grid}>
            <aside className={styles.infoCard}>
              <h2 className={styles.infoTitle}>Contact Information</h2>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>
                  <Mail size={18} />
                </span>
                <div>
                  <p className={styles.infoLabel}>Email</p>
                  <p className={styles.infoValue}>{email}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>
                  <Phone size={18} />
                </span>
                <div>
                  <p className={styles.infoLabel}>Phone / WhatsApp</p>
                  <p className={styles.infoValue}>{phone}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>
                  <MapPin size={18} />
                </span>
                <div>
                  <p className={styles.infoLabel}>Address</p>
                  <p className={styles.infoValue}>{address}</p>
                </div>
              </div>

              <p className={styles.infoNote}>
                We confirm every order with a quick phone call before dispatch, so please keep your
                phone nearby after placing an order.
              </p>
            </aside>

            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Send us a message</h2>
              <p className={styles.formSubtitle}>
                We usually reply within 1–2 working days (Monday–Saturday).
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="contact-name">
                      Your Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      className="input"
                      placeholder="e.g. Ayesha Khan"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="contact-email">
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      maxLength={254}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="contact-phone">
                      Phone (optional)
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      className="input"
                      placeholder="03xx xxxxxxx"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={30}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="contact-subject">
                      Subject (optional)
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      className="input"
                      placeholder="e.g. Question about my order"
                      value={form.subject}
                      onChange={handleChange}
                      maxLength={150}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="contact-message">
                      Message <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      className="input"
                      rows={6}
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={handleChange}
                      maxLength={3000}
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
                    <Send size={18} />
                    {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>

                {status.text && (
                  <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
                    {status.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
