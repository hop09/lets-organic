import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import ProductDetailClient from './ProductDetailClient';

const SITE_NAME = 'Lets Organic';

function fallbackMetadata() {
  return {
    title: `Shop Organic Products | ${SITE_NAME}`,
    description:
      'Discover premium certified organic skincare, superfoods, wellness remedies, and botanical essentials at Lets Organic.',
  };
}

function excerpt(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 3).trimEnd()}...` : clean;
}

async function getProductForMetadata(id) {
  try {
    await connectToDatabase();
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };
    return await Product.findOne(query).lean();
  } catch {
    // DB unreachable (or invalid id): fall back to generic metadata.
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductForMetadata(id);

  if (!product) return fallbackMetadata();

  const description =
    excerpt(product.description) ||
    `${product.name} — certified organic, available now at ${SITE_NAME}.`;
  const images = (Array.isArray(product.images) ? product.images : []).filter(Boolean);

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: product.name,
      description,
      siteName: SITE_NAME,
      type: 'website',
      ...(images.length > 0 ? { images: [{ url: images[0], alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(images.length > 0 ? { images: [images[0]] } : {}),
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
