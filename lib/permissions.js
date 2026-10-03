/**
 * Admin permission catalog (server-side).
 *
 * NOTE: This constant is duplicated in `lib/permissionsClient.js` so the
 * admin console can render the permission picker without importing
 * server-only modules. Keep both files in sync.
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
 * Check whether an admin has a permission.
 * Owners (and anyone with the '*' wildcard) have every permission.
 */
export function hasPermission(admin, key) {
  if (!admin) return false;
  if (admin.isOwner) return true;
  const perms = Array.isArray(admin.permissions) ? admin.permissions : [];
  return perms.includes('*') || perms.includes(key);
}
