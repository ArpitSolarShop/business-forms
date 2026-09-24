import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Let public routes pass without PIN
  if (
    path.startsWith('/f/') || 
    path.startsWith('/api/') || 
    path.startsWith('/_next') || 
    path === '/login' ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check PIN for all other routes (Admin Routes)
  const pin = request.cookies.get('admin_pin')?.value;
  const expectedPin = process.env.ADMIN_PIN || '1911';
  if (pin !== expectedPin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
