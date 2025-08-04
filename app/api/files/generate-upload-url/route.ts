import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function GET(request: NextRequest) {
	try {
		const uploadUrl = await convex.mutation(api.files.generateUploadUrl);

		return NextResponse.json({
			url: uploadUrl,
		});
	} catch (error) {
		console.error('Error generating upload URL:', error);
		return NextResponse.json(
			{
				error: 'Failed to generate upload URL',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
