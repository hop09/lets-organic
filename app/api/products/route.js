import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { requirePermissions } from '@/lib/auth';
import { products as initialProducts } from '@/data/products';

// Helper to auto-seed initial products if database is empty
async function seedInitialProductsIfEmpty() {
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log('[Product Seeder] Seeding initial organic products into MongoDB Atlas...');
    const formatted = initialProducts.map((p, index) => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice || null,
      images: p.images || [],
      videos: [],
      category: p.category,
      tags: p.tags || ['Organic'],
      rating: p.rating || 5.0,
      reviews: p.reviews || 0,
      badge: p.badge || (index === 0 ? 'Featured' : ''),
      description: p.description,
      features: p.features || [],
      benefits: p.benefits || [],
      inStock: p.inStock !== false,
      stockCount: 50,
      isHero: index === 0, // Set first product (Rosehip Face Oil) as hero spotlight
      isBestSeller: p.reviews > 80,
      isNewArrival: p.badge === 'New',
      isOnSale: !!p.originalPrice,
    }));
    await Product.insertMany(formatted);
    console.log(`[Product Seeder] Successfully seeded ${formatted.length} products.`);
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    await seedInitialProductsIfEmpty();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const hero = searchParams.get('hero');
    const badge = searchParams.get('badge');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (hero === 'true') {
      // Find the hero product
      const heroProduct = await Product.findOne({ isHero: true });
      if (heroProduct) {
        return NextResponse.json({ success: true, product: heroProduct });
      }
      // Fallback to first product if none marked as hero
      const fallbackHero = await Product.findOne().sort({ rating: -1 });
      return NextResponse.json({ success: true, product: fallbackHero });
    }

    if (badge) {
      query.badge = badge;
    }

    if (search) {
      // Escape regex metacharacters so user input can't break or abuse the query
      const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      ];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price-low') {
      sortQuery = { price: 1 };
    } else if (sort === 'price-high') {
      sortQuery = { price: -1 };
    } else if (sort === 'rating') {
      sortQuery = { rating: -1 };
    } else if (sort === 'newest') {
      sortQuery = { createdAt: -1 };
    }

    let mongoQuery = Product.find(query).sort(sortQuery);
    if (limit > 0) {
      mongoQuery = mongoQuery.limit(limit);
    }

    const products = await mongoQuery.exec();

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products from database' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { response } = await requirePermissions(request, ['products.manage']);
    if (response) return response;

    await connectToDatabase();
    const data = await request.json();

    if (!data.name || !data.price || !data.category || !data.description) {
      return NextResponse.json(
        { error: 'Missing required product fields: name, price, category, description' },
        { status: 400 }
      );
    }

    // Auto generate slug if not provided
    let slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // If marked as hero, unset hero flag on all other products
    if (data.isHero) {
      await Product.updateMany({}, { isHero: false });
    }

    const newProduct = await Product.create({
      ...data,
      slug,
      images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
      videos: Array.isArray(data.videos) ? data.videos : (data.videos ? [data.videos] : []),
      features: Array.isArray(data.features) ? data.features : [],
      // Normalize benefits: accept objects {title, detail, image} or legacy strings
      // ("Title | Detail" or plain) and store as objects.
      benefits: Array.isArray(data.benefits)
        ? data.benefits
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
              if (b && typeof b === 'object')
                return {
                  title: String(b.title || '').trim(),
                  detail: String(b.detail || '').trim(),
                  image: String(b.image || '').trim(),
                };
              return null;
            })
            .filter((b) => b && (b.title || b.detail))
        : [],
      tags: Array.isArray(data.tags) ? data.tags : ['Organic'],
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: newProduct,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
