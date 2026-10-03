import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const ALLOWED_TYPES = ['percent', 'flat'];
const UPDATABLE_FIELDS = ['value', 'minOrder', 'expiresAt', 'usageLimit'];

function requireAdmin(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }
  return null;
}

/** Seed the default ORGANIC25 coupon when the collection is empty. */
async function seedDefaultCouponIfEmpty() {
  const count = await Coupon.countDocuments();
  if (count === 0) {
    console.log('[Coupon Seeder] No coupons found. Seeding default ORGANIC25 coupon...');
    await Coupon.create({
      code: 'ORGANIC25',
      type: 'percent',
      value: 25,
      minOrder: 0,
      active: true,
    });
    console.log('[Coupon Seeder] Successfully seeded ORGANIC25 (25% off, no minimum order).');
  }
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function validateCouponInput(data) {
  const code = String(data?.code ?? '').trim().toUpperCase();
  if (!code) return { ok: false, error: 'Coupon code is required.' };

  const type = data?.type;
  if (!ALLOWED_TYPES.includes(type)) {
    return { ok: false, error: 'Coupon type must be "percent" or "flat".' };
  }

  const value = parseNumber(data?.value);
  if (value === null || Number.isNaN(value) || value <= 0) {
    return { ok: false, error: 'Discount value must be a number greater than 0.' };
  }
  if (type === 'percent' && value > 100) {
    return { ok: false, error: 'Percent coupons cannot exceed 100%.' };
  }

  const minOrder = parseNumber(data?.minOrder);
  if (Number.isNaN(minOrder) || (minOrder !== null && minOrder < 0)) {
    return { ok: false, error: 'Minimum order must be a number of 0 or more.' };
  }

  let expiresAt = null;
  if (data?.expiresAt !== undefined && data?.expiresAt !== null && data?.expiresAt !== '') {
    const date = new Date(data.expiresAt);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: 'Expiry date is not a valid date.' };
    }
    if (date.getTime() < Date.now()) {
      return { ok: false, error: 'Expiry date must be in the future.' };
    }
    expiresAt = date;
  }

  const usageLimit = parseNumber(data?.usageLimit);
  if (Number.isNaN(usageLimit) || (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1))) {
    return { ok: false, error: 'Usage limit must be a whole number of 1 or more.' };
  }

  return {
    ok: true,
    payload: {
      code,
      type,
      value,
      minOrder: minOrder ?? 0,
      active: data?.active === undefined ? true : Boolean(data.active),
      expiresAt,
      usageLimit: usageLimit ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// GET /api/coupons — list coupons (admin only, newest first)
// ---------------------------------------------------------------------------
export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectToDatabase();
    await seedDefaultCouponIfEmpty();

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('[coupons] GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons — create a coupon (admin only)
// ---------------------------------------------------------------------------
export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  // Light rate limit so a bad actor cannot spray coupon codes at the admin API
  if (!rateLimit(`coupons:create:${getClientIp(request)}`, { limit: 30, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many coupon requests. Please try again later.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validated = validateCouponInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existing = await Coupon.findOne({ code: validated.payload.code });
    if (existing) {
      return NextResponse.json(
        { error: `A coupon with code "${validated.payload.code}" already exists.` },
        { status: 409 }
      );
    }

    const coupon = await Coupon.create(validated.payload);
    return NextResponse.json(
      { success: true, message: 'Coupon created successfully', coupon },
      { status: 201 }
    );
  } catch (error) {
    // Race guard: unique index can still fire under concurrent creates
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: `A coupon with code "${validated.payload.code}" already exists.` },
        { status: 409 }
      );
    }
    console.error('[coupons] POST failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/coupons — toggle active or update whitelisted fields (admin only)
// Body: { code, active?, value?, minOrder?, expiresAt?, usageLimit? }
// ---------------------------------------------------------------------------
export async function PUT(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const code = String(body?.code ?? '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
  }

  const update = {};
  if (body?.active !== undefined) {
    update.active = Boolean(body.active);
  }

  for (const field of UPDATABLE_FIELDS) {
    if (body?.[field] === undefined) continue;

    if (field === 'expiresAt') {
      // null/'' clears the expiry
      if (body.expiresAt === null || body.expiresAt === '') {
        update.expiresAt = null;
      } else {
        const date = new Date(body.expiresAt);
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json({ error: 'Expiry date is not a valid date.' }, { status: 400 });
        }
        update.expiresAt = date;
      }
      continue;
    }

    const n = parseNumber(body[field]);
    if (Number.isNaN(n) || n === null) {
      return NextResponse.json({ error: `${field} must be a valid number.` }, { status: 400 });
    }
    if (field === 'value' && n <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0.' }, { status: 400 });
    }
    if (field === 'minOrder' && n < 0) {
      return NextResponse.json({ error: 'Minimum order cannot be negative.' }, { status: 400 });
    }
    if (field === 'usageLimit') {
      if (n !== null && (!Number.isInteger(n) || n < 1)) {
        return NextResponse.json({ error: 'Usage limit must be a whole number of 1 or more.' }, { status: 400 });
      }
      update.usageLimit = n;
      continue;
    }
    update[field] = n;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update. Provide active, value, minOrder, expiresAt, or usageLimit.' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Clamp percent value to the 0–100 range
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return NextResponse.json({ error: `Coupon "${code}" not found.` }, { status: 404 });
    }
    if (coupon.type === 'percent' && update.value !== undefined && update.value > 100) {
      return NextResponse.json({ error: 'Percent coupons cannot exceed 100%.' }, { status: 400 });
    }

    const updated = await Coupon.findOneAndUpdate({ code }, { $set: update }, { new: true });
    return NextResponse.json({ success: true, message: 'Coupon updated successfully', coupon: updated });
  } catch (error) {
    console.error('[coupons] PUT failed:', error);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/coupons?code=XXX — delete a coupon (admin only)
// ---------------------------------------------------------------------------
export async function DELETE(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const code = String(searchParams.get('code') ?? '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const deleted = await Coupon.findOneAndDelete({ code });
    if (!deleted) {
      return NextResponse.json({ error: `Coupon "${code}" not found.` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Coupon "${code}" deleted.` });
  } catch (error) {
    console.error('[coupons] DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
