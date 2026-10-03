import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import NewsletterSubscriber from '@/models/NewsletterSubscriber';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// POST — public: subscribe to the newsletter (rate-limited 5/hr per IP)
// ---------------------------------------------------------------------------
export async function POST(request) {
  try {
    if (!rateLimit(`newsletter:${getClientIp(request)}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many subscription attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const data = await request.json();
    const email = String(data?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Please provide an email address.' }, { status: 400 });
    }

    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await NewsletterSubscriber.findOne({ email }).select('_id').lean();
    if (existing) {
      return NextResponse.json(
        { success: true, alreadySubscribed: true, message: 'You are already subscribed. Thank you!' },
        { status: 200 }
      );
    }

    await NewsletterSubscriber.create({ email });

    return NextResponse.json(
      { success: true, message: 'Subscribed! Welcome to the Lets Organic community.' },
      { status: 201 }
    );
  } catch (error) {
    // Handle duplicate-key race: two concurrent subscribes for the same email
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: true, alreadySubscribed: true, message: 'You are already subscribed. Thank you!' },
        { status: 200 }
      );
    }
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
