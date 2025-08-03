import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json();

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// Verify reset token
		const result = await convex.query(api.auth.verifyResetToken, { token });

		return NextResponse.json(result);
	} catch (error: any) {
		console.error('Token verification error:', error);
		return NextResponse.json({ valid: false });
	}
}
