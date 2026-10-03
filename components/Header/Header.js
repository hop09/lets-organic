'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Leaf,
  Truck,
  Sparkles,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import SafeImage from '@/components/SafeImage/SafeImage';
import styles from './Header.module.css';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/shop', hasDropdown: true },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Track Order', href: '/track' },
];

const categoryLinks = [
  { label: 'Skincare', href: '/shop?category=skincare' },
  { label: 'Superfoods', href: '/shop?category=superfoods' },
  { label: 'Wellness', href: '/shop?category=wellness' },
  { label: 'Home & Living', href: '/shop?category=home' },
  { label: 'Hair Care', href: '/shop?category=haircare' },
  { label: 'Essential Oils', href: '/shop?category=essentials' },
];

const defaultAnnouncements = [
  { icon: Truck, text: 'Free Nationwide Shipping on Orders Over PKR 2,500' },
  { icon: Sparkles, text: 'New Arrivals — Fresh Organic Collection' },
  { icon: Percent, text: 'Special Offer: Code ORGANIC25 for 25% Off' },
  { icon: Leaf, text: '100% Certified Organic & Non-GMO' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSearched, setSearchSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { settings } = useSettings();

  const liveCategoryLinks = settings?.categories?.length
    ? settings.categories.map(c => ({ label: c.name, href: `/shop?category=${c.slug || c.id}` }))
    : categoryLinks;

  // Close menus when navigation changes. Done during render (not in an
  // effect) via the "adjust state when props change" pattern so there is no
  // post-commit cascading render.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setDropdownOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Live product search against the database (debounced ~300ms, min 2 chars).
  // All state updates happen inside async callbacks, never synchronously in the effect body.
  useEffect(() => {
    const query = searchQuery.trim();
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        setSearchSearched(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.success && Array.isArray(data.products) ? data.products : []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Live search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
        setSearchSearched(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Completely hide header on hidden admin console
  if (pathname?.startsWith('/console-gate-4527')) {
    return null;
  }

  const siteName = settings?.siteName || settings?.logoText || 'Lets Organic';

  const dynamicDefaultAnnouncements = [
    {
      icon: Truck,
      text: settings?.shipping?.freeDelivery
        ? 'Free Nationwide Delivery on All Orders'
        : `Free Nationwide Shipping on Orders Over PKR ${Number(settings?.shipping?.freeDeliveryThreshold || 2500).toLocaleString()}`,
    },
    { icon: Sparkles, text: 'New Arrivals — Fresh Organic Collection' },
    { icon: Percent, text: 'Special Offer: Code ORGANIC25 for 25% Off' },
    { icon: Leaf, text: '100% Certified Organic & Non-GMO' },
  ];

  const announcementList = settings?.announcements?.length > 0
    ? settings.announcements.map((text, i) => ({
        icon: [Truck, Sparkles, Percent, Leaf][i % 4],
        text,
      }))
    : dynamicDefaultAnnouncements;


  return (
    <>
      {/* Announcement Bar */}
      <div className={styles.announcement}>
        <div className={styles.announcementTrack}>
          {[...announcementList, ...announcementList].map((item, i) => (
            <span key={i} className={styles.announcementItem}>
              <item.icon size={14} />
              {item.text}
              <span className={styles.announcementDot}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Header */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>
          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Leaf className={styles.logoIcon} size={24} />
            <span className={styles.logoText}>{siteName}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav}>
            {navLinks.map(link => (
              <div
                key={link.label}
                className={styles.navItemWrapper}
                onMouseEnter={() => link.hasDropdown && setDropdownOpen(true)}
                onMouseLeave={() => link.hasDropdown && setDropdownOpen(false)}
              >
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={14} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />}
                </Link>
                {link.hasDropdown && dropdownOpen && (
                  <div className={styles.dropdown}>
                    {liveCategoryLinks.map(cat => (
                      <Link key={cat.label} href={cat.href} className={styles.dropdownItem}>
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Header Actions */}
          <div className={styles.actions}>
            {/* Search Trigger */}
            <button
              className={styles.actionBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className={styles.actionBtn} aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
            </Link>

            {/* Cart Button */}
            <button
              className={`${styles.actionBtn} ${styles.cartBtn}`}
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>

        {/* Search Drawer */}
        {searchOpen && (
          <div className={styles.searchBar}>
            <div className={styles.searchInner}>
              <Search size={18} className={styles.searchBarIcon} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search organic products..."
                className={styles.searchInput}
              />
              <button
                className={styles.searchClose}
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className={styles.searchResults}>
                {searchLoading ? (
                  <p className={styles.searchNoResults}>Searching products…</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(p => (
                    <Link
                      key={p._id || p.id}
                      href={`/product/${p.slug}`}
                      className={styles.searchResultItem}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    >
                      <SafeImage
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&fit=crop'}
                        alt={p.name}
                        className={styles.searchResultImg}
                        width={48}
                        height={48}
                      />
                      <div>
                        <p className={styles.searchResultName}>{p.name}</p>
                        <span className={styles.searchResultPrice}>PKR {Number(p.price).toLocaleString()}</span>
                      </div>
                    </Link>
                  ))
                ) : searchSearched ? (
                  <p className={styles.searchNoResults}>No products found for “{searchQuery.trim()}”</p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <nav className={styles.mobileMenu} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileHeader}>
              <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
                <Leaf className={styles.logoIcon} size={22} />
                <span className={styles.logoText}>{siteName}</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>
            <div className={styles.mobileLinks}>
              {navLinks.filter(l => !l.hasDropdown).map(link => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className={styles.mobileCategoryHeader}>Categories</div>
              {liveCategoryLinks.map(cat => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={styles.mobileCategoryLink}
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
