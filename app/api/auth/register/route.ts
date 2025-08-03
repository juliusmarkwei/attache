import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';
import { sendOTPEmail } from '../../../utils/email';

export async function POST(request: NextRequest) {
	try {
		const { name, email } = await request.json();

		if (!name || !email) {
			return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
		}

		const user = await convex.query(api.auth.getUserByEmail, { email });
		if (user) {
			return NextResponse.json({ error: 'User already exists' }, { status: 400 });
		}

		const result = await convex.mutation(api.auth.createUser, {
			name,
			email,
		});

		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		await convex.mutation(api.auth.generateOTP, { email, otp });

		await sendOTPEmail({ email, otp, companyName: name });

		return NextResponse.json(result);
	} catch (error: any) {
		console.error('Company registration error:', error);
		return NextResponse.json({ error: error.message || 'Failed to register company' }, { status: 500 });
	}
}
