import { NextResponse } from 'next/server';
import { authenticateAdmin, signAdminToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Brute-force protection: 8 attempts per 15 minutes per IP
    if (!rateLimit(`login:${getClientIp(request)}`, { limit: 8, windowMs: 15 * 60 * 1000 })) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const token = signAdminToken(admin);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        email: admin.email,
        role: admin.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
