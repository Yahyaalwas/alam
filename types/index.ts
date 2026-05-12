export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE'

export type CardStatus =
  | 'GOAL_SETTING'
  | 'SELF_REVIEW'
  | 'MANAGER_REVIEW'
  | 'CALIBRATION_MEETING'
  | 'FINALIZED'

export type GoalType = 'DEPARTMENT' | 'PERSONAL'

export type GoalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export type AuditAction =
  | 'GOAL_CREATED'
  | 'GOAL_APPROVED'
  | 'GOAL_REJECTED'
  | 'SELF_REVIEW_SUBMITTED'
  | 'MANAGER_REVIEW_SUBMITTED'
  | 'CALIBRATION_COMPLETED'
  | 'CARD_FINALIZED'
  | 'SCORE_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'DEPARTMENT_CREATED'
  | 'CARD_CREATED'
  | 'STAGE_ADVANCED'

export interface SessionUser {
  userId: string
  role: Role
}

export interface Department {
  id: string
  nameEn: string
  nameAr: string
  code: string
  managerId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface User {
  id: string
  email: string
  nameEn: string
  nameAr: string
  role: Role
  departmentId: string | null
  managerId: string | null
  createdAt: Date | string
  updatedAt: Date | string
  // optional relations
  department?: Department | null
  manager?: User | null
  directReports?: User[]
  managedDept?: Department | null
}

export interface Goal {
  id: string
  cardId: string
  type: GoalType
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  weight: number
  departmentId: string | null
  createdById: string
  assignedToId: string | null
  goalStatus: GoalStatus
  approvedByManager: boolean
  approvalDate: Date | string | null
  selfRating: number | null
  selfComment: string | null
  managerRating: number | null
  managerComment: string | null
  finalRating: number | null
  createdAt: Date | string
  updatedAt: Date | string
  // optional relations
  department?: Department | null
  createdBy?: Pick<User, 'id' | 'nameEn' | 'nameAr' | 'role'>
  assignedTo?: Pick<User, 'id' | 'nameEn' | 'nameAr'> | null
}

export interface Competency {
  id: string
  cardId: string
  titleEn: string
  titleAr: string
  weight: number
  selfRating: number | null
  selfComment: string | null
  managerRating: number | null
  managerComment: string | null
  finalRating: number | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PerformanceCard {
  id: string
  employeeId: string
  managerId: string
  departmentId: string
  periodLabel: string
  status: CardStatus
  goalSettingLockedAt: Date | string | null
  selfReviewLockedAt: Date | string | null
  managerReviewLockedAt: Date | string | null
  calibrationCompletedAt: Date | string | null
  finalizedAt: Date | string | null
  calibrationNotes: string | null
  finalScore: number | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AuditLog {
  id: string
  action: AuditAction
  userId: string
  cardId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date | string
  // optional relations
  user?: Pick<User, 'id' | 'nameEn' | 'nameAr' | 'role'>
  card?: Pick<PerformanceCard, 'id' | 'periodLabel'> | null
}

export type CardWithRelations = PerformanceCard & {
  employee: User
  manager: User
  department: Department
  goals: Goal[]
  competencies: Competency[]
  auditLogs?: AuditLog[]
}

export type DepartmentWithRelations = Department & {
  manager: User | null
  employees: User[]
  cards?: PerformanceCard[]
}

export type UserWithRelations = User & {
  department: Department | null
  manager: User | null
  directReports: User[]
  managedDept: Department | null
  cards: PerformanceCard[]
  managedCards: PerformanceCard[]
}

export interface AnalyticsOverview {
  totalEmployees: number
  totalDepartments: number
  totalActiveCards: number
  totalFinalizedCards: number
  orgAverageScore: number
  completionRate: number
  statusDistribution: Record<CardStatus, number>
  departmentStats: Array<{
    id: string
    nameEn: string
    nameAr: string
    employeeCount: number
    averageScore: number
    completionRate: number
    activeCards: number
  }>
  recentAuditLogs: Array<{
    id: string
    action: AuditAction
    user: { nameEn: string; role: Role }
    createdAt: string
    metadata: unknown
  }>
}

export interface CardWithStatus {
  id: string
  periodLabel: string
  status: CardStatus
  finalScore: number | null
  employee: Pick<User, 'id' | 'nameEn' | 'nameAr'>
}

export interface ManagerAnalytics {
  teamSize: number
  pendingGoalApprovals: number
  pendingManagerReviews: number
  teamCards: CardWithStatus[]
  teamAverageScore: number
  statusDistribution: Record<CardStatus, number>
  topPerformers: Array<{ nameEn: string; score: number }>
}
