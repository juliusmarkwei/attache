import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';
import { sendPasswordResetEmail } from '../../../utils/email';

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Generate reset token
		const result = await convex.mutation(api.auth.forgotPassword, { email });

		if (result.success) {
			// Send password reset email
			await sendPasswordResetEmail({
				email,
				resetToken: result.resetToken,
				userName: result.user.name,
			});

			return NextResponse.json({
				success: true,
				message: 'Password reset email sent successfully',
			});
		} else {
			return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
		}
	} catch (error: any) {
		console.error('Forgot password error:', error);
		// Don't reveal if user exists or not for security
		return NextResponse.json({
			success: true,
			message: 'If an account with this email exists, a password reset link has been sent.',
		});
	}
}
