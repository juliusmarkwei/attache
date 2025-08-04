import { Download, Eye, FileSpreadsheet, FileText, FileType, Image, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface DocumentViewerProps {
	document: {
		_id: string;
		originalName: string;
		filename: string;
		contentType: string;
		size: number;
		storageId: string;
		uploadedAt: number;
		companyId: string;
	};
	company?: {
		_id: string;
		name: string;
	};
	onClose: () => void;
}

export default function DocumentViewer({ document, company, onClose }: DocumentViewerProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const getFileIcon = (contentType: string) => {
		if (contentType.includes('pdf')) return <FileText className="h-8 w-8 text-blue-400" />;
		if (contentType.includes('image')) return <Image className="h-8 w-8 text-green-400" />;
		if (contentType.includes('spreadsheet') || contentType.includes('excel'))
			return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
		if (contentType.includes('word') || contentType.includes('document') || contentType.includes('text'))
			return <FileText className="h-8 w-8 text-blue-500" />;
		return <FileType className="h-8 w-8 text-slate-400" />;
	};

	const handleDownload = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(
				`/api/documents/download?storageId=${document.storageId}&filename=${encodeURIComponent(document.originalName)}`,
			);

			if (!response.ok) {
				throw new Error('Failed to download document');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = window.document.createElement('a');
			a.href = url;
			a.download = document.originalName;
			window.document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			window.document.body.removeChild(a);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Download failed');
		} finally {
			setIsLoading(false);
		}
	};

	const canPreview =
		document.contentType.includes('pdf') ||
		document.contentType.includes('image') ||
		document.contentType.includes('text');

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
			<div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-slate-700">
					<div className="flex items-center space-x-3">
						<div>{getFileIcon(document.contentType)}</div>
						<div>
							<h2 className="text-lg font-semibold text-white">{document.originalName}</h2>
							<div className="flex items-center space-x-4 text-sm text-slate-400">
								<span>{formatFileSize(document.size)}</span>
								<span>•</span>
								<span>{document.contentType}</span>
								<span>•</span>
								<span>{company?.name || 'Unknown Company'}</span>
								<span>•</span>
								<span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
							disabled={isLoading}
							className="border-slate-600 text-slate-200 hover:bg-slate-700"
						>
							<Download className="h-4 w-4 mr-1" />
							{isLoading ? 'Downloading...' : 'Download'}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="text-slate-400 hover:text-white hover:bg-slate-700"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-hidden">
					{error && (
						<div className="p-4 text-center">
							<div className="text-red-400 mb-2">Error: {error}</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleDownload}
								disabled={isLoading}
								className="border-slate-600 text-slate-200 hover:bg-slate-700"
							>
								<Download className="h-4 w-4 mr-1" />
								Try Download Again
							</Button>
						</div>
					)}

					{!error && (
						<div className="h-full">
							{canPreview ? (
								<div className="h-full flex items-center justify-center bg-slate-900">
									{document.contentType.includes('pdf') ? (
										<iframe
											src={`/api/documents/preview?storageId=${document.storageId}&filename=${encodeURIComponent(document.originalName)}`}
											className="w-full h-full"
											title={document.originalName}
										/>
									) : document.contentType.includes('image') ? (
										<img
											src={`/api/documents/preview?storageId=${document.storageId}&filename=${encodeURIComponent(document.originalName)}`}
											alt={document.originalName}
											className="max-w-full max-h-full object-contain"
										/>
									) : (
										<div className="text-center text-slate-400">
											<Eye className="h-12 w-12 mx-auto mb-4" />
											<p>Preview not available for this file type</p>
											<p className="text-sm mt-2">Use the download button to view the file</p>
										</div>
									)}
								</div>
							) : (
								<div className="h-full flex items-center justify-center bg-slate-900">
									<div className="text-center text-slate-400">
										<div className="text-4xl mb-4">{getFileIcon(document.contentType)}</div>
										<p className="text-lg mb-2">Preview not available</p>
										<p className="text-sm mb-4">
											This file type cannot be previewed in the browser
										</p>
										<Button
											variant="outline"
											onClick={handleDownload}
											disabled={isLoading}
											className="border-slate-600 text-slate-200 hover:bg-slate-700"
										>
											<Download className="h-4 w-4 mr-2" />
											Download to View
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
