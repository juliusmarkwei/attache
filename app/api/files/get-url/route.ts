import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const storageId = searchParams.get('storageId');

		if (!storageId) {
			return NextResponse.json(
				{
					error: 'Storage ID is required',
				},
				{ status: 400 },
			);
		}

		const fileUrl = await convex.query(api.files.getFileUrl, { storageId });

		if (!fileUrl) {
			return NextResponse.json(
				{
					error: 'File not found',
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({
			url: fileUrl,
		});
	} catch (error) {
		console.error('Error getting file URL:', error);
		return NextResponse.json(
			{
				error: 'Failed to get file URL',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
