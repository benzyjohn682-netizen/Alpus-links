/**
 * Utility functions for handling user roles
 */

export type UserRole = string | { name?: string } | any

/**
 * Safely extracts the role name from a user role object
 * @param role - The role which can be a string or an object with a name property
 * @returns The role name as a string, or empty string if not found
 */
export function getRoleName(role?: UserRole): string {
  if (!role) return ''
  if (typeof role === 'string') return role
  return (role as any)?.name || ''
}

/**
 * Safely extracts the role name and converts it to lowercase
 * @param role - The role which can be a string or an object with a name property
 * @returns The role name in lowercase, or empty string if not found
 */
export function getRoleNameLowercase(role?: UserRole): string {
  return getRoleName(role).toLowerCase()
}

/**
 * Checks if a user has a specific role
 * @param userRole - The user's role
 * @param targetRole - The role to check against
 * @returns True if the user has the target role
 */
export function hasRole(userRole?: UserRole, targetRole?: string): boolean {
  return getRoleNameLowercase(userRole) === (targetRole || '').toLowerCase()
}

/**
 * Checks if a user has any of the specified roles
 * @param userRole - The user's role
 * @param targetRoles - Array of roles to check against
 * @returns True if the user has any of the target roles
 */
export function hasAnyRole(userRole?: UserRole, targetRoles?: string[]): boolean {
  if (!targetRoles || targetRoles.length === 0) return false
  const userRoleName = getRoleNameLowercase(userRole)
  return targetRoles.some(role => role.toLowerCase() === userRoleName)
}
