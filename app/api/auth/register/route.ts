import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';
import { sendVerificationEmail } from '../../../utils/email';

export async function POST(request: NextRequest) {
	try {
		const { name, email, password } = await request.json();

		if (!name || !email || !password) {
			return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Validate password strength
		if (password.length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
		}

		// Create user
		const result = await convex.mutation(api.auth.createUser, {
			name,
			email,
			password,
		});

		if (result.success) {
			// Generate verification token
			const verificationResult = await convex.mutation(api.auth.generateEmailVerificationToken, { email });

			if (verificationResult.success) {
				// Send verification email
				await sendVerificationEmail({
					email,
					verificationToken: verificationResult.verificationToken,
					userName: verificationResult.user.name,
				});

				return NextResponse.json({
					success: true,
					message: 'Account created successfully! Please check your email to verify your account.',
				});
			} else {
				return NextResponse.json({ error: 'Failed to generate verification token' }, { status: 500 });
			}
		} else {
			return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
		}
	} catch (error: any) {
		console.error('Registration error:', error);
		return NextResponse.json({ error: error.message || 'Failed to register user' }, { status: 500 });
	}
}
