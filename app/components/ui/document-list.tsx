'use client';

import { formatFileSize } from '@/utils/formatters';
import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { GetFileIcon } from '../dashboard/GetFileIcon';
import { Button } from './button';
import EnhancedDocumentViewer from './enhanced-document-viewer';

interface Document {
	_id: string;
	originalName: string;
	filename: string;
	contentType: string;
	size: number;
	storageId: string;
	uploadedAt: number;
	userCompanyId: Id<'user_companies'>;
}

interface Company {
	_id: string;
	name: string;
}

interface DocumentListProps {
	documents: Document[];
	companies?: Company[];
	onDelete?: (documentId: string, filename: string) => void;
	onDeleteRequest?: (documentId: string, filename: string) => void;
	showDeleteButton?: boolean;
	className?: string;
	deletingDocumentId?: string | null;
}

export default function DocumentList({
	documents,
	companies,
	onDelete,
	onDeleteRequest,
	showDeleteButton = false,
	className = '',
	deletingDocumentId = null,
}: DocumentListProps) {
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
	const [deletingDocument, setDeletingDocument] = useState<string | null>(null);

	const handleDownload = async (doc: Document) => {
		try {
			const response = await fetch(
				`/api/documents/download?storageId=${doc.storageId}&filename=${encodeURIComponent(doc.originalName)}`,
			);

			if (!response.ok) {
				throw new Error('Failed to download document');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement('a');
			a.href = url;
			a.download = doc.originalName;
			window.document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			window.document.body.removeChild(a);
		} catch (error) {
			console.error('Download failed:', error);
		}
	};

	const handleDelete = async (documentId: string, filename: string) => {
		if (onDeleteRequest) {
			// Use confirmation flow
			onDeleteRequest(documentId, filename);
		} else if (onDelete) {
			// Direct delete (for backward compatibility)
			setDeletingDocument(documentId);
			try {
				await onDelete(documentId, filename);
			} finally {
				setDeletingDocument(null);
			}
		}
	};

	if (documents.length === 0) {
		return (
			<div className={`text-center py-12 ${className}`}>
				<div className="mb-4 flex justify-center">
					<FileText className="h-16 w-16 text-slate-400" />
				</div>
				<h3 className="text-lg font-medium text-slate-200 mb-2">No documents found</h3>
				<p className="text-slate-400">No documents available for this company.</p>
			</div>
		);
	}

	return (
		<>
			<div className={`space-y-4 ${className}`}>
				{documents.map((doc) => {
					const company = companies?.find((c) => c._id === doc.userCompanyId);
					return (
						<div
							key={doc._id}
							className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors"
						>
							<div className="flex items-center space-x-4">
								<div>{GetFileIcon(doc.contentType)}</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-medium text-slate-100 truncate">{doc.originalName}</h3>
									<div className="flex items-center space-x-4 mt-1 text-xs text-slate-400">
										<span>{formatFileSize(doc.size)}</span>
										<span>•</span>
										<span>{doc.contentType}</span>
										{company && (
											<>
												<span>•</span>
												<span>{company.name}</span>
											</>
										)}
										<span>•</span>
										<span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSelectedDocument(doc);
									}}
									className="border-slate-600 text-slate-200 hover:bg-transparent hover:text-slate-200 hover:cursor-pointer"
									title="View document"
								>
									<Eye className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDownload(doc)}
									className="border-slate-600 text-slate-200 hover:bg-transparent hover:text-slate-200 hover:cursor-pointer"
									title="Download document"
								>
									<Download className="h-4 w-4" />
								</Button>
								{showDeleteButton && (onDelete || onDeleteRequest) && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(doc._id, doc.originalName)}
										disabled={deletingDocument === doc._id || deletingDocumentId === doc._id}
										className="border-red-600 text-red-400 hover:bg-transparent hover:text-red-400 hover:cursor-pointer disabled:opacity-50"
										title="Delete document"
									>
										{deletingDocument === doc._id || deletingDocumentId === doc._id ? (
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Document Viewer Modal */}
			<EnhancedDocumentViewer
				isOpen={!!selectedDocument}
				onClose={() => {
					setSelectedDocument(null);
				}}
				document={selectedDocument}
				storageId={selectedDocument?.storageId || ''}
			/>
		</>
	);
}
