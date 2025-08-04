'use client';

import { useQuery } from 'convex/react';
import { Download, FileSpreadsheet, FileText, FileType, Image, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { Button } from './button';

interface Document {
	_id: string;
	originalName: string;
	contentType: string;
	size: number;
	storageId: string;
	uploadedAt: number;
}

interface EnhancedDocumentViewerProps {
	isOpen: boolean;
	onClose: () => void;
	document: Document | null;
	storageId: string;
}

export default function EnhancedDocumentViewer({ isOpen, onClose, document, storageId }: EnhancedDocumentViewerProps) {
	const [error, setError] = useState<string | null>(null);

	// Get file URL from Convex
	const fileUrl = useQuery(api.files.getFileUrl, storageId ? { storageId } : 'skip');

	// Get file icon based on content type
	const getFileIcon = (contentType: string) => {
		if (contentType.includes('pdf')) return <FileText className="h-8 w-8 text-blue-400" />;
		if (contentType.includes('image')) return <Image className="h-8 w-8 text-green-400" />;
		if (contentType.includes('spreadsheet') || contentType.includes('excel'))
			return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
		if (contentType.includes('word') || contentType.includes('document') || contentType.includes('text'))
			return <FileText className="h-8 w-8 text-blue-500" />;
		return <FileType className="h-8 w-8 text-slate-400" />;
	};

	// Format file size
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	// Check for loading state
	const isLoading = fileUrl === undefined;

	// Handle download
	const handleDownload = async () => {
		if (!fileUrl) return;

		try {
			const response = await fetch(fileUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement('a');
			a.href = url;
			a.download = document?.originalName || 'document';
			window.document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			window.document.body.removeChild(a);
		} catch (error) {
			console.error('Download failed:', error);
		}
	};

	// Render content based on file type
	const renderContent = () => {
		if (!fileUrl) return null;

		const contentType = document?.contentType || '';

		if (contentType.includes('pdf')) {
			return (
				<iframe
					src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
					className="w-full h-full border-0"
					title={document?.originalName}
					style={{ minHeight: '100vh' }}
				/>
			);
		}

		if (contentType.includes('image')) {
			return (
				<img
					src={fileUrl}
					alt={document?.originalName}
					className="max-w-full max-h-full object-contain mx-auto"
				/>
			);
		}

		// For other file types, show a preview with download option
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8">
				{getFileIcon(contentType)}
				<h3 className="text-lg font-medium text-white mt-4 mb-2">{document?.originalName}</h3>
				<p className="text-slate-400 mb-4">This file type cannot be previewed directly.</p>
				<Button onClick={handleDownload} className="bg-[#FFB900] text-slate-900 hover:bg-[#FFB900]/90">
					<Download className="h-4 w-4 mr-2" />
					Download to View
				</Button>
			</div>
		);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<div className="relative bg-slate-900 border border-slate-700 shadow-2xl w-full h-full">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-slate-700">
					<div className="flex items-center space-x-3">
						{getFileIcon(document?.contentType || '')}
						<div>
							<h2 className="text-lg font-semibold text-white">{document?.originalName}</h2>
							<div className="flex items-center space-x-4 text-sm text-slate-400">
								<span>{formatFileSize(document?.size || 0)}</span>
								<span>•</span>
								<span>{document?.contentType}</span>
								<span>•</span>
								<span>{new Date(document?.uploadedAt || 0).toLocaleDateString()}</span>
							</div>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Button
							onClick={handleDownload}
							variant="outline"
							size="sm"
							className="border-slate-600 text-slate-300 hover:bg-slate-700"
						>
							<Download className="h-4 w-4 mr-2" />
							Download
						</Button>
						<Button onClick={onClose} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
							<X className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-hidden">
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB900] mx-auto mb-4"></div>
								<p className="text-slate-400">Loading document...</p>
							</div>
						</div>
					) : error ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<div className="text-red-400 mb-4">
									<X className="h-12 w-12 mx-auto" />
								</div>
								<p className="text-red-400 mb-4">{error}</p>
								<Button onClick={onClose} variant="outline">
									Close
								</Button>
							</div>
						</div>
					) : (
						<div className="h-full w-full">{renderContent()}</div>
					)}
				</div>
			</div>
		</div>
	);
}
