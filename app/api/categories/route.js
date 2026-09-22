import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import Product from '@/models/Product';
import { getAdminFromRequest } from '@/lib/auth';
import { categories as fallbackCategories } from '@/data/products';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    let categories = settings.categories && settings.categories.length > 0
      ? settings.categories.toObject ? settings.categories.toObject() : settings.categories
      : fallbackCategories;

    // Dynamically calculate product counts for each category
    try {
      const productCounts = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      const countMap = {};
      productCounts.forEach(pc => {
        if (pc._id) {
          countMap[pc._id.toLowerCase()] = pc.count;
        }
      });

      categories = categories.map(cat => ({
        ...cat,
        count: countMap[cat.slug?.toLowerCase()] || countMap[cat.id?.toLowerCase()] || 0,
      }));
    } catch (countErr) {
      console.warn('Failed to calculate product counts for categories:', countErr);
    }

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      fallback: true,
    });
  }
}

export async function POST(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, slug: inputSlug, image, badge, tagline } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = inputSlug && inputSlug.trim()
      ? inputSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    if (!settings.categories || settings.categories.length === 0) {
      settings.categories = fallbackCategories;
    }

    const existingIndex = settings.categories.findIndex(
      c => c.slug === slug || c.id === slug
    );

    const categoryItem = {
      id: slug,
      slug,
      name: cleanName,
      image: image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=700&fit=crop',
      badge: badge || 'Organic Living',
      tagline: tagline || 'Pure & Natural Botanicals',
      count: 0,
    };

    if (existingIndex >= 0) {
      // Update existing category
      settings.categories[existingIndex] = {
        ...settings.categories[existingIndex].toObject?.() || settings.categories[existingIndex],
        ...categoryItem,
      };
    } else {
      // Add new category
      settings.categories.push(categoryItem);
    }

    settings.markModified('categories');
    await settings.save();

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Category updated successfully' : 'Category added successfully',
      categories: settings.categories,
    });
  } catch (error) {
    console.error('Error saving category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || searchParams.get('id');

    if (!slug) {
      return NextResponse.json({ error: 'Category slug or id is required' }, { status: 400 });
    }

    await connectToDatabase();
    let settings = await SiteSettings.findOne();

    if (!settings || !settings.categories) {
      return NextResponse.json({ error: 'No categories found' }, { status: 404 });
    }

    const initialLength = settings.categories.length;
    settings.categories = settings.categories.filter(c => c.slug !== slug && c.id !== slug);

    if (settings.categories.length === initialLength) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    settings.markModified('categories');
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Category removed successfully',
      categories: settings.categories,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
