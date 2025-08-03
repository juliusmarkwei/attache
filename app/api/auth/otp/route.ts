import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';
import { sendOTPEmail } from '../../../utils/email';

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

		// Generate OTP locally for email sending
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Store OTP in Convex
		const result = await convex.mutation(api.auth.generateOTP, {
			email,
			otp,
		});

		console.log('Generated OTP:', otp); // Debug log

		// Send OTP email
		await sendOTPEmail({ email, otp });

		return NextResponse.json(result);
	} catch (error) {
		console.error('OTP generation error:', error);
		return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
	}
}
