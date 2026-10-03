import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * Public order tracking.
 * Requires the order number PLUS the phone number or email used at checkout,
 * so order numbers alone can't be used to snoop on other people's orders.
 * Returns only customer-safe fields — never admin notes, full address,
 * or internal history metadata.
 */

// Compare the last 10 digits so +92 300..., 0300..., 92300... all match.
function normalizePhone(p) {
  return String(p || '').replace(/\D/g, '').slice(-10);
}

export async function GET(request) {
  try {
    if (!rateLimit(`track:${getClientIp(request)}`, { limit: 30, windowMs: 60 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many tracking requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = String(searchParams.get('orderNumber') || '').trim().toUpperCase();
    const phone = String(searchParams.get('phone') || '').trim();
    const email = String(searchParams.get('email') || '').trim().toLowerCase();

    if (!orderNumber || (!phone && !email)) {
      return NextResponse.json(
        { error: 'Please enter your order number plus the phone number or email used at checkout.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findOne({ orderNumber }).lean();

    // Same generic message whether the order is missing or verification
    // failed, so order numbers can't be enumerated.
    const notFound = () =>
      NextResponse.json(
        { error: 'No order found with these details. Please check your order number and try again.' },
        { status: 404 }
      );

    if (!order) return notFound();

    const phoneOk = phone.length >= 7 && normalizePhone(order.customer?.phone) === normalizePhone(phone);
    const emailOk = email.includes('@') && String(order.customer?.email || '').toLowerCase() === email;

    if (!phoneOk && !emailOk) return notFound();

    return NextResponse.json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        items: (order.items || []).map((i) => ({
          name: i.name,
          slug: i.slug,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
        subtotal: order.subtotal,
        discount: order.discount || 0,
        shipping: order.shipping,
        total: order.total,
        couponCode: order.couponCode || '',
        paymentMethod: order.paymentMethod,
        city: order.customer?.city || '',
        createdAt: order.createdAt,
        timeline: (order.statusHistory || []).map((h) => ({ status: h.status, at: h.at })),
      },
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json({ error: 'Could not look up your order right now.' }, { status: 500 });
  }
}
