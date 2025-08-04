import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session_token')?.value;

		if (!sessionToken) {
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		const user = await convex.query(api.auth.getCurrentUser, {
			sessionToken,
		});

		console.log('Auth check API: Retrieved user from Convex:', user);

		if (!user) {
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		const userResponse = {
			id: user._id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		console.log('Auth check API: Retrieved user from Convex:', user);
		console.log('Auth check API: Returning user data:', userResponse);

		return NextResponse.json({
			authenticated: true,
			user: userResponse,
		});
	} catch (error) {
		return NextResponse.json({ authenticated: false }, { status: 401 });
	}
}
