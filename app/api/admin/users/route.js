import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requirePermissions } from '@/lib/auth';
import { ALL_PERMISSION_KEYS, hasPermission } from '@/lib/permissions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sanitize a user document for API output (never leaks the password hash). */
function toPublicUser(admin) {
  return {
    id: admin._id.toString(),
    name: admin.name || '',
    email: admin.email,
    role: admin.role,
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    isOwner: !!admin.isOwner,
    active: admin.active !== false,
    createdAt: admin.createdAt,
  };
}

function validatePermissions(permissions) {
  const list = Array.isArray(permissions) ? permissions : [];
  const invalid = list.filter((key) => !ALL_PERMISSION_KEYS.includes(key));
  if (invalid.length > 0) {
    return { ok: false, error: `Invalid permission key(s): ${invalid.join(', ')}.` };
  }
  return { ok: true, list };
}

/**
 * GET /api/admin/users — list all team members (password hashes excluded).
 * Owners first, then oldest first.
 */
export async function GET(request) {
  const { admin, response } = await requirePermissions(request, ['users.manage']);
  if (response) return response;

  try {
    await connectToDatabase();
    const users = await Admin.find({})
      .select('-password')
      .sort({ isOwner: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        id: u._id.toString(),
        active: u.active !== false,
      })),
    });
  } catch (error) {
    console.error('[admin/users] GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch team members.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users — create a team member.
 * Body: { name, email, password, permissions[], active }
 */
export async function POST(request) {
  const { admin, response } = await requirePermissions(request, ['users.manage']);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim().slice(0, 100);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const active = body?.active !== false;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long.' },
      { status: 400 }
    );
  }

  const permCheck = validatePermissions(body?.permissions);
  if (!permCheck.ok) {
    return NextResponse.json({ error: permCheck.error }, { status: 400 });
  }

  // Creators can't grant permissions they don't hold themselves.
  const ungrantable = permCheck.list.filter((key) => !hasPermission(admin, key));
  if (ungrantable.length > 0) {
    return NextResponse.json(
      { error: `You cannot grant permission(s) you don't have: ${ungrantable.join(', ')}.` },
      { status: 403 }
    );
  }

  try {
    await connectToDatabase();

    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: `An account with email "${email}" already exists.` },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      permissions: permCheck.list,
      isOwner: false,
      active,
    });

    return NextResponse.json(
      { success: true, message: 'Team member created successfully.', user: toPublicUser(created) },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: `An account with email "${email}" already exists.` },
        { status: 409 }
      );
    }
    console.error('[admin/users] POST failed:', error);
    return NextResponse.json({ error: 'Failed to create team member.' }, { status: 500 });
  }
}
