'use client';

import { useQuery } from 'convex/react';
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, Filter, HardDrive, Search } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import DocumentViewer from '../../components/ui/document-viewer';
import { Input } from '../../components/ui/input';

import { useAuth } from '../../hooks/useAuth';

// Utility function to format file size
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to get file icon based on content type
function getFileIcon(contentType: string): string {
	if (contentType.includes('pdf')) return '📄';
	if (contentType.includes('image')) return '🖼️';
	if (contentType.includes('text')) return '📝';
	if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
	if (contentType.includes('word') || contentType.includes('document')) return '📄';
	return '📎';
}

export default function DocumentsPage() {
	const { user, loading, authChecked, handleLogout, checkAuth } = useAuth();

	// Check authentication on mount
	React.useEffect(() => {
		if (!authChecked) {
			checkAuth();
		}
	}, [authChecked, checkAuth]);

	const documents = useQuery(api.documents.getAllDocuments, user?.id ? { userId: user.id as any } : 'skip');
	const companies = useQuery(api.companies.getAllCompanies, user?.id ? { userId: user.id as any } : 'skip');

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCompany, setSelectedCompany] = useState<string>('all');
	const [dateFilter, setDateFilter] = useState<string>('all');
	const [sizeFilter, setSizeFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 20;
	const [selectedDocument, setSelectedDocument] = useState<any>(null);

	// Filter documents based on search and filters
	const filteredDocuments =
		documents?.filter((doc) => {
			// Search filter
			const matchesSearch =
				doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				doc.filename.toLowerCase().includes(searchTerm.toLowerCase());

			// Company filter
			const matchesCompany = selectedCompany === 'all' || doc.companyId === selectedCompany;

			// Date filter
			let matchesDate = true;
			if (dateFilter !== 'all') {
				const docDate = new Date(doc.uploadedAt);
				const now = new Date();
				const diffInDays = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);

				switch (dateFilter) {
					case 'today':
						matchesDate = diffInDays <= 1;
						break;
					case 'week':
						matchesDate = diffInDays <= 7;
						break;
					case 'month':
						matchesDate = diffInDays <= 30;
						break;
					case 'year':
						matchesDate = diffInDays <= 365;
						break;
				}
			}

			// Size filter
			let matchesSize = true;
			if (sizeFilter !== 'all') {
				const sizeInMB = doc.size / (1024 * 1024);
				switch (sizeFilter) {
					case 'small':
						matchesSize = sizeInMB < 1;
						break;
					case 'medium':
						matchesSize = sizeInMB >= 1 && sizeInMB < 10;
						break;
					case 'large':
						matchesSize = sizeInMB >= 10;
						break;
				}
			}

			// Type filter
			let matchesType = true;
			if (typeFilter !== 'all') {
				switch (typeFilter) {
					case 'pdf':
						matchesType = doc.contentType.includes('pdf');
						break;
					case 'image':
						matchesType = doc.contentType.includes('image');
						break;
					case 'document':
						matchesType =
							doc.contentType.includes('word') ||
							doc.contentType.includes('document') ||
							doc.contentType.includes('text');
						break;
					case 'spreadsheet':
						matchesType =
							doc.contentType.includes('spreadsheet') ||
							doc.contentType.includes('excel') ||
							doc.contentType.includes('sheet');
						break;
					case 'presentation':
						matchesType =
							doc.contentType.includes('presentation') ||
							doc.contentType.includes('powerpoint') ||
							doc.contentType.includes('slides');
						break;
					case 'other':
						matchesType =
							!doc.contentType.includes('pdf') &&
							!doc.contentType.includes('image') &&
							!doc.contentType.includes('word') &&
							!doc.contentType.includes('document') &&
							!doc.contentType.includes('text') &&
							!doc.contentType.includes('spreadsheet') &&
							!doc.contentType.includes('excel') &&
							!doc.contentType.includes('sheet') &&
							!doc.contentType.includes('presentation') &&
							!doc.contentType.includes('powerpoint') &&
							!doc.contentType.includes('slides');
						break;
				}
			}

			return matchesSearch && matchesCompany && matchesDate && matchesSize && matchesType;
		}) || [];

	// Calculate pagination
	const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

	// Calculate statistics
	const totalSize = documents?.reduce((sum, doc) => sum + doc.size, 0) || 0;
	const recentDocuments =
		documents?.filter((doc) => {
			const diffInDays = (Date.now() - doc.uploadedAt) / (1000 * 60 * 60 * 24);
			return diffInDays <= 7;
		}).length || 0;

	// Show loading state while data is being fetched
	if (!documents || !companies) {
		return (
			<DashboardLayout onLogout={handleLogout} user={user}>
				<div className="space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-white">Documents</h1>
							<p className="text-slate-400 mt-1">View and manage all your email attachments</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Search documents..."
									disabled
									className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
								/>
							</div>
						</div>
					</div>

					{/* Loading statistics */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 animate-pulse"
							>
								<div className="space-y-4">
									<div className="h-4 bg-slate-700 rounded w-3/4"></div>
									<div className="h-8 bg-slate-700 rounded w-1/2"></div>
									<div className="h-3 bg-slate-700 rounded w-2/3"></div>
								</div>
							</div>
						))}
					</div>

					{/* Loading filters */}
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100 flex items-center">
								<Filter className="h-5 w-5 mr-2" />
								Filters
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className="space-y-2">
										<div className="h-4 bg-slate-700 rounded w-1/3"></div>
										<div className="h-10 bg-slate-700 rounded"></div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Loading documents list */}
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100">All Documents</CardTitle>
							<CardDescription className="text-slate-400">Loading documents...</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Array.from({ length: 5 }).map((_, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 animate-pulse"
									>
										<div className="flex items-center space-x-4">
											<div className="w-8 h-8 bg-slate-600 rounded"></div>
											<div className="flex-1 space-y-2">
												<div className="h-4 bg-slate-600 rounded w-3/4"></div>
												<div className="h-3 bg-slate-600 rounded w-1/2"></div>
											</div>
										</div>
										<div className="w-20 h-8 bg-slate-600 rounded"></div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</DashboardLayout>
		);
	}

	// Sample notifications for testing
	const sampleNotifications = [
		{
			id: '1',
			title: 'Document Processed',
			message: 'fullstack_technical_interview_question.pdf has been processed',
			timestamp: new Date(),
			type: 'document' as const,
		},
	];

	return (
		<DashboardLayout onLogout={handleLogout} user={user} notifications={sampleNotifications}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white">Documents</h1>
						<p className="text-slate-400 mt-1">View and manage all your email attachments</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search documents..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
							/>
						</div>
					</div>
				</div>

				{/* Statistics */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Total Documents</CardTitle>
							<FileText className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{documents?.length || 0}</div>
							<p className="text-xs text-slate-400">Documents processed</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Total Storage</CardTitle>
							<HardDrive className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{formatFileSize(totalSize)}</div>
							<p className="text-xs text-slate-400">Storage used</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Recent Uploads</CardTitle>
							<Calendar className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{recentDocuments}</div>
							<p className="text-xs text-slate-400">Last 7 days</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Search Results</CardTitle>
							<Search className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{filteredDocuments.length}</div>
							<p className="text-xs text-slate-400">Matching documents</p>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100 flex items-center">
							<Filter className="h-5 w-5 mr-2" />
							Filters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
								<select
									value={selectedCompany}
									onChange={(e) => setSelectedCompany(e.target.value)}
									className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
								>
									<option value="all">All Companies</option>
									{companies?.map((company) => (
										<option key={company._id} value={company._id}>
											{company.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
								<select
									value={dateFilter}
									onChange={(e) => setDateFilter(e.target.value)}
									className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
								>
									<option value="all">All Time</option>
									<option value="today">Today</option>
									<option value="week">Last 7 Days</option>
									<option value="month">Last 30 Days</option>
									<option value="year">Last Year</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">Size</label>
								<select
									value={sizeFilter}
									onChange={(e) => setSizeFilter(e.target.value)}
									className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
								>
									<option value="all">All Sizes</option>
									<option value="small">Small (&lt; 1MB)</option>
									<option value="medium">Medium (1-10MB)</option>
									<option value="large">Large (&gt; 10MB)</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">File Type</label>
								<select
									value={typeFilter}
									onChange={(e) => setTypeFilter(e.target.value)}
									className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
								>
									<option value="all">All Types</option>
									<option value="pdf">PDF Documents</option>
									<option value="image">Images</option>
									<option value="document">Word/Text Documents</option>
									<option value="spreadsheet">Spreadsheets</option>
									<option value="presentation">Presentations</option>
									<option value="other">Other Files</option>
								</select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Documents List */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100">All Documents</CardTitle>
						<CardDescription className="text-slate-400">
							Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of{' '}
							{filteredDocuments.length} documents
						</CardDescription>
					</CardHeader>
					<CardContent>
						{filteredDocuments.length === 0 ? (
							<div className="text-center py-12">
								<FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-slate-200 mb-2">No documents found</h3>
								<p className="text-slate-400">
									{searchTerm ||
									selectedCompany !== 'all' ||
									dateFilter !== 'all' ||
									sizeFilter !== 'all' ||
									typeFilter !== 'all'
										? 'Try adjusting your search terms or filters.'
										: 'Documents will appear here once you start receiving emails with attachments.'}
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{paginatedDocuments.map((doc) => {
									const company = companies?.find((c) => c._id === doc.companyId);
									return (
										<div
											key={doc._id}
											className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors"
										>
											<div className="flex items-center space-x-4">
												<div className="text-2xl">{getFileIcon(doc.contentType)}</div>
												<div className="flex-1 min-w-0">
													<h3 className="text-sm font-medium text-slate-100 truncate">
														{doc.originalName}
													</h3>
													<div className="flex items-center space-x-4 mt-1 text-xs text-slate-400">
														<span>{formatFileSize(doc.size)}</span>
														<span>•</span>
														<span>{doc.contentType}</span>
														<span>•</span>
														<span>{company?.name || 'Unknown Company'}</span>
														<span>•</span>
														<span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedDocument({ ...doc, company })}
													className="border-slate-600 text-slate-200 hover:bg-slate-700"
													title="View document"
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={async () => {
														try {
															const response = await fetch(
																`/api/documents/download?storageId=${doc.storageId}&filename=${encodeURIComponent(doc.originalName)}`,
															);

															if (!response.ok) {
																throw new Error('Failed to download document');
															}

															const blob = await response.blob();
															const url = window.URL.createObjectURL(blob);
															const a = document.createElement('a');
															a.href = url;
															a.download = doc.originalName;
															document.body.appendChild(a);
															a.click();
															window.URL.revokeObjectURL(url);
															document.body.removeChild(a);
														} catch (error) {
															console.error('Download failed:', error);
															// You could add a toast notification here
														}
													}}
													className="border-slate-600 text-slate-200 hover:bg-slate-700"
													title="Download document"
												>
													<Download className="h-4 w-4" />
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between">
						<div className="text-sm text-slate-400">
							Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of{' '}
							{filteredDocuments.length} documents
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="border-slate-600 text-slate-200 hover:bg-slate-700"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							<div className="flex items-center space-x-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<Button
										key={page}
										variant={currentPage === page ? 'default' : 'outline'}
										size="sm"
										onClick={() => setCurrentPage(page)}
										className={
											currentPage === page
												? 'bg-[#FFB900] text-slate-900'
												: 'border-slate-600 text-slate-200 hover:bg-slate-700'
										}
									>
										{page}
									</Button>
								))}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="border-slate-600 text-slate-200 hover:bg-slate-700"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				)}

				{/* Document Viewer Modal */}
				{selectedDocument && (
					<DocumentViewer
						document={selectedDocument}
						company={selectedDocument.company}
						onClose={() => setSelectedDocument(null)}
					/>
				)}
			</div>
		</DashboardLayout>
	);
}
