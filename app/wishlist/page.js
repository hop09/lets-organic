'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { products as fallbackProducts } from '@/data/products';
import ProductCard from '@/components/ProductCard/ProductCard';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { items } = useWishlist();

  // Live products from the database; the static seed list is only a
  // last-resort fallback if the API call fails.
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            return;
          }
        }
      } catch (err) {
        console.warn('Wishlist falling back to static product data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, []);

  const source = products.length > 0 ? products : fallbackProducts;
  const wishlistProducts = source.filter(p => items.includes(p._id || p.id || p.slug));

  if (loading) {
    return (
      <div className={styles.emptyWishlist}>
        <Heart size={64} strokeWidth={1} className={styles.emptyIcon} />
        <h2>Loading your wishlist…</h2>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className={styles.emptyWishlist}>
        <Heart size={64} strokeWidth={1} className={styles.emptyIcon} />
        <h2>Your Wishlist is Empty</h2>
        <p>Save your favorite organic products here</p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          <ArrowLeft size={18} />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <div className="container-wide">
        <h1 className={styles.title}>My Wishlist</h1>
        <p className={styles.subtitle}>{wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? 's' : ''}</p>
        <div className={styles.grid}>
          {wishlistProducts.map((product, i) => (
            <ProductCard key={product._id || product.id || product.slug} product={product} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
