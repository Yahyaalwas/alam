import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import type { Role } from './types'

function getRoleDestination(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/dashboard/admin'
    case 'DEPARTMENT_MANAGER':
      return '/dashboard/manager'
    case 'EMPLOYEE':
    default:
      return '/dashboard/employee'
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  const role = payload?.role as Role | undefined

  // Redirect logged-in users away from /login
  if (pathname.startsWith('/login')) {
    if (payload && role) {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
    return NextResponse.next()
  }

  // Allow public API routes
  if (pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  // Protect all other routes
  if (!payload || !role) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }

  // Role-based dashboard guards
  if (pathname.startsWith('/dashboard/admin')) {
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  if (pathname.startsWith('/dashboard/manager')) {
    if (role !== 'DEPARTMENT_MANAGER' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  if (pathname.startsWith('/dashboard/employee')) {
    if (role !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  // Department management: admin only
  if (pathname.startsWith('/departments')) {
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  // User management: admin only
  if (pathname.startsWith('/users')) {
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  // Analytics: admin or manager
  if (pathname.startsWith('/analytics')) {
    if (role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
    }
  }

  // Root /dashboard redirect
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(getRoleDestination(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
