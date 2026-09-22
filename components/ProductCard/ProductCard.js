'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();

  const productId = product._id || product.id || product.slug;
  const wishlisted = isWishlisted(productId);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(productId);
  };

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={styles.imageWrap}>
        {/* Badge */}
        {product.badge && (
          <span className={`${styles.badge} ${styles[`badge${product.badge}`]}`}>
            {product.badge === 'Sale' ? `-${discount}%` : product.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlisted : ''}`}
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Image Link */}
        <Link href={`/product/${product.slug}`} className={styles.imageInnerLink} aria-label={product.name}>
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&fit=crop'}
            alt={product.name}
            className={`${styles.image} ${imgLoaded ? styles.imageLoaded : ''}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
        </Link>

        {/* Hover Overlay */}
        <div className={styles.overlay}>
          <Link href={`/product/${product.slug}`} className={styles.quickView}>
            <Eye size={16} />
            Quick View
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.category}>{product.category}</p>
        <Link href={`/product/${product.slug}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className={styles.rating}>
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < Math.floor(product.rating) ? 'star' : 'star-empty'}
                fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className={styles.reviewCount}>({product.reviews})</span>
        </div>

        {/* Price & Cart */}
        <div className={styles.bottom}>
          <div className={styles.priceWrap}>
            <span className={styles.price}>PKR {Number(product.price).toLocaleString()}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>PKR {Number(product.originalPrice).toLocaleString()}</span>
            )}
          </div>
          <button
            className={`${styles.cartBtn} ${addedToCart ? styles.cartBtnAdded : ''}`}
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
