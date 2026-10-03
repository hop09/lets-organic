import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order, { ORDER_STATUSES } from '@/models/Order';
import Product from '@/models/Product';
import Feedback from '@/models/Feedback';
import Coupon from '@/models/Coupon';
import { requirePermissions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const VALID_RANGES = ['7d', '30d', '90d', '12m', 'all'];

/** Round money values to avoid float dust from aggregations. */
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function fmtDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtMonth(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Build the full list of bucket keys for a range so charts never have gaps.
 * Daily for 7d/30d/90d, monthly for 12m/all.
 * For `all`, buckets span the earliest → latest order in the collection.
 */
function buildBuckets(range, from, minDate, maxDate) {
  const monthly = range === '12m' || range === 'all';
  const keys = [];
  if (monthly) {
    const start = new Date(minDate);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxDate);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    const cursor = new Date(start);
    while (cursor <= end) {
      keys.push(fmtMonth(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = startOfDay(from);
    const end = startOfDay(new Date());
    while (cursor <= end) {
      keys.push(fmtDay(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return keys;
}

export async function GET(request) {
  try {
    // Permission gate: only admins with the analytics permission.
    const { response } = await requirePermissions(request, ['analytics.view']);
    if (response) return response;

    // Light rate limit for this read endpoint (dashboard refetches per range change).
    if (!rateLimit(`analytics:${getClientIp(request)}`, { limit: 60, windowMs: 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many analytics requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    if (!VALID_RANGES.includes(range)) {
      return NextResponse.json(
        { error: `Invalid range. Must be one of: ${VALID_RANGES.join(', ')}.` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Compute the `from` date for the requested range.
    const now = new Date();
    let from = null;
    if (range === '7d') from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (range === '90d') from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (range === '12m') {
      from = new Date(now);
      from.setMonth(from.getMonth() - 12);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
    }
    // `all` → from stays null (no date filter).

    const dateFilter = from ? { createdAt: { $gte: from } } : {};
    // Revenue / order counts exclude cancelled orders; byStatus counts them.
    const activeFilter = { status: { $ne: 'cancelled' } };
    const monthly = range === '12m' || range === 'all';
    const bucketExpr = monthly
      ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [facet] = await Order.aggregate([
      {
        $facet: {
          // Revenue + order totals (cancelled excluded).
          summary: [
            { $match: { ...dateFilter, ...activeFilter } },
            {
              $group: {
                _id: null,
                total: { $sum: '$total' },
                orders: { $sum: 1 },
                itemsSold: { $sum: { $sum: '$items.quantity' } },
              },
            },
          ],
          // Order counts per status (cancelled INCLUDED here).
          byStatus: [
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          // Revenue + orders per time bucket (cancelled excluded).
          byBucket: [
            { $match: { ...dateFilter, ...activeFilter } },
            {
              $group: {
                _id: bucketExpr,
                revenue: { $sum: '$total' },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Top products by quantity sold (cancelled excluded).
          topProducts: [
            { $match: { ...dateFilter, ...activeFilter } },
            { $unwind: '$items' },
            {
              $group: {
                _id: { slug: '$items.slug', name: '$items.name' },
                qty: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              },
            },
            { $sort: { qty: -1 } },
            { $limit: 10 },
          ],
          // Revenue by product category via Product lookup (cancelled excluded).
          categoryRevenue: [
            { $match: { ...dateFilter, ...activeFilter } },
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'prod',
              },
            },
            {
              $addFields: {
                category: {
                  $ifNull: [{ $arrayElemAt: ['$prod.category', 0] }, 'uncategorized'],
                },
              },
            },
            {
              $group: {
                _id: '$category',
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              },
            },
            { $sort: { revenue: -1 } },
          ],
          // Customers aggregated by email (cancelled excluded).
          customers: [
            { $match: { ...dateFilter, ...activeFilter } },
            {
              $group: {
                _id: { $toLower: '$customer.email' },
                name: { $first: '$customer.fullName' },
                email: { $first: '$customer.email' },
                orders: { $sum: 1 },
                spent: { $sum: '$total' },
              },
            },
            { $sort: { spent: -1 } },
          ],
          // Latest orders in range (all statuses).
          recentOrders: [
            { $match: dateFilter },
            { $sort: { createdAt: -1 } },
            { $limit: 8 },
            {
              $project: {
                orderNumber: 1,
                'customer.fullName': 1,
                total: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
          // Min/max order dates (used to span monthly buckets for `all`).
          dateRange: [
            { $group: { _id: null, min: { $min: '$createdAt' }, max: { $max: '$createdAt' } } },
          ],
        },
      },
    ]);

    // Parallel side queries: reviews, low stock, coupons.
    const [feedbackAgg] = await Feedback.aggregate([
      {
        $facet: {
          stats: [
            { $match: dateFilter },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $eq: ['$isApproved', true] }, 0, 1] },
                },
              },
            },
          ],
          avg: [
            { $match: { ...dateFilter, isApproved: true } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } },
          ],
        },
      },
    ]);

    const [lowStockDocs, couponDocs] = await Promise.all([
      Product.find({ inStock: true, stockCount: { $lte: 10 } })
        .select('name slug stockCount')
        .sort({ stockCount: 1 })
        .limit(20)
        .lean(),
      Coupon.find().select('code type value usedCount').lean(),
    ]);

    // ---- Assemble the response ----
    const summary = facet.summary[0] || { total: 0, orders: 0, itemsSold: 0 };
    const revenueTotal = round2(summary.total);
    const ordersTotal = summary.orders || 0;

    // byStatus: every status present, zero-filled.
    const byStatus = {};
    for (const s of ORDER_STATUSES) byStatus[s] = 0;
    for (const row of facet.byStatus || []) {
      if (row._id && byStatus[row._id] !== undefined) byStatus[row._id] = row.count;
    }

    // Time buckets: fill missing buckets with zeros so charts don't break.
    const bucketMap = new Map();
    for (const row of facet.byBucket || []) {
      bucketMap.set(row._id, { revenue: round2(row.revenue), orders: row.orders });
    }
    const dr = facet.dateRange[0];
    const bucketMin = range === 'all' ? dr?.min : from;
    const bucketMax = range === 'all' ? dr?.max : now;
    const bucketKeys = bucketMin && bucketMax ? buildBuckets(range, bucketMin, bucketMin, bucketMax) : [];
    const byDayFull = bucketKeys.map((date) => ({
      date,
      revenue: bucketMap.get(date)?.revenue ?? 0,
      orders: bucketMap.get(date)?.orders ?? 0,
    }));

    const topProducts = (facet.topProducts || []).map((p) => ({
      name: p._id?.name || 'Unknown product',
      slug: p._id?.slug || '',
      qty: p.qty || 0,
      revenue: round2(p.revenue),
    }));

    const revenueByCategory = (facet.categoryRevenue || []).map((c) => ({
      category: c._id || 'uncategorized',
      revenue: round2(c.revenue),
    }));

    const customers = facet.customers || [];
    const topCustomers = customers.slice(0, 8).map((c) => ({
      name: c.name || 'Guest',
      email: c.email || '',
      orders: c.orders || 0,
      spent: round2(c.spent),
    }));

    const feedbackStats = feedbackAgg?.stats?.[0] || { total: 0, pending: 0 };
    const avgRating = feedbackAgg?.avg?.[0]?.avgRating ?? null;

    const recentOrders = (facet.recentOrders || []).map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.customer?.fullName || 'Guest',
      total: round2(o.total),
      status: o.status,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      success: true,
      range,
      revenue: {
        total: revenueTotal,
        byDay: byDayFull.map(({ date, revenue, orders }) => ({ date, revenue, orders })),
      },
      orders: {
        total: ordersTotal,
        byStatus,
        byDay: byDayFull.map(({ date, orders }) => ({ date, orders })),
      },
      aov: ordersTotal > 0 ? round2(revenueTotal / ordersTotal) : 0,
      itemsSold: summary.itemsSold || 0,
      topProducts,
      revenueByCategory,
      customers: {
        total: customers.length,
        repeat: customers.filter((c) => (c.orders || 0) > 1).length,
        top: topCustomers,
      },
      reviews: {
        total: feedbackStats.total || 0,
        pending: feedbackStats.pending || 0,
        avgRating: avgRating == null ? null : Math.round(avgRating * 10) / 10,
      },
      lowStock: lowStockDocs.map((p) => ({
        name: p.name,
        slug: p.slug,
        stockCount: p.stockCount,
      })),
      coupons: couponDocs.map((c) => ({
        code: c.code,
        uses: c.usedCount || 0,
        discountGiven: c.type === 'flat' ? round2((c.usedCount || 0) * (c.value || 0)) : null,
      })),
      recentOrders,
    });
  } catch (err) {
    console.error('[analytics] GET error:', err);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
