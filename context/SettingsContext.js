'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DEFAULT_SETTINGS = {
  siteName: 'Lets Organic',
  tagline: 'Pure Organic Living',
  logoText: 'Lets Organic',
  logoImageUrl: '',
  faviconUrl: '/favicon.svg',
  currency: 'PKR',
  heroBadge: 'Pure Organic Living',
  heroTitle: "Discover Nature's Best Kept Secrets",
  heroSubtitle: 'Shop curated organic skincare, superfoods, and wellness products — handpicked for a naturally beautiful, sustainable lifestyle.',
  heroProductId: '',
  announcements: [
    'Free Delivery Across Pakistan on Orders Over PKR 2,500',
    '100% Certified Pure Organic & Non-GMO',
    'Special Offer: Use code ORGANIC25 for 25% off',
    'Direct from Ethical Sustainable Organic Farms',
  ],
  contactEmail: 'admin@letsorganic.store',
  contactPhone: '+92 300 1234567',
  contactAddress: 'Lets Organic Hub, Lahore, Pakistan',
  shipping: {
    freeDelivery: false,
    deliveryFee: 250,
    freeDeliveryThreshold: 2500,
  },
  promotionBanner: {
    enabled: true,
    badge: 'Seasonal Harvest Offer',
    headline: 'Experience Nature at Its Purest — 25% Off',
    subheadline: 'Handcrafted organic serums, cold-pressed botanicals & pure superfoods. Limited time offer.',
    couponCode: 'ORGANIC25',
    buttonText: 'Claim 25% Off',
    buttonLink: '/shop',
    bgColor: '#5B7553',
    textColor: '#FFFFFF',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&fit=crop',
  },
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('Using default settings fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Dynamically update document title and favicon if client-side
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (settings.siteName) {
        document.title = `${settings.siteName} — ${settings.tagline || 'Pure Organic Living'}`;
      }
      if (settings.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.faviconUrl;
      }
    }
  }, [settings.siteName, settings.tagline, settings.faviconUrl]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
