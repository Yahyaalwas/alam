import jwt from 'jsonwebtoken'
import type { cookies } from 'next/headers'
import type { Role } from '../types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded &&
      'role' in decoded
    ) {
      return { userId: decoded.userId as string, role: decoded.role as string }
    }
    return null
  } catch {
    return null
  }
}

export function getSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): { userId: string; role: string } | null {
  const tokenCookie = cookieStore.get('token')
  if (!tokenCookie?.value) return null
  return verifyToken(tokenCookie.value)
}

export function requireRole(
  session: { role: string } | null,
  ...roles: Role[]
): asserts session is { userId: string; role: Role } {
  if (!session || !roles.includes(session.role as Role)) {
    throw new Error('Unauthorized')
  }
}
