import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ContactMessage from '@/models/ContactMessage';
import { getAdminFromRequest } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cap = (value, max) => String(value ?? '').trim().slice(0, max);

// ---------------------------------------------------------------------------
// GET — admin only: list all contact messages, newest first
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — public: submit a contact message (rate-limited 5/hr per IP)
// ---------------------------------------------------------------------------
export async function POST(request) {
  try {
    if (!rateLimit(`contact:${getClientIp(request)}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const data = await request.json();
    const { name, email, phone, subject, message } = data;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Please provide your name, email, and message.' },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(cap(email, 254))) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (
      cap(name, 100).length === 0 ||
      cap(message, 3000).length === 0 ||
      cap(name, 101).length > 100 ||
      cap(email, 255).length > 254 ||
      cap(phone, 31).length > 30 ||
      cap(subject, 151).length > 150 ||
      cap(message, 3001).length > 3000
    ) {
      return NextResponse.json({ error: 'One or more fields are missing or exceed the maximum length.' }, { status: 400 });
    }

    const newMessage = await ContactMessage.create({
      name: cap(name, 100),
      email: cap(email, 254).toLowerCase(),
      phone: cap(phone, 30),
      subject: cap(subject, 150),
      message: cap(message, 3000),
      read: false,
    });

    return NextResponse.json({ success: true, id: newMessage._id }, { status: 201 });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — admin only: toggle read / unread
// ---------------------------------------------------------------------------
export async function PUT(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const { messageId, read } = await request.json();

    if (!messageId || typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'messageId and read (boolean) are required' },
        { status: 400 }
      );
    }

    const updated = await ContactMessage.findByIdAndUpdate(messageId, { read }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: read ? 'Message marked as read' : 'Message marked as unread',
      contactMessage: updated,
    });
  } catch (error) {
    console.error('Error updating contact message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — admin only: permanently delete a message
// ---------------------------------------------------------------------------
export async function DELETE(request) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const deleted = await ContactMessage.findByIdAndDelete(messageId);
    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
