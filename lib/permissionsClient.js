/**
 * Client-safe copy of the admin permission catalog.
 *
 * This is a verbatim duplicate of the constant in `lib/permissions.js` so
 * client components can render the permission picker without pulling in
 * server-only modules. KEEP BOTH FILES IN SYNC.
 */
export const PERMISSIONS = {
  Analytics: [{ key: 'analytics.view', label: 'View analytics dashboard' }],
  Products: [
    { key: 'products.view', label: 'View products' },
    { key: 'products.manage', label: 'Create / edit / delete products' },
  ],
  Categories: [{ key: 'categories.manage', label: 'Manage categories' }],
  Orders: [
    { key: 'orders.view', label: 'View orders' },
    { key: 'orders.manage', label: 'Manage orders & statuses' },
  ],
  Coupons: [{ key: 'coupons.manage', label: 'Manage discount coupons' }],
  Reviews: [{ key: 'feedback.moderate', label: 'Moderate customer reviews' }],
  'Settings & promos': [{ key: 'settings.manage', label: 'Manage settings & promotion banner' }],
  Media: [{ key: 'media.upload', label: 'Upload images' }],
  Team: [{ key: 'users.manage', label: 'Manage team members' }],
};

/** Flat list of every valid permission key. */
export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS).flatMap((group) =>
  group.map((entry) => entry.key)
);

/**
 * Client-side mirror of the server `hasPermission` check.
 * Used only to hide UI the current user can't use — the API re-checks anyway.
 */
export function hasPermission(admin, key) {
  if (!admin) return false;
  if (admin.isOwner) return true;
  const perms = Array.isArray(admin.permissions) ? admin.permissions : [];
  return perms.includes('*') || perms.includes(key);
}
