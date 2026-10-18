/**
 * One-time migration: convert legacy string `benefits` to objects.
 *
 * Old format:  benefits: ["Naturally whitens teeth", "Title | Detail", ...]
 * New format:  benefits: [{ title, detail, image }, ...]
 *
 * - Only touches products whose benefits contain string entries.
 * - Products already using objects are skipped (never overwritten).
 * - "Title | Detail" strings are split; plain strings become title-only.
 * - Safe to run multiple times.
 *
 * Usage (from the repo root, with your real connection string):
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-benefits.js
 */

import mongoose from 'mongoose';

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in, then re-run.');
  process.exit(1);
}

// Minimal inline schema: only the fields this migration needs.
const ProductSchema = new mongoose.Schema(
  { slug: String, benefits: { type: mongoose.Schema.Types.Mixed, default: [] } },
  { strict: false, timestamps: false }
);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

function toObject(b) {
  if (typeof b === 'string') {
    const t = b.trim();
    const idx = t.indexOf('|');
    if (idx > 0)
      return { title: t.slice(0, idx).trim(), detail: t.slice(idx + 1).trim(), image: '' };
    return { title: t, detail: '', image: '' };
  }
  if (b && typeof b === 'object')
    return {
      title: String(b.title || '').trim(),
      detail: String(b.detail || '').trim(),
      image: String(b.image || '').trim(),
    };
  return null;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  let converted = 0;
  let skipped = 0;

  const dbProducts = await Product.find({}).select('slug benefits').lean();
  for (const dbProduct of dbProducts) {
    const benefits = dbProduct.benefits;
    if (!Array.isArray(benefits) || benefits.length === 0) {
      skipped++;
      continue;
    }
    const hasStrings = benefits.some((b) => typeof b === 'string');
    if (!hasStrings) {
      skipped++;
      continue; // Already objects — never touch.
    }
    const normalized = benefits.map(toObject).filter((b) => b && (b.title || b.detail));
    await Product.updateOne({ _id: dbProduct._id }, { $set: { benefits: normalized } });
    converted++;
    console.log(`+ CONVERTED: ${dbProduct.slug} (${normalized.length} benefits)`);
  }

  console.log(`\nDone. Converted: ${converted} | Skipped (already objects/empty): ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
