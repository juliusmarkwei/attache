import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		// Verify the request is authorized (you can add more security here)
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		// In production, you might want to verify this token against a secret
		if (token !== process.env.CLEANUP_SECRET) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		// Run cleanup
		const result = await convex.mutation(api.auth.cleanupExpiredTokens);

		return NextResponse.json({
			success: true,
			message: 'Cleanup completed successfully',
			result,
		});
	} catch (error) {
		console.error('Cleanup error:', error);
		return NextResponse.json({ error: error instanceof Error ? error.message : 'Cleanup failed' }, { status: 500 });
	}
}
