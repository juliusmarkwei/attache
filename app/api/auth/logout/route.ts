import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session_token')?.value;

		if (sessionToken) {
			// Logout from Convex
			await convex.mutation(api.auth.logout, { sessionToken });
		}

		// Clear session cookie
		const response = NextResponse.json({ success: true });
		response.cookies.delete('session_token');

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
	}
}
