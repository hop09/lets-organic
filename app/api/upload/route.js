import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { requirePermissions } from '@/lib/auth';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

/**
 * Admin image uploads.
 *
 * Files are stored on local disk under `public/uploads/YYYY/MM/<random>.<ext>`
 * and served by Next.js as static assets from `/uploads/...`.
 *
 * NOTE: Local-disk storage suits the current single-VPS deployment. If the
 * store ever moves to serverless or multi-instance hosting (where each
 * instance has its own ephemeral disk), move uploads to object storage such
 * as S3 or Cloudinary instead.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Extension is derived from the MIME type, never from the client filename.
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request) {
  const { response } = await requirePermissions(request, ['media.upload']);
  if (response) return response;

  if (!rateLimit('upload:' + getClientIp(request), { limit: 30, windowMs: 3600000 })) {
    return NextResponse.json(
      { success: false, error: 'Too many uploads. Please try again later.' },
      { status: 429 }
    );
  }

  let file;
  try {
    const formData = await request.formData();
    file = formData.get('file');
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid multipart request.' },
      { status: 400 }
    );
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { success: false, error: 'No file provided. Attach the image as the "file" field.' },
      { status: 400 }
    );
  }

  const ext = MIME_TO_EXT[file.type];
  if (!file.type || !file.type.startsWith('image/') || !ext) {
    return NextResponse.json(
      { success: false, error: 'Only image files are allowed (JPG, PNG, WebP, GIF, AVIF).' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'File is too large. Maximum size is 5 MB.' },
      { status: 400 }
    );
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const fileName = `${randomBytes(16).toString('hex')}.${ext}`;
  const dir = path.join(UPLOADS_ROOT, yyyy, mm);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return NextResponse.json({ success: true, url: `/uploads/${yyyy}/${mm}/${fileName}` });
}

export async function DELETE(request) {
  const { response } = await requirePermissions(request, ['media.upload']);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || '';

  if (!url.startsWith('/uploads/')) {
    return NextResponse.json(
      { success: false, error: 'Only files under /uploads/ can be deleted.' },
      { status: 400 }
    );
  }

  // Strictly confine the resolved path to the uploads directory (blocks `..` traversal).
  // Note: path.normalize() preserves a trailing separator, so strip it first —
  // otherwise `/uploads/` would slip past the root-equality check.
  let target = path.normalize(path.join(process.cwd(), 'public', url));
  while (target.length > 1 && target.endsWith(path.sep)) {
    target = target.slice(0, -1);
  }
  if (target === UPLOADS_ROOT || !target.startsWith(UPLOADS_ROOT + path.sep)) {
    return NextResponse.json(
      { success: false, error: 'Invalid file path.' },
      { status: 400 }
    );
  }

  try {
    await unlink(target);
  } catch (err) {
    // Deleting an already-gone file is not an error.
    if (err?.code !== 'ENOENT') throw err;
  }

  return NextResponse.json({ success: true });
}
