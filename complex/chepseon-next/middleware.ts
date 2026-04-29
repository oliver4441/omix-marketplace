import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow auth routes and public routes
  if (
    pathname.startsWith('/api/auth/') ||
    pathname === '/login' ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check for token on API routes
  if (pathname.startsWith('/api/')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    try {
      verifyToken(token)
      return NextResponse.next()
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  }

  // Check for token on protected pages
  const token = request.cookies.get('token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    verifyToken(token)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/students/:path*', '/classes/:path*'],
}
