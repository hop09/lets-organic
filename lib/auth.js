import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb.js';
import Admin from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'letsorganic_jwt_secure_auth_key_4527_vault';
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@letsorganic.store';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'waqar4527';

/**
 * Ensures the default admin account exists in MongoDB Atlas.
 */
export async function ensureDefaultAdmin() {
  await connectToDatabase();
  const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);
    await Admin.create({
      email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
    });
    console.log(`[Admin] Default admin account seeded: ${DEFAULT_ADMIN_EMAIL}`);
  }
}

/**
 * Validates admin credentials.
 */
export async function authenticateAdmin(email, password) {
  await ensureDefaultAdmin();
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
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
 * Extracts and verifies token from Request headers or cookies.
 */
export function getAdminFromRequest(request) {
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
  return verifyAdminToken(token);
}
