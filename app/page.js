'use client';

import { useState, useEffect } from 'react';
import ProductDetailClient from './product/[id]/ProductDetailClient';

export default function HomePage() {
  // The homepage IS the product page for the store's single special
  // product: the exact same design and component as
  // /product/[slug], not a preview card. The slug comes from the live
  // catalog (explicit hero flag, else the first product) so a future
  // slug rename keeps working. The footer still comes from the root
  // layout, after the product content.
  const [slug, setSlug] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function loadHeroSlug() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.products) ? data.products : [];
          const hero = list.find((p) => p.isHero) || list[0];
          if (hero?.slug) {
            setSlug(hero.slug);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load the hero product:', err);
      }
      setFailed(true);
    }
    loadHeroSlug();
  }, []);

  if (failed) {
    return (
      <div className="container-wide" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p>Could not load the product. Please refresh the page.</p>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="container-wide" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p>Loading product…</p>
      </div>
    );
  }

  return <ProductDetailClient id={slug} />;
}
