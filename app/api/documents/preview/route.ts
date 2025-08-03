import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { convex } from '../../../utils/convex';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const storageId = searchParams.get('storageId');
		const filename = searchParams.get('filename');

		if (!storageId || !filename) {
			return NextResponse.json({ error: 'Storage ID and filename are required' }, { status: 400 });
		}

		// Get the file URL from Convex
		const fileUrl = await convex.query(api.files.getFileUrl, { storageId });

		if (!fileUrl) {
			return NextResponse.json({ error: 'File not found' }, { status: 404 });
		}

		// Fetch the file from Convex storage
		const response = await fetch(fileUrl);

		if (!response.ok) {
			return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
		}

		const fileBuffer = await response.arrayBuffer();

		// Return the file with preview headers (no download trigger)
		return new NextResponse(fileBuffer, {
			headers: {
				'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	} catch (error) {
		console.error('Document preview error:', error);
		return NextResponse.json({ error: 'Failed to preview document' }, { status: 500 });
	}
}
