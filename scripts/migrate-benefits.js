/**
 * One-time backfill: add `benefits` to existing products in MongoDB
 * that don't have any yet.
 *
 * - Only touches products where benefits is missing or an empty array.
 * - Never overwrites benefits an admin already added.
 * - Benefits come from the same seed data the app uses (data/products.js),
 *   so code + database stay in sync.
 *
 * Usage (from the repo root, with your real connection string):
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-benefits.js
 *
 * Requires MONGODB_URI in the environment (same value as .env.local).
 * Safe to run multiple times — already-filled products are skipped.
 */

import mongoose from 'mongoose';
import { products as seedProducts } from '../data/products.js';

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in, then re-run.');
  process.exit(1);
}

// Minimal inline schema: only the fields this migration needs.
// (Keeps the script independent of the app's model registry.)
const ProductSchema = new mongoose.Schema(
  { slug: String, benefits: { type: [String], default: [] } },
  { strict: false, timestamps: false }
);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  let updated = 0;
  let skipped = 0;
  let notInSeed = 0;

  const dbProducts = await Product.find({}).select('slug benefits').lean();
  for (const dbProduct of dbProducts) {
    const seed = seedProducts.find((p) => p.slug === dbProduct.slug);
    if (!seed) {
      notInSeed++;
      console.log(`- SKIP (not in seed data): ${dbProduct.slug}`);
      continue;
    }
    if (Array.isArray(dbProduct.benefits) && dbProduct.benefits.length > 0) {
      skipped++;
      continue; // Admin already set benefits — never overwrite.
    }
    await Product.updateOne(
      { _id: dbProduct._id },
      { $set: { benefits: seed.benefits || [] } }
    );
    updated++;
    console.log(`+ UPDATED: ${dbProduct.slug} (${(seed.benefits || []).length} benefits)`);
  }

  console.log(`\nDone. Updated: ${updated} | Already had benefits (skipped): ${skipped} | Not in seed (skipped): ${notInSeed}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
