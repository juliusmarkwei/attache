import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';
import { sendWelcomeEmail } from '../../../utils/email';

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json();

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// Get user info before verification
		const user = await convex.query(api.auth.getUserByVerificationToken, { token });

		if (!user) {
			return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
		}

		// Verify email with token
		const result = await convex.mutation(api.auth.verifyEmail, { token });

		if (result.success) {
			// Send welcome email after successful verification
			try {
				await sendWelcomeEmail({
					email: user.email,
					companyName: user.name,
				});
			} catch (emailError) {
				console.error('Failed to send welcome email:', emailError);
				// Don't fail the verification if welcome email fails
			}

			return NextResponse.json({
				success: true,
				message: 'Email verified successfully! Welcome to Attache. You can now sign in to your account.',
			});
		} else {
			return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
		}
	} catch (error: any) {
		console.error('Email verification error:', error);
		return NextResponse.json({ error: error.message || 'Failed to verify email' }, { status: 500 });
	}
}
