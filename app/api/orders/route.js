import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Order, { ORDER_STATUSES } from '@/models/Order';
import Product from '@/models/Product';
import SiteSettings from '@/models/SiteSettings';
import { requirePermissions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateCoupon, recordCouponUse } from '@/lib/coupons';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MAX_QTY_PER_LINE = 20;
const MAX_STR_LEN = 200;

function cleanStr(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim().slice(0, MAX_STR_LEN);
}

/** Validate the request body. Returns { ok, error, items, customer, couponCode }. */
function validateOrderInput(body) {
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Your cart is empty. Add at least one product to place an order.' };
  }
  if (items.length > 50) {
    return { ok: false, error: 'Too many items in one order (max 50 lines).' };
  }

  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const line = items[i] || {};
    const key = cleanStr(line.slug) || cleanStr(line.id);
    const quantity = Number(line.quantity);
    if (!key) {
      return { ok: false, error: `Item #${i + 1}: missing product identifier.` };
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, error: `Item #${i + 1}: quantity must be a positive whole number.` };
    }
    if (quantity > MAX_QTY_PER_LINE) {
      return { ok: false, error: `Item #${i + 1}: maximum ${MAX_QTY_PER_LINE} units per product.` };
    }
    lines.push({ key, quantity });
  }

  const c = body?.customer || {};
  const customer = {
    fullName: cleanStr(c.fullName),
    email: cleanStr(c.email).toLowerCase(),
    phone: cleanStr(c.phone),
    address: cleanStr(c.address),
    city: cleanStr(c.city),
    state: cleanStr(c.state),
    zip: cleanStr(c.zip),
    country: cleanStr(c.country),
    notes: cleanStr(c.notes),
  };

  if (!customer.fullName) return { ok: false, error: 'Full name is required.' };
  if (!customer.email) return { ok: false, error: 'Email address is required.' };
  if (!EMAIL_RE.test(customer.email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!customer.phone) return { ok: false, error: 'Phone number is required.' };
  if (!customer.address) return { ok: false, error: 'Delivery address is required.' };
  if (!customer.city) return { ok: false, error: 'City is required.' };
  if (!customer.zip) return { ok: false, error: 'Postal code is required.' };
  if (!customer.country) return { ok: false, error: 'Country is required.' };

  const couponCode = cleanStr(body?.couponCode).toUpperCase();

  return { ok: true, lines, customer, couponCode };
}

/** Find a product by slug or Mongo _id. Never throws. */
async function findProduct(key) {
  if (mongoose.Types.ObjectId.isValid(key)) {
    return Product.findById(key);
  }
  return Product.findOne({ slug: key.toLowerCase() });
}

/**
 * Compensation for stock decrements when an order cannot be completed.
 * Best-effort: never throws.
 */
async function rollbackStock(decremented) {
  await Promise.all(
    decremented.map((d) =>
      Product.updateOne(
        { _id: d.id },
        { $inc: { stockCount: d.quantity }, $set: { inStock: true } }
      ).catch((e) => console.error('[orders] stock rollback failed:', e?.message || e))
    )
  );
}

/** 'LO-' + 6 random digits, e.g. LO-482913 */
function generateOrderNumber() {
  return `LO-${crypto.randomInt(100000, 1000000)}`;
}

/**
 * Optional server-side notification (admin email via Web3Forms).
 * Failure must NEVER fail the order.
 */
