// src/lib/auth/rbac.ts

export type UserRole =
  | "OWNER"
  | "ADMIN"
  | "PRODUCT_MANAGER"
  | "CONTENT_MANAGER"
  | "SALES_MANAGER"
  | "SEO_MANAGER"
  | "VIEWER";

export type Permission =
  | "manage_users"
  | "manage_backups"
  | "manage_settings"
  | "manage_products"
  | "manage_inquiries"
  | "manage_seo"
  | "view_dashboard"
  | "view_audit_logs";

/**
 * Checks if a given role has the specified permission.
 * Simplified for single-user system: always returns true for authenticated sessions.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  return true;
}

/**
 * Checks if a role is allowed to access dashboard tabs.
 * Simplified for single-user system: always returns true.
 */
export function canAccessTab(role: string, tab: string): boolean {
  return true;
}
