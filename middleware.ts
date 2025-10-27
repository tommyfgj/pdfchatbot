import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 如果是 /oauth2/* 路径，不做任何处理
  // 这些请求应该由 oauth2-proxy 处理
  if (request.nextUrl.pathname.startsWith('/oauth2/')) {
    return NextResponse.next();
  }

  // 对于其他请求，继续正常处理
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
