/**
 * Coupon validation helpers — owned by Phase A (order system).
 *
 * Phase B will add `models/Coupon.js` plus an admin UI. Phase B MUST keep the
 * interface below stable:
 *   export async function validateCoupon(code, subtotal)
 *     -> { valid: boolean, discount: number (PKR), reason: string|null }
 *   export async function recordCouponUse(code)
 *     -> increments usedCount; no-op on failure
 *
 * Expected Coupon model shape (Phase B):
 *   code       String, unique, stored UPPERCASE
 *   active     Boolean
 *   type       'percent' | 'flat'
 *   value      Number (percent 0-100, or flat PKR amount)
 *   minOrder   Number | null  (minimum order subtotal in PKR)
 *   usageLimit Number | null  (max total uses; null = unlimited)
 *   usedCount  Number, default 0
 *   expiresAt  Date | null    (null = never expires)
 */

import connectToDatabase from '@/lib/mongodb';

/** Load the Coupon model if Phase B has created it; null otherwise. */
async function loadCouponModel() {
  try {
    const mod = await import('@/models/Coupon.js');
    return mod?.default || null;
  } catch {
    return null;
  }
}

/**
 * Validate a coupon code against a cart subtotal.
 * Never throws — always returns a { valid, discount, reason } result.
 */
export async function validateCoupon(code, subtotal) {
  const normalized = String(code ?? '').trim().toUpperCase();

  if (!normalized) {
    return { valid: false, discount: 0, reason: 'No coupon code provided' };
  }

  const Coupon = await loadCouponModel();
  if (!Coupon) {
    return { valid: false, discount: 0, reason: 'Invalid coupon code' };
  }

  try {
    await connectToDatabase();
    const coupon = await Coupon.findOne({ code: normalized });

    if (!coupon) {
      return { valid: false, discount: 0, reason: 'Invalid coupon code' };
    }
    if (!coupon.active) {
      return { valid: false, discount: 0, reason: 'This coupon is no longer active' };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, discount: 0, reason: 'This coupon has expired' };
    }
    if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { valid: false, discount: 0, reason: 'This coupon has reached its usage limit' };
    }
    if (coupon.minOrder != null && Number(subtotal) < coupon.minOrder) {
      return {
        valid: false,
        discount: 0,
        reason: `This coupon requires a minimum order of PKR ${Number(coupon.minOrder).toLocaleString()}`,
      };
    }

    const value = Number(coupon.value) || 0;
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round(Number(subtotal) * Math.min(value, 100) / 100);
    } else if (coupon.type === 'flat') {
      discount = Math.min(value, Number(subtotal));
    } else {
      return { valid: false, discount: 0, reason: 'Invalid coupon code' };
    }

    return { valid: true, discount: Math.max(0, discount), reason: null };
  } catch (err) {
    console.error('[coupons] validateCoupon failed:', err);
    return { valid: false, discount: 0, reason: 'Could not validate coupon right now' };
  }
}

/**
 * Increment a coupon's usedCount. Swallows all errors — usage tracking
 * must never break an order.
 */
export async function recordCouponUse(code) {
  const normalized = String(code ?? '').trim().toUpperCase();
  if (!normalized) return;

  try {
    const Coupon = await loadCouponModel();
    if (!Coupon) return;
    await connectToDatabase();
    await Coupon.updateOne({ code: normalized }, { $inc: { usedCount: 1 } });
  } catch (err) {
    console.error('[coupons] recordCouponUse failed:', err);
  }
}
