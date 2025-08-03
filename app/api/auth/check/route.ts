import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session_token')?.value;
		console.log('🔍 Auth check - Session token:', sessionToken ? 'Present' : 'Missing');

		if (!sessionToken) {
			console.log('❌ No session token found');
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		// Check if session is valid
		const user = await convex.query(api.auth.getCurrentUser, {
			sessionToken,
		});

		console.log('🔍 Auth check - User from Convex:', user ? 'Found' : 'Not found');

		if (!user) {
			console.log('❌ No user found for session token');
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		console.log('✅ Auth check - User authenticated:', user._id);
		return NextResponse.json({
			authenticated: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error('❌ Auth check error:', error);
		return NextResponse.json({ authenticated: false }, { status: 401 });
	}
}
