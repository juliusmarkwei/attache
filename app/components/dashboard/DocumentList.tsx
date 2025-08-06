'use client';

import { useQuery } from 'convex/react';
import { Building2, Calendar, Download, FileText, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../hooks/useAuth';
import { Document, DocumentListProps } from '../../types';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../utils/constants';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import ConfirmationModal from '../ui/confirmation-modal';

export default function DocumentList({ companyId }: DocumentListProps) {
	const { user } = useAuth();
	const [deletingDocument, setDeletingDocument] = useState<string | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
	const documents = useQuery(
		companyId ? api.documents.getDocumentsByUserCompany : api.documents.getAllDocuments,
		companyId ? { userCompanyId: companyId as Id<'user_companies'> } : { userId: user?.id as Id<'users'> },
	);

	if (!documents) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB900]"></div>
			</div>
		);
	}

	if (documents.length === 0) {
		return (
			<Card className="bg-slate-800/80 border-slate-700">
				<CardContent className="text-center py-12">
					<FileText className="mx-auto h-12 w-12 text-slate-400" />
					<h3 className="mt-2 text-sm font-medium text-slate-100">No documents</h3>
					<p className="mt-1 text-sm text-slate-400">Documents will appear here when received via email.</p>
				</CardContent>
			</Card>
		);
	}

	const handleDownload = async (storageId: string, filename: string) => {
		try {
			const response = await fetch(
				`${API_ENDPOINTS.documents.download}?storageId=${storageId}&filename=${encodeURIComponent(filename)}`,
			);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success(SUCCESS_MESSAGES.download, {
					description: `${filename} is being downloaded.`,
				});
			} else {
				toast.error('Download failed', {
					description: ERROR_MESSAGES.serverError,
				});
			}
		} catch (error) {
			toast.error('Download failed', {
				description: ERROR_MESSAGES.network,
			});
		}
	};

	const handleDelete = async (documentId: string, filename: string) => {
		setDeletingDocument(documentId);
		setShowDeleteModal(false);

		try {
			const response = await fetch(`${API_ENDPOINTS.documents.delete}?documentId=${documentId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				toast.success(SUCCESS_MESSAGES.delete, {
					description: `${filename} has been deleted.`,
				});
			} else {
				const errorData = await response.json();
				toast.error('Delete failed', {
					description: errorData.error || ERROR_MESSAGES.serverError,
				});
			}
		} catch (error) {
			toast.error('Delete failed', {
				description: ERROR_MESSAGES.network,
			});
		} finally {
			setDeletingDocument(null);
		}
	};

	const openDeleteModal = (documentId: string, filename: string) => {
		setDocumentToDelete({ id: documentId, name: filename });
		setShowDeleteModal(true);
	};

	const closeDeleteModal = () => {
		setShowDeleteModal(false);
		setDocumentToDelete(null);
	};

	return (
		<>
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-slate-100">Recent Documents</h2>
				<div className="space-y-3">
					{documents.map((doc: Document) => (
						<Card
							key={doc._id}
							className="hover:shadow-md transition-shadow bg-slate-800/80 border-slate-700"
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<div className="flex-shrink-0">
											<FileText className="h-8 w-8 text-[#FFB900]" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-2">
												<p className="text-sm font-medium text-slate-100 truncate">
													{doc.originalName}
												</p>
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FFB900]/20 text-[#FFB900]">
													{formatFileSize(doc.size)}
												</span>
											</div>
											<div className="flex items-center space-x-4 mt-1 text-xs text-slate-400">
												<div className="flex items-center">
													<Building2 className="h-3 w-3 mr-1" />
													{doc.company?.name || 'Unknown Company'}
												</div>
												{doc.uploadedBy && (
													<div className="flex items-center">
														<User className="h-3 w-3 mr-1" />
														{doc.uploadedBy}
													</div>
												)}
												<div className="flex items-center">
													<Calendar className="h-3 w-3 mr-1" />
													{formatDate(doc.uploadedAt)}
												</div>
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDownload(doc.storageId, doc.originalName)}
											className="flex-shrink-0 text-slate-300 hover:text-slate-100 hover:bg-slate-700 h-10 w-10 rounded-lg"
											title="Download document"
										>
											<Download className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => openDeleteModal(doc._id, doc.originalName)}
											disabled={deletingDocument === doc._id}
											className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-600/20 h-10 w-10 rounded-lg disabled:opacity-50"
											title="Delete document"
										>
											{deletingDocument === doc._id ? (
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDeleteModal}
				onClose={closeDeleteModal}
				onConfirm={() => documentToDelete && handleDelete(documentToDelete.id, documentToDelete.name)}
				title="Delete Document"
				description={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
				confirmText="Delete Document"
				cancelText="Cancel"
				isLoading={deletingDocument === documentToDelete?.id}
			/>
		</>
	);
}
