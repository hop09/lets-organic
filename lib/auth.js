import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb.js';
import Admin from '../models/Admin.js';
import { hasPermission } from './permissions.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. Copy .env.example to .env.local and set a long random value.'
  );
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Ensures the default admin account exists in MongoDB Atlas.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD to be set in the environment.
 * The seeded account is the store owner; an existing env-email account that
 * lacks owner status is backfilled to owner (this only ever matches the
 * seeded env account).
 */
export async function ensureDefaultAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to seed the admin account.'
    );
  }
  await connectToDatabase();
  const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    await Admin.create({
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      name: 'Store Owner',
      permissions: ['*'],
      isOwner: true,
      active: true,
    });
    console.log(`[Admin] Default admin account seeded: ${ADMIN_EMAIL}`);
  } else if (!existingAdmin.isOwner) {
    existingAdmin.isOwner = true;
    if (!Array.isArray(existingAdmin.permissions) || !existingAdmin.permissions.includes('*')) {
      existingAdmin.permissions = ['*'];
    }
    if (!existingAdmin.name) {
      existingAdmin.name = 'Store Owner';
    }
    await existingAdmin.save();
    console.log(`[Admin] Env admin account backfilled to owner: ${ADMIN_EMAIL}`);
  }
}

/**
 * Validates admin credentials. Returns null for unknown, wrong-password,
 * or deactivated accounts.
 */
export async function authenticateAdmin(email, password) {
  await ensureDefaultAdmin();
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return null;
  }
  if (admin.active === false) {
    return null;
  }
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return null;
  }
  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    name: admin.name || '',
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    isOwner: !!admin.isOwner,
  };
}

/**
 * Signs a JWT token for the admin.
 */
export function signAdminToken(adminPayload) {
  return jwt.sign(
    {
      id: adminPayload.id,
      email: adminPayload.email,
      role: adminPayload.role,
      name: adminPayload.name || '',
      permissions: Array.isArray(adminPayload.permissions) ? adminPayload.permissions : [],
      isOwner: !!adminPayload.isOwner,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifies a JWT token.
 */
export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extracts the token from Request headers/cookies, verifies it, then
 * re-reads the admin from the database so deactivation and permission
 * changes take effect immediately. Returns null when the token is missing,
 * invalid, or the account no longer exists / is deactivated.
 */
export async function getAdminFromRequest(request) {
  let token = null;

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Check cookies if header missing
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload || !payload.id) return null;

  await connectToDatabase();
  const admin = await Admin.findById(payload.id);
  if (!admin || admin.active === false) return null;

  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name || '',
    role: admin.role,
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    isOwner: !!admin.isOwner,
  };
}

/**
 * Authorization gate for admin route handlers.
 *
 * Usage:
 *   const { admin, response } = await requirePermissions(request, ['orders.view']);
 *   if (response) return response;
 *
 * Returns { admin } on success, or { response } — a 401 when unauthenticated
 * or a 403 when the admin lacks any of the required permission keys.
 */
export async function requirePermissions(request, keys) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      ),
    };
  }

  const required = Array.isArray(keys) ? keys : [keys];
  const missing = required.filter((key) => !hasPermission(admin, key));
  if (missing.length > 0) {
    return {
      response: NextResponse.json(
        {
          error: `Forbidden. Missing required permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`,
        },
        { status: 403 }
      ),
    };
  }

  return { admin };
}
