import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';

const BASE_URL = 'https://letsorganic.store';

const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/shipping', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/returns', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap() {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    await connectToDatabase();
    const products = await Product.find({}).select('slug updatedAt').lean();

    const productEntries = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/product/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    // Never let sitemap generation fail the build: fall back to static routes
    console.error('Sitemap: could not reach the database, returning static routes only.', error?.message || error);
    return staticEntries;
  }
}
