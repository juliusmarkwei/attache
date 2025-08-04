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

		if (!user) {
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		return NextResponse.json({
			authenticated: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				profilePicture: user.profilePicture,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		});
	} catch (error) {
		return NextResponse.json({ authenticated: false }, { status: 401 });
	}
}
