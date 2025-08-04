import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionToken = request.cookies.get('session_token')?.value;

	const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify'];
	const dashboardPages = ['/dashboard', '/gmail-setup'];

	const isAuthPage = authPages.some((page) => pathname.startsWith(page));
	const isDashboardPage = dashboardPages.some((page) => pathname.startsWith(page));

	if (pathname === '/') {
		if (sessionToken) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		} else {
			return NextResponse.redirect(new URL('/login', request.url));
		}
	}

	if (sessionToken && isAuthPage) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	if (!sessionToken && isDashboardPage) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|public).*)',
	],
};