async function notifyNewOrder(order) {
  const accessKey = process.env.WEB3FORMS_KEY;
  if (!accessKey) return;

  try {
    const lines = order.items
      .map((i) => `${i.name} x${i.quantity} — PKR ${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');

    const message = [
      'ORDER DETAILS',
      '========================',
      lines,
      '========================',
      `Subtotal: PKR ${order.subtotal.toLocaleString()}`,
      `Discount${order.couponCode ? ` (${order.couponCode})` : ''}: PKR ${order.discount.toLocaleString()}`,
      `Delivery Fee: ${order.shipping === 0 ? 'FREE' : `PKR ${order.shipping.toLocaleString()}`}`,
      `TOTAL: PKR ${order.total.toLocaleString()}`,
      `Payment: Cash on Delivery`,
      '',
      'CUSTOMER INFO',
      '========================',
      `Name: ${order.customer.fullName}`,
      `Email: ${order.customer.email}`,
      `Phone: ${order.customer.phone}`,
      `Address: ${order.customer.address}`,
      `City: ${order.customer.city}`,
      `State: ${order.customer.state || '—'}`,
      `ZIP: ${order.customer.zip}`,
      `Country: ${order.customer.country}`,
      `Notes: ${order.customer.notes || 'None'}`,
    ].join('\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New Order ${order.orderNumber} — Lets Organic`,
        from_name: 'Lets Organic Store',
        name: order.customer.fullName,
        email: order.customer.email,
        phone: order.customer.phone,
        message,
      }),
    }).finally(() => clearTimeout(timeout));
  } catch (err) {
    console.error('[orders] Web3Forms notification failed (order unaffected):', err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders — place an order (public, rate-limited)
// ---------------------------------------------------------------------------
export async function POST(request) {
  // Rate limit: 10 orders/hour per IP
  if (!rateLimit(`orders:${getClientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json(
      { error: 'Too many orders from this address. Please try again in an hour.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const input = validateOrderInput(body);
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // --- Resolve products & build order lines from DB prices (never trust client) ---
    const orderItems = [];
    for (const line of input.lines) {
      const product = await findProduct(line.key);
      if (!product) {
        return NextResponse.json(
          { error: `Product "${line.key}" was not found. Please refresh your cart and try again.` },
          { status: 400 }
        );
      }
      orderItems.push({
        product,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        quantity: line.quantity,
        image: product.images?.[0] || '',
      });
    }

    // Merge duplicate lines for the same product (cart can list it twice)
    const merged = new Map();
    for (const item of orderItems) {
      const id = String(item.product._id);
      if (merged.has(id)) {
        merged.get(id).quantity += item.quantity;
      } else {
        merged.set(id, item);
      }
    }
    const lines = [...merged.values()];

    // --- Atomic stock decrement (one line at a time, rollback on failure) ---
    const decremented = [];
    try {
      for (const item of lines) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product._id, stockCount: { $gte: item.quantity } },
          { $inc: { stockCount: -item.quantity } },
          { new: true }
        );
        if (!updated) {
          const err = new Error(
            `Insufficient stock for "${item.name}". Only a limited quantity is available — please adjust your cart.`
          );
          err.isStockError = true;
          throw err;
        }
        decremented.push({ id: item.product._id, quantity: item.quantity });
        if (updated.stockCount <= 0 && updated.inStock) {
          await Product.updateOne({ _id: item.product._id }, { inStock: false });
        }
      }
    } catch (stockErr) {
      // Compensation: roll back previously decremented lines
      await rollbackStock(decremented);
      if (stockErr.isStockError) {
        return NextResponse.json({ error: stockErr.message }, { status: 400 });
      }
      throw stockErr; // unexpected DB error → generic 500 from the outer catch
    }

    // --- Totals ---
    const subtotal = lines.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // --- Coupon (invalid code rejects the order so the customer can fix it) ---
    let discount = 0;
    if (input.couponCode) {
      const coupon = await validateCoupon(input.couponCode, subtotal);
      if (!coupon.valid) {
        // Roll back stock since no order will be created
        await rollbackStock(decremented);
        return NextResponse.json({ error: coupon.reason || 'Invalid coupon code.' }, { status: 400 });
      }
      discount = coupon.discount;
    }

    // --- Shipping from SiteSettings (threshold applies to subtotal − discount) ---
    const settings = await SiteSettings.findOne().lean();
    const isFreeDelivery = settings?.shipping?.freeDelivery ?? false;
    const deliveryFee = Number(settings?.shipping?.deliveryFee ?? 250);
    const threshold = Number(settings?.shipping?.freeDeliveryThreshold ?? 2500);
    const effectiveSubtotal = subtotal - discount;
    const shipping = isFreeDelivery ? 0 : threshold > 0 && effectiveSubtotal >= threshold ? 0 : deliveryFee;
    const total = effectiveSubtotal + shipping;

    // --- Create order (retry order number on duplicate key) ---
    let order = null;
    let lastError = null;
    for (let attempt = 0; attempt < 10 && !order; attempt++) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          items: lines.map((i) => ({
            productId: i.product._id,
            slug: i.slug,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          customer: input.customer,
          subtotal,
          discount,
          shipping,
          total,
          couponCode: input.couponCode && discount > 0 ? input.couponCode : '',
          paymentMethod: 'COD',
          status: 'pending',
          statusHistory: [{ status: 'pending', at: new Date(), by: 'system' }],
        });
      } catch (err) {
        if (err?.code === 11000) {
          lastError = err; // orderNumber collision — retry with a new one
          continue;
        }
        throw err;
      }
    }
    if (!order) {
      console.error('[orders] failed to generate unique order number:', lastError);
      return NextResponse.json({ error: 'Could not place your order. Please try again.' }, { status: 500 });
    }

    // --- Record coupon usage (best-effort) ---
    if (order.couponCode) {
      await recordCouponUse(order.couponCode);
    }

    // --- Notify (best-effort, never blocks) ---
    notifyNewOrder(order);

    return NextResponse.json({ success: true, orderNumber: order.orderNumber }, { status: 201 });
  } catch (err) {
    console.error('[orders] POST failed:', err);
    return NextResponse.json({ error: 'Could not place your order. Please try again.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders — list orders (admin only)
// ---------------------------------------------------------------------------
export async function GET(request) {
  const { response } = await requirePermissions(request, ['orders.view']);
  if (response) return response;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    const query = {};
    if (status && ORDER_STATUSES.includes(status)) {
      query.status = status;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      query.$or = [
        { orderNumber: re },
        { 'customer.fullName': re },
        { 'customer.phone': re },
        { 'customer.email': re },
      ];
    }
    if (from || to) {
      const createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          createdAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          // Inclusive through the end of the day
          toDate.setUTCDate(toDate.getUTCDate() + 1);
          createdAt.$lt = toDate;
        }
      }
      if (Object.keys(createdAt).length > 0) {
        query.createdAt = createdAt;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, orders, page, limit, total });
  } catch (err) {
    console.error('[orders] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
