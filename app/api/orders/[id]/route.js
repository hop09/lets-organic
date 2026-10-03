import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Order, { ORDER_STATUSES } from '@/models/Order';
import Product from '@/models/Product';
import { requirePermissions } from '@/lib/auth';
import { releaseCouponUse } from '@/lib/coupons';

/** Customer fields the admin may edit after an order is placed. */
const ADDRESS_KEYS = ['address', 'city', 'state', 'zip', 'country', 'phone'];
const MAX_ADDR_LEN = 200;
const MAX_NOTES_LEN = 2000;

function cleanAddr(value) {
  return String(value ?? '').trim().slice(0, MAX_ADDR_LEN);
}

/**
 * PUT /api/orders/[id] — update an order (admin only, `orders.manage`).
 *
 * Accepts any combination of:
 *   { status }      — one of ORDER_STATUSES; transitions are appended to statusHistory
 *   { adminNotes }  — free-text note (empty string clears it)
 *   { address }     — partial customer-address update; only ADDRESS_KEYS are kept
 *
 * Cancelling restocks every line item (atomic guard prevents double-restock)
 * and releases the coupon so it can be used again.
 */
export async function PUT(request, { params }) {
  const { admin, response } = await requirePermissions(request, ['orders.manage']);
  if (response) return response;
  const by = admin?.email || '';

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // --- Validate status (optional) ---
    const statusRaw = body?.status;
    const hasStatus =
      statusRaw !== undefined && statusRaw !== null && String(statusRaw).trim() !== '';
    const status = hasStatus ? String(statusRaw).trim() : null;
    if (status && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // --- Build $set for notes / address (status handled below) ---
    const setFields = {};
    if (body && Object.prototype.hasOwnProperty.call(body, 'adminNotes')) {
      setFields.adminNotes = String(body.adminNotes ?? '').slice(0, MAX_NOTES_LEN);
    }
    const addr = body?.address;
    if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
      for (const key of ADDRESS_KEYS) {
        if (Object.prototype.hasOwnProperty.call(addr, key)) {
          setFields[`customer.${key}`] = cleanAddr(addr[key]);
        }
      }
    }

    if (!status && Object.keys(setFields).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    await connectToDatabase();

    const historyEntry = (s) => ({ status: s, at: new Date(), by });

    let order = null;
    let restocked = false;

    if (status === 'cancelled') {
      // Atomic cancel guard: only the first transition to 'cancelled' matches,
      // so concurrent double-cancels cannot restock (or log history) twice.
      order = await Order.findOneAndUpdate(
        { _id: id, status: { $ne: 'cancelled' } },
        {
          $set: { status: 'cancelled', ...setFields },
          $push: { statusHistory: historyEntry('cancelled') },
        },
        { new: true }
      );
      if (order) {
        // Restock every line — mirrors the decrement logic in POST /api/orders.
        await Promise.all(
          (order.items || []).map((item) =>
            Product.updateOne(
              { _id: item.productId },
              { $inc: { stockCount: item.quantity }, $set: { inStock: true } }
            ).catch((e) => console.error('[orders] restock failed:', e?.message || e))
          )
        );
        restocked = true;
        // Release the coupon so the customer can use it again (best-effort).
        if (order.couponCode) {
          await releaseCouponUse(order.couponCode);
        }
      } else {
        // Either already cancelled (nothing to restock) or the order is gone.
        order = await Order.findById(id);
        if (!order) {
          return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }
        if (Object.keys(setFields).length > 0) {
          order = await Order.findByIdAndUpdate(id, { $set: setFields }, { new: true });
        }
      }
    } else if (status) {
      // Non-cancel status change: log history only when it actually changes.
      const current = await Order.findById(id);
      if (!current) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      if (current.status !== status) {
        // Optimistic-concurrency guard on the current status.
        order = await Order.findOneAndUpdate(
          { _id: id, status: current.status },
          {
            $set: { status, ...setFields },
            $push: { statusHistory: historyEntry(status) },
          },
          { new: true }
        );
        if (!order) {
          return NextResponse.json(
            { error: 'Order was modified concurrently. Please try again.' },
            { status: 409 }
          );
        }
      } else if (Object.keys(setFields).length > 0) {
        order = await Order.findByIdAndUpdate(id, { $set: setFields }, { new: true });
      } else {
        order = current;
      }
    } else {
      // Notes / address only.
      order = await Order.findByIdAndUpdate(id, { $set: setFields }, { new: true });
      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, order, restocked });
  } catch (err) {
    console.error('[orders] PUT failed:', err);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
