import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { storageId, filename, contentType, size } = body;

		if (!storageId || !filename || !contentType || !size) {
			return NextResponse.json(
				{
					error: 'Missing required fields',
					message: 'storageId, filename, contentType, and size are required',
				},
				{ status: 400 },
			);
		}

		await convex.mutation(api.files.saveFileMetadata, {
			storageId,
			filename,
			contentType,
			size,
		});

		return NextResponse.json({
			success: true,
			message: 'File metadata saved successfully',
		});
	} catch (error) {
		console.error('Error saving file metadata:', error);
		return NextResponse.json(
			{
				error: 'Failed to save file metadata',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
