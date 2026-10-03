'use client';

import Image from 'next/image';

/**
 * SafeImage — a drop-in wrapper around next/image that never breaks on
 * arbitrary admin-pasted image URLs.
 *
 * next/image rejects remote hosts that are not listed in
 * `images.remotePatterns` (next.config.mjs) at runtime. Since admins can
 * paste any image URL, this component checks the src host against the
 * same allowlist and renders `unoptimized` (plain <img> behavior, served
 * as-is) for anything else, instead of throwing a 400.
 *
 * Keep OPTIMIZED_HOSTS in sync with `images.remotePatterns` in next.config.mjs.
 */
const OPTIMIZED_HOSTS = new Set(['images.unsplash.com']);

function isOptimizable(src) {
  if (!src || typeof src !== 'string') return false;
  // Local / public-folder assets are always safe to optimize.
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) return true;
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export default function SafeImage({ src, alt = '', ...props }) {
  if (!src) return null;
  return <Image src={src} alt={alt} unoptimized={!isOptimizable(src)} {...props} />;
}
