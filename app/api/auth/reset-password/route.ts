import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const { token, newPassword } = await request.json();

		if (!token || !newPassword) {
			return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
		}

		// Validate password strength
		if (newPassword.length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
		}

		// Reset password
		const result = await convex.mutation(api.auth.resetPassword, {
			token,
			newPassword,
		});

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: 'Password reset successfully',
			});
		} else {
			return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
		}
	} catch (error: any) {
		console.error('Reset password error:', error);
		return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
	}
}
