'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Sparkles,
  ShoppingBag,
  Star,
  Eye,
  Check,
  Minus,
  Plus,
  Zap,
  Heart,
  X,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage/SafeImage';
import { products as fallbackProducts } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import styles from './page.module.css';


export default function HomePage() {
  const { addItem } = useCart();
  const { settings } = useSettings();

  // Real-time products from MongoDB Atlas
  const [productsList, setProductsList] = useState(fallbackProducts);
  const [heroAdded, setHeroAdded] = useState(false);

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

  // The homepage shows ONE special product: explicit hero flag, or the first
  // product (the live store has exactly one product). The footer comes from
  // the root layout, so this page renders nothing else.
  const heroProduct = useMemo(() => {
    return productsList.find(p => p.isHero) || productsList[0] || fallbackProducts[0];
  }, [productsList]);

  const router = useRouter();
  const { isWishlisted, toggleItem } = useWishlist();
  const [activeHeroImgIdx, setActiveHeroImgIdx] = useState(0);
  const [heroQty, setHeroQty] = useState(1);
  // Hero feature popup: null = closed, number = index of the feature shown
  const [heroFeatureIndex, setHeroFeatureIndex] = useState(null);
  // Benefit popup: null = closed, number = index of the benefit being shown
  const [benefitIndex, setBenefitIndex] = useState(null);

  // Split hero features ("Title — detail") into clickable headings + popup detail
  const heroFeatures = useMemo(() => {
    const list = heroProduct?.features?.length > 0 ? heroProduct.features.slice(0, 4) : [];
    return list.map((f) => {
      const parts = String(f).split(/\s—\s/);
      return parts.length > 1
        ? { title: parts[0].trim(), detail: parts.slice(1).join(' — ').trim() }
        : { title: String(f).trim(), detail: '' };
    });
  }, [heroProduct]);

  // Close the hero feature popup on Escape + lock body scroll while open
  useEffect(() => {
    if (heroFeatureIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setHeroFeatureIndex(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [heroFeatureIndex]);

  // Admin benefits for the hero product: { title, detail, image } objects
  // (legacy plain strings still accepted). Shown in the Key Benefits
  // section below the showcase; each opens the benefit popup.
  const benefits = useMemo(() => {
    const list = Array.isArray(heroProduct?.benefits)
      ? heroProduct.benefits.filter(Boolean)
      : [];
    return list
      .map((b) => {
        if (typeof b === 'string') {
          const t = b.trim();
          const idx = t.indexOf('|');
          if (idx > 0)
            return {
              title: t.slice(0, idx).trim(),
              detail: t.slice(idx + 1).trim(),
              image: '',
            };
          return { title: t, detail: '', image: '' };
        }
        return {
          title: String(b.title || '').trim(),
          detail: String(b.detail || '').trim(),
          image: String(b.image || '').trim(),
        };
      })
      .filter((b) => b.title || b.detail);
  }, [heroProduct]);

  // Close the benefit popup on Escape + lock body scroll while open
  useEffect(() => {
    if (benefitIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setBenefitIndex(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [benefitIndex]);

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

  // Reset the gallery to the first image when the hero product changes. Done
  // during render (not in an effect) via the "adjust state when props change"
  // pattern so there is no post-commit cascading render.
  const heroKey = `${heroProduct?.slug ?? ''}|${heroProduct?._id ?? ''}`;
  const [prevHeroKey, setPrevHeroKey] = useState(heroKey);
  if (prevHeroKey !== heroKey) {
    setPrevHeroKey(heroKey);
    setActiveHeroImgIdx(0);
  }

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

                  <SafeImage
                    src={heroImages[activeHeroImgIdx] || heroImages[0]}
                    alt={heroProduct.name}
                    className={styles.heroMainImg}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
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
                        <SafeImage src={img} alt="" className={styles.heroThumbImg} width={60} height={60} />
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
                    {Number(heroProduct.reviews) > 0
                      ? `(${heroProduct.reviews} customer reviews)`
                      : 'Be the first to review'}
                  </span>
                </div>

                {/* Description / Story */}
                <p className={styles.heroProductDesc}>
                  {heroProduct.description ||
                    'Handcrafted from cold-pressed certified organic botanicals. Deeply nourishes and revitalizes your skin with potent natural antioxidants and vitamins.'}
                </p>

                {/* Feature tags — clickable headings, each opens a detail popup */}
                {heroFeatures.length > 0 && (
                  <div className={styles.heroFeatureChips}>
                    {heroFeatures.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        className={styles.heroChip}
                        onClick={() => setHeroFeatureIndex(i)}
                      >
                        <Check size={12} /> {f.title}
                      </button>
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

      {/* ===== KEY BENEFITS — the main product's benefits, not just a preview ===== */}
      {benefits.length > 0 && (
        <section className={styles.benefitsSection}>
          <div className={styles.benefitsInner}>
            <div className={styles.benefitsHeader}>
              <span className={styles.benefitsKicker}>Why you will love it</span>
              <h2 className={styles.benefitsTitle}>Key Benefits</h2>
              <p className={styles.benefitsSubtitle}>
                Tap a benefit to see the full detail.
              </p>
            </div>
            <div className={styles.benefitsGrid}>
              {benefits.map((benefit, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.benefitCard}
                  onClick={() => setBenefitIndex(i)}
                >
                  {benefit.image ? (
                    <img
                      src={benefit.image}
                      alt=""
                      className={styles.benefitCardThumb}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.benefitCardNum} aria-hidden="true">{i + 1}</span>
                  )}
                  <span className={styles.benefitCardBody}>
                    <span className={styles.benefitCardTitle}>{benefit.title}</span>
                    {benefit.detail && (
                      <span className={styles.benefitCardDetail}>{benefit.detail}</span>
                    )}
                  </span>
                  <ChevronRight size={18} className={styles.benefitCardChevron} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero feature popup — one feature at a time, prev/next to browse */}
      {heroFeatureIndex !== null && heroFeatures.length > 0 && (
        <div
          className={styles.heroFeatureModalOverlay}
          onClick={() => setHeroFeatureIndex(null)}
        >
          <div
            className={styles.heroFeatureModal}
            role="dialog"
            aria-modal="true"
            aria-label={`${heroFeatures[heroFeatureIndex].title} — feature ${heroFeatureIndex + 1} of ${heroFeatures.length}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.heroFeatureModalClose}
              onClick={() => setHeroFeatureIndex(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <p className={styles.heroFeatureModalKicker}>
              Feature {heroFeatureIndex + 1} of {heroFeatures.length}
            </p>
            <h3 className={styles.heroFeatureModalTitle}>
              {heroFeatures[heroFeatureIndex].title}
            </h3>
            {heroFeatures[heroFeatureIndex].detail && (
              <p className={styles.heroFeatureModalText}>
                {heroFeatures[heroFeatureIndex].detail}
              </p>
            )}
            <div className={styles.heroFeatureModalNav}>
              <button
                type="button"
                className={styles.heroFeatureModalNavBtn}
                onClick={() => setHeroFeatureIndex((heroFeatureIndex - 1 + heroFeatures.length) % heroFeatures.length)}
                aria-label="Previous feature"
              >
                <ChevronLeft size={18} aria-hidden="true" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className={styles.heroFeatureModalNavBtn}
                onClick={() => setHeroFeatureIndex((heroFeatureIndex + 1) % heroFeatures.length)}
                aria-label="Next feature"
              >
                <span>Next</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit popup — full-size image, prev/next to browse */}
      {benefitIndex !== null && benefits.length > 0 && benefits[benefitIndex] && (
        <div
          className={styles.benefitModalOverlay}
          onClick={() => setBenefitIndex(null)}
        >
          <div
            className={`${styles.benefitModal} ${benefits[benefitIndex].image ? styles.benefitModalWithImage : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={`Benefit ${benefitIndex + 1} of ${benefits.length}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.benefitModalClose}
              onClick={() => setBenefitIndex(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <p className={styles.benefitModalKicker}>
              Benefit {benefitIndex + 1} of {benefits.length}
            </p>
            {benefits[benefitIndex].image && (
              <img
                src={benefits[benefitIndex].image}
                alt={benefits[benefitIndex].title}
                className={styles.benefitModalImage}
              />
            )}
            <h3 className={styles.benefitModalTitle}>{benefits[benefitIndex].title}</h3>
            <p className={styles.benefitModalText}>
              {benefits[benefitIndex].detail || benefits[benefitIndex].title}
            </p>
            <div className={styles.benefitModalNav}>
              <button
                type="button"
                className={styles.benefitModalNavBtn}
                onClick={() => setBenefitIndex((benefitIndex - 1 + benefits.length) % benefits.length)}
                aria-label="Previous benefit"
              >
                <ChevronLeft size={18} aria-hidden="true" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className={styles.benefitModalNavBtn}
                onClick={() => setBenefitIndex((benefitIndex + 1) % benefits.length)}
                aria-label="Next benefit"
              >
                <span>Next</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
