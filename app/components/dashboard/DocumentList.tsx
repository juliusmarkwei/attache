'use client';

import { useQuery } from 'convex/react';
import { Building2, Calendar, Download, FileText, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Document, DocumentListProps } from '../../types';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../utils/constants';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export default function DocumentList({ companyId }: DocumentListProps) {
	const documents = useQuery(
		companyId ? api.documents.getDocumentsByCompany : api.documents.getAllDocuments,
		companyId ? { companyId: companyId as any } : {},
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
			console.error('Download failed:', error);
			toast.error('Download failed', {
				description: ERROR_MESSAGES.network,
			});
		}
	};

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold text-slate-100">Recent Documents</h2>
			<div className="space-y-3">
				{documents.map((doc: Document) => (
					<Card key={doc._id} className="hover:shadow-md transition-shadow bg-slate-800/80 border-slate-700">
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
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleDownload(doc.storageId, doc.originalName)}
									className="flex-shrink-0 text-slate-300 hover:text-slate-100 hover:bg-slate-700 h-10 w-10 rounded-lg"
									title="Download document"
								>
									<Download className="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
