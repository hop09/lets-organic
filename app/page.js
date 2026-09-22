'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Leaf,
  Timer,
  Sparkles,
  ShoppingBag,
  Star,
  Eye,
  Check,
  Copy,
  Tag,
  Percent,
  Minus,
  Plus,
  Zap,
  Heart,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard/ProductCard';
import { products as fallbackProducts, categories } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import styles from './page.module.css';

const trustBadges = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheck, title: 'Organic Certified', desc: '100% certified products' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
];

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

export default function HomePage() {
  const { addItem } = useCart();
  const { settings } = useSettings();

  // Real-time products from MongoDB Atlas
  const [productsList, setProductsList] = useState(fallbackProducts);
  const [copiedCode, setCopiedCode] = useState(false);
  const [heroAdded, setHeroAdded] = useState(false);

  // Carousel scroll state
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch real-time products from database
  useEffect(() => {
    async function loadDatabaseProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.products?.length > 0) {
            setProductsList(data.products);
          }
        }
      } catch (err) {
        console.warn('Using fallback products data:', err);
      }
    }
    loadDatabaseProducts();
  }, []);

  // Compute Hero Product: explicit hero flag, or first product with highest rating
  const heroProduct = useMemo(() => {
    return productsList.find(p => p.isHero) || productsList[0] || fallbackProducts[0];
  }, [productsList]);

  // Filtered collections
  const newArrivals = useMemo(() => {
    const filtered = productsList.filter(p => p.badge === 'New' || p.isNewArrival);
    return filtered.length > 0 ? filtered : productsList.slice(0, 6);
  }, [productsList]);

  const bestSellers = useMemo(() => {
    const filtered = productsList.filter(p => p.isBestSeller || (p.reviews && p.reviews > 60));
    return filtered.length > 0 ? filtered : productsList.slice(4, 10);
  }, [productsList]);

  const saleProducts = useMemo(() => {
    const filtered = productsList.filter(p => p.originalPrice && p.originalPrice > p.price);
    return filtered.length > 0 ? filtered : productsList.slice(2, 6);
  }, [productsList]);

  // Set countdown target to 3 days from now
  const countdownTarget = useMemo(() => new Date().getTime() + 3 * 24 * 60 * 60 * 1000, []);
  const countdown = useCountdown(countdownTarget);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const router = useRouter();
  const { isWishlisted, toggleItem } = useWishlist();
  const [activeHeroImgIdx, setActiveHeroImgIdx] = useState(0);
  const [heroQty, setHeroQty] = useState(1);

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleAddHeroToCart = () => {
    if (!heroProduct) return;
    addItem(heroProduct, heroQty);
    setHeroAdded(true);
    setTimeout(() => setHeroAdded(false), 2000);
  };

  const handleHeroBuyNow = () => {
    if (!heroProduct) return;
    addItem(heroProduct, heroQty);
    router.push('/checkout');
  };

  const heroDiscount = heroProduct?.originalPrice
    ? Math.round((1 - heroProduct.price / heroProduct.originalPrice) * 100)
    : 0;

  const heroId = heroProduct?._id || heroProduct?.id || heroProduct?.slug;
  const isHeroWishlisted = isWishlisted(heroId);
  const heroImages = heroProduct?.images?.length
    ? heroProduct.images
    : ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=700&h=700&fit=crop'];

  useEffect(() => {
    setActiveHeroImgIdx(0);
  }, [heroProduct?.slug, heroProduct?._id]);

  const promo = settings?.promotionBanner;

  return (
    <>
      {/* ===== HERO SECTION — Full Creative Centered Product Showcase ===== */}
      <section className={styles.hero}>
        <div className={styles.heroAmbientGlow} />
        <div className={styles.heroInner}>
          {/* Centered Top Pill Tag */}
          <div className={styles.heroTopTag}>
            <span className={styles.heroPillBadge}>
              <Sparkles size={13} />
              {settings?.heroBadge || 'Curated Organic Spotlight'}
            </span>
          </div>

          {/* Master Centered Product Showcase */}
          {heroProduct && (
            <div className={styles.heroShowcase}>
              {/* Left Column: Interactive Media & Gallery */}
              <div className={styles.heroGalleryCol}>
                <div className={styles.heroMainImageWrap}>
                  {heroDiscount > 0 && (
                    <span className={styles.heroDiscountBadge}>
                      Save {heroDiscount}%
                    </span>
                  )}

                  <button
                    className={`${styles.heroWishlistBtn} ${isHeroWishlisted ? styles.heroWishlisted : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleItem(heroId);
                    }}
                    aria-label={isHeroWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={18} fill={isHeroWishlisted ? 'currentColor' : 'none'} />
                  </button>

                  <img
                    src={heroImages[activeHeroImgIdx] || heroImages[0]}
                    alt={heroProduct.name}
                    className={styles.heroMainImg}
                  />

                  <div className={styles.heroFloatingPill}>
                    <Leaf size={14} />
                    <span>100% Certified Organic</span>
                  </div>
                </div>

                {/* Thumbnails row if multiple images exist */}
                {heroImages.length > 1 && (
                  <div className={styles.heroThumbnailsRow}>
                    {heroImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.heroThumbBtn} ${activeHeroImgIdx === idx ? styles.heroThumbActive : ''}`}
                        onClick={() => setActiveHeroImgIdx(idx)}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        <img src={img} alt="" className={styles.heroThumbImg} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Key Organic Highlights */}
                <div className={styles.heroPerksRow}>
                  <span className={styles.heroPerkItem}>💧 Cold-Pressed</span>
                  <span className={styles.heroPerkDot}>•</span>
                  <span className={styles.heroPerkItem}>🌱 Pure Botanical</span>
                  <span className={styles.heroPerkDot}>•</span>
                  <span className={styles.heroPerkItem}>🐰 Cruelty-Free</span>
                </div>
              </div>

              {/* Right Column: Product Details, Story, Pricing & Actions */}
              <div className={styles.heroInfoCol}>
                <div className={styles.heroMetaRow}>
                  <span className={styles.heroCategoryBadge}>
                    {heroProduct.category ? heroProduct.category.toUpperCase() : 'ORGANIC'} • STAR FORMULA
                  </span>
                  <div className={styles.heroStockBadge}>
                    <span className={styles.heroStockDot} />
                    In Stock • Ready to Dispatch
                  </div>
                </div>

                <h1 className={styles.heroProductName}>
                  <Link href={`/product/${heroProduct.slug}`}>
                    {heroProduct.name}
                  </Link>
                </h1>

                {/* Rating & Reviews */}
                <div className={styles.heroRatingRow}>
                  <div className="stars" style={{ display: 'inline-flex', gap: 3 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className={i < Math.floor(heroProduct.rating || 5) ? 'star' : 'star-empty'}
                        fill={i < Math.floor(heroProduct.rating || 5) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className={styles.heroRatingScore}>{heroProduct.rating || 4.9}</span>
                  <span className={styles.heroReviewsCount}>
                    ({heroProduct.reviews || 128} verified reviews)
                  </span>
                </div>

                {/* Description / Story */}
                <p className={styles.heroProductDesc}>
                  {heroProduct.description ||
                    'Handcrafted from cold-pressed certified organic botanicals. Deeply nourishes and revitalizes your skin with potent natural antioxidants and vitamins.'}
                </p>

                {/* Feature tags */}
                {heroProduct.features && heroProduct.features.length > 0 && (
                  <div className={styles.heroFeatureChips}>
                    {heroProduct.features.slice(0, 4).map((f, i) => (
                      <span key={i} className={styles.heroChip}>
                        <Check size={12} /> {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price block */}
                <div className={styles.heroPriceBox}>
                  <div className={styles.heroPriceMain}>
                    <span className={styles.heroCurrency}>PKR</span>
                    <span className={styles.heroPriceValue}>
                      {Number(heroProduct.price).toLocaleString()}
                    </span>
                  </div>
                  {heroProduct.originalPrice && (
                    <div className={styles.heroPriceOriginalWrap}>
                      <span className={styles.heroOriginalPrice}>
                        PKR {Number(heroProduct.originalPrice).toLocaleString()}
                      </span>
                      <span className={styles.heroSavePill}>
                        Save PKR {Number(heroProduct.originalPrice - heroProduct.price).toLocaleString()} ({heroDiscount}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity & CTA Action Row */}
                <div className={styles.heroActionGroup}>
                  {/* Quantity selector */}
                  <div className={styles.heroQtySelector}>
                    <button
                      type="button"
                      className={styles.heroQtyBtn}
                      onClick={() => setHeroQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.heroQtyVal}>{heroQty}</span>
                    <button
                      type="button"
                      className={styles.heroQtyBtn}
                      onClick={() => setHeroQty(q => q + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddHeroToCart}
                    className={`btn btn-primary ${styles.heroAddToCartBtn} ${heroAdded ? 'btn-success' : ''}`}
                  >
                    {heroAdded ? (
                      <>
                        <Check size={18} /> Added!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} /> Add to Cart
                      </>
                    )}
                  </button>

                  {/* Direct Buy Now */}
                  <button
                    type="button"
                    onClick={handleHeroBuyNow}
                    className={`btn ${styles.heroBuyNowBtn}`}
                  >
                    <Zap size={16} /> Buy Now
                  </button>
                </div>

                {/* Details link & Trust reassurance */}
                <div className={styles.heroBottomRow}>
                  <Link href={`/product/${heroProduct.slug}`} className={styles.heroDetailsLink}>
                    <Eye size={15} /> View Full Ingredients & Details <ArrowRight size={14} />
                  </Link>
                  <span className={styles.heroShippingNote}>
                    🚚 {settings?.shipping?.freeDelivery ? 'Free Delivery nationwide' : 'Eligible for Free Delivery'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className={`section ${styles.categorySection}`}>
        <div className="container-wide">
          <div className={styles.categorySectionHeader}>
            <div className={styles.categoryHeaderContent}>
              <span className={styles.categoryPillBadge}>
                <Sparkles size={12} />
                Curated Collections
              </span>
              <h2 className={styles.categorySectionTitle}>Shop by Category</h2>
              <p className={styles.categorySectionSubtitle}>
                Explore ethically crafted, certified organic essentials for body, mind, and home
              </p>
            </div>
            <Link href="/shop" className={styles.categoryBrowseAllBtn}>
              <span>Explore All Catalog</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryImgWrap}>
                  <img src={cat.image} alt={cat.name} className={styles.categoryImg} />
                  <div className={styles.categoryGradientOverlay} />
                </div>

                <div className={styles.categoryTopPill}>
                  <Leaf size={11} />
                  <span>{cat.badge || `${cat.count} Products`}</span>
                </div>

                <div className={styles.categoryFloatingCard}>
                  <div className={styles.categoryCardInfo}>
                    <h3 className={styles.categoryCardTitle}>{cat.name}</h3>
                    <span className={styles.categoryCardTagline}>{cat.tagline || 'Explore Collection'}</span>
                  </div>
                  <div className={styles.categoryCardArrow} aria-hidden="true">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROMOTION BANNER (TASK 4: PROMOTION BANNER) ===== */}
      {promo?.enabled !== false && (
        <section className={styles.promoBannerSection}>
          <div className="container-wide">
            <div
              className={styles.promoBannerCard}
              style={{
                background: promo?.bgColor
                  ? `linear-gradient(135deg, ${promo.bgColor} 0%, #1E281C 100%)`
                  : undefined,
              }}
            >
              <div>
                <span className={styles.promoBadge}>
                  <Percent size={13} />
                  {promo?.badge || 'Seasonal Harvest Offer'}
                </span>
                <h2 className={styles.promoHeadline}>
                  {promo?.headline || 'Experience Nature at Its Purest — 25% Off'}
                </h2>
                <p className={styles.promoSubheadline}>
                  {promo?.subheadline ||
                    'Handcrafted organic serums, cold-pressed botanicals & pure superfoods. Certified organic and sustainably sourced.'}
                </p>

                <div className={styles.promoCtas}>
                  {promo?.couponCode && (
                    <div
                      className={styles.promoCodeBox}
                      onClick={() => copyCouponCode(promo.couponCode)}
                      title="Click to copy coupon code"
                    >
                      <Tag size={16} color="#FFE2B8" />
                      <div>
                        <div className={styles.promoCodeLabel}>Use Coupon Code</div>
                        <div className={styles.promoCodeText}>{promo.couponCode}</div>
                      </div>
                      {copiedCode ? (
                        <Check size={16} color="#75E089" />
                      ) : (
                        <Copy size={16} color="#FFE2B8" />
                      )}
                    </div>
                  )}

                  <Link
                    href={promo?.buttonLink || '/shop'}
                    className="btn btn-accent btn-lg"
                  >
                    {promo?.buttonText || 'Shop Offer Now'}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className={styles.promoImageWrap}>
                <img
                  src={
                    promo?.imageUrl ||
                    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&fit=crop'
                  }
                  alt="Organic Promotion"
                  className={styles.promoImg}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== NEW ARRIVALS CAROUSEL ===== */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.sectionHeader}>
            <div>
              <span className="section-badge">Fresh Harvest</span>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <div className={styles.carouselNav}>
              <button
                className={styles.carouselBtn}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className={styles.carouselBtn}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div
            className={styles.carouselTrack}
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {newArrivals.map((product, i) => (
              <div key={product._id || product.id || i} className={styles.carouselItem}>
                <ProductCard product={product} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container-wide">
          <div className={styles.sectionHeader}>
            <div>
              <span className="section-badge">Customer Favorites</span>
              <h2 className="section-title">Best Sellers</h2>
            </div>
            <Link href="/shop" className={styles.viewAll}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.productGrid}>
            {bestSellers.slice(0, 8).map((product, i) => (
              <ProductCard key={product._id || product.id || i} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== FLASH SALE COUNTDOWN ===== */}
      <section className={styles.flashSale}>
        <div className="container-wide">
          <div className={styles.flashInner}>
            <div className={styles.flashContent}>
              <span className={styles.flashBadge}>
                <Timer size={14} />
                Flash Harvest Sale
              </span>
              <h2 className={styles.flashTitle}>Up to 40% Off Selected Organic Superfoods</h2>
              <p className={styles.flashDesc}>
                Limited-time harvest deals on our top certified organic supplements and wellness tonics. Don&apos;t miss out.
              </p>
              <div className={styles.countdown}>
                <div className={styles.countdownUnit}>
                  <span className={styles.countdownValue}>{String(countdown.days).padStart(2, '0')}</span>
                  <span className={styles.countdownLabel}>Days</span>
                </div>
                <span className={styles.countdownSep}>:</span>
                <div className={styles.countdownUnit}>
                  <span className={styles.countdownValue}>{String(countdown.hours).padStart(2, '0')}</span>
                  <span className={styles.countdownLabel}>Hours</span>
                </div>
                <span className={styles.countdownSep}>:</span>
                <div className={styles.countdownUnit}>
                  <span className={styles.countdownValue}>{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className={styles.countdownLabel}>Mins</span>
                </div>
                <span className={styles.countdownSep}>:</span>
                <div className={styles.countdownUnit}>
                  <span className={styles.countdownValue}>{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className={styles.countdownLabel}>Secs</span>
                </div>
              </div>
              <Link href="/shop" className="btn btn-primary btn-lg">
                Shop The Flash Sale <ArrowRight size={18} />
              </Link>
            </div>
            <div className={styles.flashProducts}>
              {saleProducts.slice(0, 2).map((product, i) => (
                <ProductCard key={product._id || product.id || i} product={product} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className={styles.whyUs}>
        <div className="container-wide">
          <div className={styles.whyUsGrid}>
            <div className={styles.whyUsVisual}>
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=700&fit=crop"
                alt="Organic farming"
                className={styles.whyUsImg}
              />
              <div className={styles.whyUsBadge}>
                <Sparkles size={20} />
                <div>
                  <strong>Certified Clean</strong>
                  <span>Zero harmful chemicals</span>
                </div>
              </div>
            </div>
            <div className={styles.whyUsContent}>
              <span className="section-badge">Our Commitment</span>
              <h2 className="section-title">Why Choose Lets Organic?</h2>
              <p className={styles.whyUsDesc}>
                We believe that what goes on and into your body should come directly from clean, uncompromised nature. Every item in our store is thoroughly vetted for pure botanical excellence.
              </p>
              <div className={styles.whyUsList}>
                <div className={styles.whyUsItem}>
                  <div className={styles.whyUsItemIcon}>
                    <Leaf size={20} />
                  </div>
                  <div>
                    <h4>100% Certified Organic</h4>
                    <p>Every product is certified by recognized organic authorities, with zero synthetic additives.</p>
                  </div>
                </div>
                <div className={styles.whyUsItem}>
                  <div className={styles.whyUsItemIcon}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4>Sustainably Sourced</h4>
                    <p>We partner directly with ethical farms that respect ecosystems, workers, and our planet.</p>
                  </div>
                </div>
                <div className={styles.whyUsItem}>
                  <div className={styles.whyUsItemIcon}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4>Cold-Pressed & Pure</h4>
                    <p>Gentle low-heat processing ensures maximum nutrient retention and potent botanical efficacy.</p>
                  </div>
                </div>
              </div>
              <Link href="/shop" className="btn btn-primary btn-lg">
                Explore The Collection <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BADGES (moved to bottom) ===== */}
      <section className={styles.trustSection}>
        <div className="container-wide">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <Truck size={22} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>
                  {settings?.shipping?.freeDelivery
                    ? 'Free Nationwide Delivery'
                    : 'Fast Reliable Shipping'}
                </h4>
                <p className={styles.trustDesc}>
                  {settings?.shipping?.freeDelivery
                    ? '100% free delivery across Pakistan'
                    : settings?.shipping?.freeDeliveryThreshold
                    ? `Free delivery over PKR ${Number(settings.shipping.freeDeliveryThreshold).toLocaleString()}`
                    : `Standard delivery PKR ${settings?.shipping?.deliveryFee || 250}`}
                </p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>100% Organic Certified</h4>
                <p className={styles.trustDesc}>Authentic pure botanicals</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>Easy Returns</h4>
                <p className={styles.trustDesc}>7-day return guarantee</p>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <Headphones size={22} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>Customer Care</h4>
                <p className={styles.trustDesc}>Always here for your queries</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
