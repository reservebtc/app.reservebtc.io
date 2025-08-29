import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require wallet connection
  const protectedRoutes = ['/mint']
  
  // Routes that require verification
  const verificationRequiredRoutes = ['/mint']

  // Redirect old /app routes to appropriate new routes
  if (pathname.startsWith('/app')) {
    if (pathname === '/app') {
      return NextResponse.redirect(new URL('/mint', request.url))
    }
    // Handle other /app subroutes if needed
    return NextResponse.redirect(new URL('/', request.url))
  }

  // For protected routes, we can't check wallet connection server-side
  // The components themselves handle the wallet connection check
  // But we can add security headers and other middleware logic here

  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CSP headers for additional security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'none';"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}