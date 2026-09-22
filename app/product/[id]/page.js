'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Zap,
  Star,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Leaf,
  Check,
  Video,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getProductBySlug, getProductsByCategory, products as staticProducts } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import ProductCard from '@/components/ProductCard/ProductCard';
import styles from './product.module.css';

export default function ProductDetailPage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const slugOrId = unwrappedParams.id;

  // Real-time product from MongoDB
  const fallbackProd = useMemo(() => getProductBySlug(slugOrId), [slugOrId]);
  const [product, setProduct] = useState(fallbackProd);
  const [loading, setLoading] = useState(true);

  // Reviews from MongoDB
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Active media item in carousel (index of combined media: images + videos)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews'); // default to reviews so user sees feedback system!
  const [addedToCart, setAddedToCart] = useState(false);

  // Review submission form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();
  const { settings } = useSettings();

  // 1. Fetch dynamic product data from MongoDB
  useEffect(() => {
    async function fetchProductData() {
      try {
        const res = await fetch(`/api/products/${slugOrId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);
            if (data.reviews) {
              setApprovedReviews(data.reviews);
            }
          }
        }
      } catch (err) {
        console.warn('Using local fallback product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProductData();
  }, [slugOrId]);

  // 2. Fetch approved feedback
  useEffect(() => {
    if (!product?.slug) return;
    async function loadFeedback() {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/feedback?productSlug=${product.slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.reviews) {
            setApprovedReviews(data.reviews);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReviewsLoading(false);
      }
    }
    loadFeedback();
  }, [product?.slug]);

  // Build combined media list (images first in reordered sequence, then videos)
  const mediaList = useMemo(() => {
    if (!product) return [];
    const items = [];
    if (Array.isArray(product.images)) {
      product.images.forEach((url) => items.push({ type: 'image', url }));
    }
    if (Array.isArray(product.videos)) {
      product.videos.forEach((url) => items.push({ type: 'video', url }));
    }
    return items.length > 0 ? items : [{ type: 'image', url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&fit=crop' }];
  }, [product]);

  if (!product && !loading) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <Link href="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  if (!product) return null;

  const wishlisted = isWishlisted(product._id || product.id || product.slug);
  const relatedProducts = getProductsByCategory(product.category)
    .filter(p => p.slug !== product.slug)
    .slice(0, 4);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  const nextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewErrorMsg('');
    setReviewSuccessMsg('');

    if (!reviewName.trim() || !reviewEmail.trim() || !reviewComment.trim()) {
      setReviewErrorMsg('Please fill in your name, email, and review comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          productName: product.name,
          userName: reviewName,
          userEmail: reviewEmail,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReviewSuccessMsg(data.message);
        setReviewName('');
        setReviewEmail('');
        setReviewTitle('');
        setReviewComment('');
        setReviewRating(5);
      } else {
        setReviewErrorMsg(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewErrorMsg('Network error submitting feedback. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentMedia = mediaList[activeMediaIndex] || mediaList[0];

  return (
    <div className={styles.productPage}>
      {/* Breadcrumb */}
      <div className="container-wide">
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`}>{product.category}</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="container-wide">
        <div className={styles.productMain}>
          {/* Media Carousel (Images + Video Support) */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {product.badge && (
                <span className={`badge ${product.badge === 'New' ? 'badge-new' : product.badge === 'Sale' ? 'badge-sale' : 'badge-bestseller'}`}>
                  {product.badge === 'Sale' ? `-${discount}%` : product.badge}
                </span>
              )}

              {/* Display Image or Video */}
              {currentMedia?.type === 'video' ? (
                <div className={styles.videoWrap}>
                  {currentMedia.url.includes('youtube.com') || currentMedia.url.includes('youtu.be') ? (
                    <iframe
                      src={currentMedia.url.replace('watch?v=', 'embed/')}
                      title="Product Video Demo"
                      className={styles.videoElement}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      autoPlay
                      muted
                      playsInline
                      className={styles.videoElement}
                      src={currentMedia.url}
                    />
                  )}
                </div>
              ) : (
                <img
                  src={currentMedia?.url}
                  alt={product.name}
                  className={styles.mainImg}
                  key={activeMediaIndex}
                />
              )}

              {mediaList.length > 1 && (
                <>
                  <button className={`${styles.galleryNav} ${styles.galleryNavLeft}`} onClick={prevMedia} aria-label="Previous">
                    <ChevronLeft size={20} />
                  </button>
                  <button className={`${styles.galleryNav} ${styles.galleryNavRight}`} onClick={nextMedia} aria-label="Next">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Carousel Thumbnails with Video Indicators */}
            {mediaList.length > 1 && (
              <div className={styles.thumbnails}>
                {mediaList.map((item, i) => (
                  <button
                    key={i}
                    className={`${styles.thumbnail} ${i === activeMediaIndex ? styles.thumbnailActive : ''} ${item.type === 'video' ? styles.videoThumbnail : ''}`}
                    onClick={() => setActiveMediaIndex(i)}
                    aria-label={`View media ${i + 1}`}
                  >
                    {item.type === 'video' ? (
                      <>
                        <div className={styles.videoBadgeIcon}>
                          <Video size={14} />
                        </div>
                        <img
                          src={mediaList[0]?.url || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&fit=crop'}
                          alt="Video thumbnail"
                        />
                      </>
                    ) : (
                      <img src={item.url} alt={`${product.name} ${i + 1}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.productInfo}>
            <div className={styles.tags}>
              {(product.tags || ['Organic']).map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>

            <h1 className={styles.productName}>{product.name}</h1>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating || 5) ? 'star' : 'star-empty'}
                    fill={i < Math.floor(product.rating || 5) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className={styles.ratingText}>{product.rating?.toFixed(1) || '5.0'}</span>
              <span className={styles.reviewCount}>
                ({approvedReviews.length > 0 ? approvedReviews.length : product.reviews || 0} customer reviews)
              </span>
            </div>

            {/* Price */}
            <div className={styles.priceRow}>
              <span className={styles.price}>PKR {Number(product.price).toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>PKR {Number(product.originalPrice).toLocaleString()}</span>
                  <span className={styles.saveBadge}>Save {discount}%</span>
                </>
              )}
            </div>

            <p className={styles.description}>{product.description}</p>

            {/* Quantity & Actions */}
            <div className={styles.actionsGroup}>
              <div className={styles.quantityPicker}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease"
                >
                  <Minus size={16} />
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label="Increase"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className={`btn btn-primary btn-lg ${styles.addToCartBtn} ${addedToCart ? styles.addedToCart : ''}`}
                onClick={handleAddToCart}
              >
                {addedToCart ? (
                  <><Check size={18} /> Added to Cart!</>
                ) : (
                  <><ShoppingBag size={18} /> Add to Cart</>
                )}
              </button>

              <button
                className={`${styles.wishBtn} ${wishlisted ? styles.wishBtnActive : ''}`}
                onClick={() => toggleItem(product._id || product.id || product.slug)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button
              className={`btn btn-accent btn-lg ${styles.buyNowBtn}`}
              onClick={handleBuyNow}
            >
              <Zap size={18} /> Buy Now
            </button>

            {/* Trust indicators */}
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <Truck size={16} />
                <span>
                  {settings?.shipping?.freeDelivery
                    ? 'Free delivery across Pakistan'
                    : settings?.shipping?.freeDeliveryThreshold
                    ? `Free delivery over PKR ${Number(settings.shipping.freeDeliveryThreshold).toLocaleString()}`
                    : `Delivery: PKR ${settings?.shipping?.deliveryFee || 250}`}
                </span>
              </div>
              <div className={styles.trustItem}>
                <ShieldCheck size={16} />
                <span>100% Certified organic</span>
              </div>
              <div className={styles.trustItem}>
                <RotateCcw size={16} />
                <span>7-day easy return policy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="section">
        <div className="container-wide">
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Customer Reviews ({approvedReviews.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description & Benefits
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'features' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Organic Highlights
            </button>
          </div>

          <div className={styles.tabContent}>
            {/* TAB: REVIEWS (TASK 6: REALTIME FEEDBACK SYSTEM) */}
            {activeTab === 'reviews' && (
              <div>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewBig}>
                    <span className={styles.reviewBigNumber}>
                      {product.rating?.toFixed(1) || '5.0'}
                    </span>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < Math.floor(product.rating || 5) ? 'star' : 'star-empty'}
                          fill={i < Math.floor(product.rating || 5) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className={styles.reviewBigCount}>
                      Based on {approvedReviews.length} verified customer reviews
                    </span>
                  </div>
                </div>

                <div className={styles.reviewGrid}>
                  {/* Left Column: Live Approved Reviews */}
                  <div>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem', fontWeight: 700 }}>
                      What Verified Buyers Are Saying
                    </h3>

                    {approvedReviews.length === 0 ? (
                      <div className={styles.reviewItem}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Be the first to leave a verified review for this organic formulation! Fill out the feedback form to share your experience.
                        </p>
                      </div>
                    ) : (
                      <div className={styles.reviewList}>
                        {approvedReviews.map((rev) => (
                          <div key={rev._id} className={styles.reviewItem}>
                            <div className={styles.reviewItemHeader}>
                              <div className={styles.reviewAuthor}>
                                <span>{rev.userName}</span>
                                <span className={styles.verifiedBadge}>Verified Buyer</span>
                              </div>
                              <span className={styles.reviewDate}>
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 2, marginBottom: '0.5rem' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  fill={i < rev.rating ? '#C8956C' : 'none'}
                                  color="#C8956C"
                                />
                              ))}
                            </div>

                            {rev.title && (
                              <h4 className={styles.reviewItemTitle}>{rev.title}</h4>
                            )}
                            <p className={styles.reviewItemComment}>{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Submit Feedback Form */}
                  <div className={styles.reviewFormCard}>
                    <h3 className={styles.reviewFormTitle}>Share Your Experience</h3>
                    <p className={styles.reviewFormDesc}>
                      Your feedback helps our organic community grow. Submitted reviews are reviewed by our team and posted live.
                    </p>

                    {reviewSuccessMsg && (
                      <div style={{
                        background: 'rgba(40,167,69,0.12)',
                        border: '1px solid rgba(40,167,69,0.3)',
                        color: '#28A745',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Check size={18} />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    {reviewErrorMsg && (
                      <div style={{
                        background: 'rgba(220,53,69,0.12)',
                        border: '1px solid rgba(220,53,69,0.3)',
                        color: '#DC3545',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertCircle size={18} />
                        <span>{reviewErrorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitReview}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                        Your Overall Rating *
                      </label>
                      <div className={styles.starPicker}>
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            type="button"
                            key={starVal}
                            onClick={() => setReviewRating(starVal)}
                            className={styles.starBtn}
                          >
                            <Star
                              size={24}
                              fill={starVal <= reviewRating ? '#C8956C' : 'none'}
                              color="#C8956C"
                            />
                          </button>
                        ))}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '6px', color: 'var(--text-secondary)' }}>
                          {reviewRating} of 5 Stars
                        </span>
                      </div>

                      <input
                        type="text"
                        required
                        className={styles.reviewInput}
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Your Full Name *"
                      />

                      <input
                        type="email"
                        required
                        className={styles.reviewInput}
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        placeholder="Your Email Address *"
                      />

                      <input
                        type="text"
                        className={styles.reviewInput}
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Review Headline (e.g. Pure glowing skin in 1 week)"
                      />

                      <textarea
                        required
                        className={styles.reviewInput}
                        style={{ minHeight: '110px', resize: 'vertical' }}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your honest review and experience with this product... *"
                      />

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingReview}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {submittingReview ? (
                          'Submitting Feedback...'
                        ) : (
                          <>
                            <Send size={16} /> Submit Feedback For Approval
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DESCRIPTION */}
            {activeTab === 'description' && (
              <div className={styles.descriptionTab}>
                <p>{product.description}</p>
                <div className={styles.highlightBox}>
                  <Leaf size={20} />
                  <div>
                    <h4>Why Organic Matters</h4>
                    <p>Our products are sourced from certified organic farms and producers, ensuring you get the purest, most natural ingredients without harmful chemicals or synthetic pesticides.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FEATURES */}
            {activeTab === 'features' && (
              <ul className={styles.featuresList}>
                {(product.features?.length > 0 ? product.features : [
                  '100% Certified Organic & Non-GMO Ingredients',
                  'Sustainably Cold-Pressed Botanical Extract',
                  'Cruelty-Free, Vegan & Eco-Packaged',
                  'Formulated without parabens, sulfates, or artificial fragrances'
                ]).map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <Check size={18} className={styles.featureCheck} />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section" style={{ background: 'var(--surface)' }}>
          <div className="container-wide">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-xl)' }}>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p, i) => (
                <ProductCard key={p._id || p.id || i} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
