'use client';

import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { products } from '@/data/products';
import ProductCard from '@/components/ProductCard/ProductCard';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { items } = useWishlist();

  const wishlistProducts = products.filter(p => items.includes(p.id));

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
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
