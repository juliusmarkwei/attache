import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Login user
		const result = await convex.mutation(api.auth.loginUser, {
			email,
			password,
		});

		if (result.success) {
			// Set session token in HTTP-only cookie
			const response = NextResponse.json({
				success: true,
				user: result.user,
				message: 'Login successful',
			});
			response.cookies.set('session_token', result.sessionToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60, // 7 days
			});

			return response;
		} else {
			return NextResponse.json({ error: 'Login failed' }, { status: 400 });
		}
	} catch (error: any) {
		console.error('Login error:', error);
		return NextResponse.json({ error: error.message || 'Failed to login' }, { status: 500 });
	}
}
