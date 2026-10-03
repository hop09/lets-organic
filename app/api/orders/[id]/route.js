import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order, { ORDER_STATUSES } from '@/models/Order';
import { requirePermissions } from '@/lib/auth';

// PUT /api/orders/[id] — update an order's status (admin only)
export async function PUT(request, { params }) {
  const { response } = await requirePermissions(request, ['orders.manage']);
  if (response) return response;

  try {
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const status = String(body?.status || '').trim();
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('[orders] PUT failed:', err);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
