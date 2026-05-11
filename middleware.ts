import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value
  const session = token ? verifyToken(token) : null

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/performance')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/login')) {
    if (session) {
      const dest = session.role === 'MANAGER' ? '/dashboard/manager' : '/dashboard/employee'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/performance/:path*', '/login'],
}
