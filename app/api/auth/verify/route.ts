import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const { email, otp } = await request.json();

		if (!email || !otp) {
			return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
		}

		// Verify OTP and create session
		const result = await convex.mutation(api.auth.verifyOTP, {
			email,
			otp,
		});

		if (result.success) {
			// Set session token in HTTP-only cookie
			const response = NextResponse.json({
				success: true,
				user: result.user,
				message: 'OTP verified successfully',
			});
			response.cookies.set('session_token', result.sessionToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60, // 7 days
			});

			return response;
		} else {
			return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
		}
	} catch (error) {
		console.error('OTP verification error:', error);
		return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
	}
}
