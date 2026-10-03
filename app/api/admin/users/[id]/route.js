import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requirePermissions } from '@/lib/auth';
import { ALL_PERMISSION_KEYS, hasPermission } from '@/lib/permissions';

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

/** Throws a NextResponse-wrapped error object when the id is unusable. */
async function findTarget(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: NextResponse.json({ error: 'Team member not found.' }, { status: 404 }) };
  }
  await connectToDatabase();
  const target = await Admin.findById(id);
  if (!target) {
    return { error: NextResponse.json({ error: 'Team member not found.' }, { status: 404 }) };
  }
  return { target };
}

/** True when deactivating/deleting `target` would remove the last active owner. */
async function isLastActiveOwner(target) {
  if (!target.isOwner) return false;
  const others = await Admin.countDocuments({
    _id: { $ne: target._id },
    isOwner: true,
    active: { $ne: false },
  });
  return others === 0;
}

/**
 * PUT /api/admin/users/[id] — update name / permissions / active, optionally reset password.
 * Body: { name?, permissions?[], active?, password? }
 */
export async function PUT(request, { params }) {
  const { admin, response } = await requirePermissions(request, ['users.manage']);
  if (response) return response;

  const { id } = await params;
  const found = await findTarget(id);
  if (found.error) return found.error;
  const target = found.target;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const isSelf = target._id.toString() === admin.id;
  const deactivating = body?.active === false && target.active !== false;

  // Hard rule: nobody can deactivate their own account.
  if (isSelf && deactivating) {
    return NextResponse.json(
      { error: 'You cannot deactivate your own account.' },
      { status: 400 }
    );
  }

  // Hard rule: destructive actions on an owner require the requester to be an owner.
  if (target.isOwner && deactivating && !admin.isOwner) {
    return NextResponse.json(
      { error: 'Only an owner can deactivate an owner account.' },
      { status: 403 }
    );
  }

  // Hard rule: the last active owner can never be deactivated.
  if (deactivating && (await isLastActiveOwner(target))) {
    return NextResponse.json(
      { error: 'Cannot deactivate the last remaining owner account.' },
      { status: 400 }
    );
  }

  try {
    if (body?.name !== undefined) {
      target.name = String(body.name).trim().slice(0, 100);
    }

    if (body?.permissions !== undefined) {
      const permCheck = validatePermissions(body.permissions);
      if (!permCheck.ok) {
        return NextResponse.json({ error: permCheck.error }, { status: 400 });
      }
      // Can't grant permissions you don't hold yourself.
      const ungrantable = permCheck.list.filter((key) => !hasPermission(admin, key));
      if (ungrantable.length > 0) {
        return NextResponse.json(
          { error: `You cannot grant permission(s) you don't have: ${ungrantable.join(', ')}.` },
          { status: 403 }
        );
      }
      target.permissions = permCheck.list;
    }

    if (body?.active !== undefined) {
      target.active = body.active !== false;
    }

    if (body?.password !== undefined && String(body.password).length > 0) {
      if (String(body.password).length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long.' },
          { status: 400 }
        );
      }
      target.password = await bcrypt.hash(String(body.password), 10);
    }

    await target.save();
    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully.',
      user: toPublicUser(target),
    });
  } catch (error) {
    console.error('[admin/users] PUT failed:', error);
    return NextResponse.json({ error: 'Failed to update team member.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id] — permanently remove a team member.
 * Hard rules: cannot delete self, cannot delete the last owner, only an
 * owner can delete an owner.
 */
export async function DELETE(request, { params }) {
  const { admin, response } = await requirePermissions(request, ['users.manage']);
  if (response) return response;

  const { id } = await params;
  const found = await findTarget(id);
  if (found.error) return found.error;
  const target = found.target;

  if (target._id.toString() === admin.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account.' },
      { status: 400 }
    );
  }

  if (target.isOwner && !admin.isOwner) {
    return NextResponse.json(
      { error: 'Only an owner can delete an owner account.' },
      { status: 403 }
    );
  }

  if (await isLastActiveOwner(target)) {
    return NextResponse.json(
      { error: 'Cannot delete the last remaining owner account.' },
      { status: 400 }
    );
  }

  try {
    await target.deleteOne();
    return NextResponse.json({
      success: true,
      message: `Team member "${target.email}" deleted.`,
    });
  } catch (error) {
    console.error('[admin/users] DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to delete team member.' }, { status: 500 });
  }
}
