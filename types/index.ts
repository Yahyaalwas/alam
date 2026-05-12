export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR'

export type CardStatus = 'DRAFT' | 'SELF_SUBMITTED' | 'MANAGER_SUBMITTED' | 'FINALIZED'

export interface SessionUser {
  userId: string
  role: UserRole
}

export interface User {
  id: string
  email: string
  nameEn: string
  nameAr: string
  role: UserRole
  managerId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Goal {
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

export interface CardWithRelations {
  id: string
  employeeId: string
  managerId: string
  periodLabel: string
  status: CardStatus
  selfReviewLockedAt: Date | string | null
  managerReviewLockedAt: Date | string | null
  finalizedAt: Date | string | null
  finalScore: number | null
  createdAt: Date | string
  updatedAt: Date | string
  employee: User
  manager: User
  goals: Goal[]
  competencies: Competency[]
}
