import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const documentId = searchParams.get('documentId');

		if (!documentId) {
			return NextResponse.json(
				{
					error: 'Document ID is required',
				},
				{ status: 400 },
			);
		}

		const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

		const document = await convexClient.query(api.documents.getDocumentById, {
			documentId: documentId as Id<'documents'>,
		});

		if (!document) {
			return NextResponse.json(
				{
					error: 'Document not found',
				},
				{ status: 404 },
			);
		}

		await convexClient.mutation(api.documents.deleteDocument, {
			documentId: documentId as Id<'documents'>,
		});

		if (document.storageId) {
			try {
				await convexClient.mutation(api.files.deleteFile, {
					storageId: document.storageId,
				});
			} catch (error) {
				console.error('Error deleting file from storage:', error);
				// Continue even if storage deletion fails - the database record is already deleted
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting document:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
