export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE'

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  DEPARTMENT_MANAGER: 2,
  EMPLOYEE: 1,
}

export const PERMISSIONS = {
  // Users
  CREATE_ADMIN: ['SUPER_ADMIN'] as Role[],
  CREATE_DEPARTMENT_MANAGER: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  CREATE_EMPLOYEE: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER'] as Role[],
  VIEW_ALL_USERS: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  // Departments
  CREATE_DEPARTMENT: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  VIEW_ALL_DEPARTMENTS: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  MANAGE_DEPARTMENT: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  // Performance cards
  CREATE_CARD: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER'] as Role[],
  VIEW_ALL_CARDS: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  // Goals
  CREATE_DEPARTMENT_GOAL: ['DEPARTMENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  CREATE_PERSONAL_GOAL: ['EMPLOYEE'] as Role[],
  APPROVE_GOAL: ['DEPARTMENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  // Analytics
  VIEW_ORG_ANALYTICS: ['SUPER_ADMIN', 'ADMIN'] as Role[],
  VIEW_DEPARTMENT_ANALYTICS: ['DEPARTMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'] as Role[],
  // Workflow
  ADVANCE_STAGE: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER'] as Role[],
  SUBMIT_SELF_REVIEW: ['EMPLOYEE'] as Role[],
  SUBMIT_MANAGER_REVIEW: ['DEPARTMENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  FINALIZE_CARD: ['DEPARTMENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  // Core objectives
  MANAGE_CORE_OBJECTIVES: ['SUPER_ADMIN', 'ADMIN'] as Role[],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as Role[]).includes(role)
}

export function canAccess(role: Role, ...permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

// Utility: check if roleA outranks roleB
export function outranks(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB]
}
