import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionToken = request.cookies.get('session_token')?.value;

	// Skip API routes and static files completely
	if (
		pathname.startsWith('/api') ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/favicon.ico') ||
		pathname.startsWith('/public') ||
		pathname.includes('.')
	) {
		// Static files with extensions
		return NextResponse.next();
	}

	const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
	const dashboardPages = ['/dashboard', '/gmail-setup'];

	const isAuthPage = authPages.some((page) => pathname.startsWith(page));
	const isDashboardPage = dashboardPages.some((page) => pathname.startsWith(page));

	// Handle root path
	if (pathname === '/') {
		if (sessionToken) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		} else {
			return NextResponse.redirect(new URL('/login', request.url));
		}
	}

	// Redirect authenticated users away from auth pages
	if (sessionToken && isAuthPage) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	// Redirect unauthenticated users to login
	if (!sessionToken && isDashboardPage) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	// Handle unknown routes
	const knownRoutes = [
		'/login',
		'/signup',
		'/forgot-password',
		'/reset-password',
		'/verify-email',
		'/dashboard',
		'/gmail-setup',
	];

	const isKnownRoute = knownRoutes.some((route) => pathname.startsWith(route));

	if (!isKnownRoute && pathname !== '/') {
		if (sessionToken) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		} else {
			return NextResponse.redirect(new URL('/login', request.url));
		}
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
		 * - files with extensions (static files)
		 */
		'/((?!api|_next|favicon.ico|public|.*\\..*).*)',
	],
};
