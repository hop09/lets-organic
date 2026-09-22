'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, LayoutGrid, ArrowUpDown } from 'lucide-react';
import ProductCard from '@/components/ProductCard/ProductCard';
import { products as fallbackProducts, categories } from '@/data/products';
import styles from './shop.module.css';

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [gridSize, setGridSize] = useState('normal');

  // Real-time products state
  const [productsList, setProductsList] = useState(fallbackProducts);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.products?.length > 0) {
            setProductsList(data.products);
          }
        }
      } catch (err) {
        console.warn('Fallback to local products list');
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...productsList];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [activeCategory, sortBy, productsList]);

  return (
    <div className={styles.shopPage}>
      {/* Header */}
      <div className={styles.shopHeader}>
        <div className="container-wide">
          <h1 className={styles.shopTitle}>
            {activeCategory === 'all' ? 'All Products' : categories.find(c => c.slug === activeCategory)?.name || 'Shop'}
          </h1>
          <p className={styles.shopSubtitle}>
            {filteredProducts.length} certified organic products — curated for wellness & beauty
          </p>
        </div>
      </div>

      <div className="container-wide">
        {/* Filters Bar */}
        <div className={styles.filtersBar}>
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterChip} ${activeCategory === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.filterChip} ${activeCategory === cat.slug ? styles.filterChipActive : ''}`}
                onClick={() => setActiveCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className={styles.filterActions}>
            <div className={styles.sortSelect}>
              <ArrowUpDown size={14} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.select}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className={styles.gridToggle}>
              <button
                className={`${styles.gridBtn} ${gridSize === 'compact' ? styles.gridBtnActive : ''}`}
                onClick={() => setGridSize('compact')}
                aria-label="Compact grid"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                className={`${styles.gridBtn} ${gridSize === 'normal' ? styles.gridBtnActive : ''}`}
                onClick={() => setGridSize('normal')}
                aria-label="Normal grid"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className={`${styles.productGrid} ${gridSize === 'compact' ? styles.productGridCompact : ''}`}>
          {filteredProducts.map((product, i) => (
            <ProductCard key={product._id || product.id || i} product={product} index={i} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.noResults}>
            <SlidersHorizontal size={48} strokeWidth={1} />
            <h3>No products found</h3>
            <p>Try adjusting your category filter or sort criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className={styles.shopPage}><div className={styles.shopHeader}><div className="container-wide"><h1 className={styles.shopTitle}>Loading...</h1></div></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
