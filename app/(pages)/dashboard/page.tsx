'use client';

import { GetFileIcon } from '@/components/dashboard/GetFileIcon';
import { formatStorageSize } from '@/utils/format-storage-size';
import { useQuery } from 'convex/react';
import { Building2, Calendar, Download, FileText, Mail, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DocumentActivityChart from '../../components/dashboard/DocumentActivityChart';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
	const { user, handleLogout } = useAuth();
	const router = useRouter();

	const companies = useQuery(api.companies.getAllCompanies, user?.id ? { userId: user.id as Id<'users'> } : 'skip');
	const documents = useQuery(api.documents.getAllDocuments, user?.id ? { userId: user.id as Id<'users'> } : 'skip');
	const gmailIntegration = useQuery(
		api.gmail.getGmailIntegration,
		user?.id ? { userId: user.id as Id<'users'> } : 'skip',
	);

	const [showGmailBanner, setShowGmailBanner] = useState(true);
	const [showActiveBanner, setShowActiveBanner] = useState(true);

	useEffect(() => {
		const dismissed = sessionStorage.getItem('gmail_banner_dismissed');
		const activeDismissed = sessionStorage.getItem('gmail_active_banner_dismissed');

		if (dismissed === 'true') {
			setShowGmailBanner(false);
		}
		if (activeDismissed === 'true') {
			setShowActiveBanner(false);
		}
	}, []);

	useEffect(() => {
		if (gmailIntegration !== undefined) {
			if (!gmailIntegration || !gmailIntegration.isActive) {
				const dismissed = sessionStorage.getItem('gmail_banner_dismissed');
				if (dismissed !== 'true') {
					setShowGmailBanner(true);
				}
			} else if (gmailIntegration && gmailIntegration.isActive) {
				setShowGmailBanner(false);
			}
		}
	}, [gmailIntegration]);

	const handleDismissBanner = () => {
		setShowGmailBanner(false);
		sessionStorage.setItem('gmail_banner_dismissed', 'true');
	};

	const handleDismissActiveBanner = () => {
		setShowActiveBanner(false);
		sessionStorage.setItem('gmail_active_banner_dismissed', 'true');
	};

	if (companies === undefined || documents === undefined || gmailIntegration === undefined) {
		return (
			<DashboardLayout
				onLogout={handleLogout}
				user={user}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				gmailIntegration={gmailIntegration as any}
			>
				<div className="space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold text-white">Dashboard</h1>
						<p className="text-slate-400 mt-1">
							Welcome back! Here&apos;s an overview of your account activity.
						</p>
					</div>

					{/* Loading skeleton for dashboard content */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 animate-pulse"
							>
								<div className="space-y-4">
									<div className="h-4 bg-slate-700 rounded w-3/4"></div>
									<div className="h-8 bg-slate-700 rounded w-1/2"></div>
									<div className="h-3 bg-slate-700 rounded w-2/3"></div>
								</div>
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{Array.from({ length: 2 }).map((_, index) => (
							<div
								key={index}
								className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 animate-pulse"
							>
								<div className="space-y-4">
									<div className="h-5 bg-slate-700 rounded w-1/2"></div>
									<div className="h-3 bg-slate-700 rounded w-3/4"></div>
									<div className="h-16 bg-slate-700 rounded"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</DashboardLayout>
		);
	}

	// Calculate statistics
	const totalCompanies = companies?.length || 0;
	const totalDocuments = documents?.length || 0;
	const totalSize = documents?.reduce((sum, doc) => sum + doc.size, 0) || 0;
	const recentDocuments =
		documents?.filter((doc) => {
			const diffInDays = (Date.now() - doc.uploadedAt) / (1000 * 60 * 60 * 24);
			return diffInDays <= 7;
		}).length || 0;

	// Generate chart data (last 7 days)
	const generateChartData = () => {
		const data = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
			const dayEnd = dayStart + 24 * 60 * 60 * 1000;

			const count =
				documents?.filter((doc) => {
					return doc.uploadedAt >= dayStart && doc.uploadedAt < dayEnd;
				}).length || 0;

			data.push(count);
		}
		return data;
	};

	// Generate company activity data
	const generateCompanyData = () => {
		if (!companies || !documents) return [];

		// Calculate document count for each company
		const companiesWithCounts = companies.map((company) => {
			const documentCount = documents.filter((doc) => doc.userCompanyId === company._id).length;
			return {
				name: company.name,
				documents: documentCount,
				companyId: company._id,
			};
		});

		// Sort by document count (descending) and take top 5
		return companiesWithCounts
			.sort((a, b) => b.documents - a.documents)
			.slice(0, 5)
			.map(({ name, documents }) => ({ name, documents }));
	};

	return (
		<DashboardLayout
			onLogout={handleLogout}
			user={user}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			gmailIntegration={gmailIntegration as any}
		>
			{/* Dashboard Content */}
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white">Dashboard</h1>
						<p className="text-slate-400 mt-1">
							Welcome back! Here&apos;s an overview of your account activity.
						</p>
					</div>
				</div>

				{/* Gmail Integration Active Banner */}
				{gmailIntegration?.isActive && showActiveBanner && (
					<div className="mb-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Mail className="h-6 w-6 text-green-400" />
								<div>
									<h3 className="text-green-400 font-semibold">Gmail Integration Active</h3>
									<p className="text-green-300 text-sm">
										Your Gmail account is connected and processing emails automatically. New emails
										with attachments are automatically processed and organized by company.
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									onClick={() => router.push('/gmail-setup')}
									className="bg-green-600 text-white hover:bg-green-700"
								>
									Manage Integration
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDismissActiveBanner}
									className="text-green-400 hover:text-green-300 hover:bg-green-600/20"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Gmail Integration Banner */}
				{showGmailBanner && (!gmailIntegration || !gmailIntegration.isActive) && (
					<div className="mb-6 p-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Mail className="h-6 w-6 text-[#FFB900]" />
								<div>
									<h3 className="text-white font-semibold">
										{!gmailIntegration ? 'Connect Gmail' : 'Reconnect Gmail'}
									</h3>
									<p className="text-slate-300 text-sm">
										{!gmailIntegration
											? 'Automatically process emails and extract documents'
											: 'Your Gmail integration has expired and needs to be re-authenticated'}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									onClick={() => router.push('/gmail-setup')}
									className="bg-[#FFB900] text-slate-900 hover:bg-[#FFB900]/90"
								>
									{!gmailIntegration ? 'Connect Gmail' : 'Reconnect Gmail'}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDismissBanner}
									className="text-slate-400 hover:text-white hover:bg-slate-700/50"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-400">Total Companies</CardTitle>
							<Building2 className="h-4 w-4 text-[#FFB900]" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">{totalCompanies}</div>
							<p className="text-xs text-slate-400 mt-1">Companies in your account</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-400">Total Documents</CardTitle>
							<FileText className="h-4 w-4 text-[#FFB900]" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">{totalDocuments}</div>
							<p className="text-xs text-slate-400 mt-1">Documents processed</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-400">Storage Used</CardTitle>
							<Download className="h-4 w-4 text-[#FFB900]" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">{formatStorageSize(totalSize)}</div>
							<p className="text-xs text-slate-400 mt-1">Total storage used</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-400">Recent Activity</CardTitle>
							<Calendar className="h-4 w-4 text-[#FFB900]" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">{recentDocuments}</div>
							<p className="text-xs text-slate-400 mt-1">Documents this week</p>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Document Activity Chart */}
					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader>
							<CardTitle className="text-white">Document Activity (Last 7 Days)</CardTitle>
							<CardDescription className="text-slate-400">
								Number of documents uploaded each day
							</CardDescription>
						</CardHeader>
						<CardContent>
							<DocumentActivityChart data={generateChartData()} />
						</CardContent>
					</Card>

					{/* Company Activity Chart */}
					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader>
							<CardTitle className="text-white">Top Companies by Documents</CardTitle>
							<CardDescription className="text-slate-400">
								Companies with the most documents
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{generateCompanyData().map((company, index) => (
									<div key={index} className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<div className="w-2 h-2 bg-[#FFB900] rounded-full" />
											<span className="text-sm text-white font-medium">{company.name}</span>
										</div>
										<span className="text-sm text-slate-400">{company.documents} docs</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Recent Documents */}
				<Card className="bg-slate-800/50 border-slate-700">
					<CardHeader>
						<CardTitle className="text-white">Recent Documents</CardTitle>
						<CardDescription className="text-slate-400">
							Latest document uploads and company updates
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{documents && documents.length > 0 ? (
								documents.slice(0, 5).map((document) => (
									<div
										key={document._id}
										className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
									>
										{GetFileIcon(document.contentType)}
										<div className="flex-1">
											<p className="text-sm font-medium text-white">{document.originalName}</p>
											<p className="text-xs text-slate-400">
												Uploaded to{' '}
												{companies?.find((c) => c._id === document.userCompanyId)?.name ||
													'Unknown Company'}
											</p>
										</div>
										<div className="text-right">
											<p className="text-xs text-slate-400">
												{new Date(document.uploadedAt).toLocaleDateString()}
											</p>
											<p className="text-xs text-slate-500">{formatStorageSize(document.size)}</p>
										</div>
									</div>
								))
							) : (
								<div className="text-center py-8">
									<FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
									<p className="text-slate-400 text-sm">No documents uploaded yet</p>
									<p className="text-slate-500 text-xs mt-1">
										Documents will appear here once you start uploading
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card className="bg-slate-800/50 border-slate-700">
					<CardHeader>
						<CardTitle className="text-white">Quick Actions</CardTitle>
						<CardDescription className="text-slate-400">Common tasks and shortcuts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<Button
								onClick={() => router.push('/dashboard/companies')}
								variant="outline"
								className="h-24 flex flex-col items-center justify-center space-y-3 border-slate-700 hover:bg-slate-700/50 hover:border-[#FFB900]/50 transition-all duration-200 group p-15"
							>
								<div className="p-3 bg-[#FFB900]/10 rounded-full group-hover:bg-[#FFB900]/20 transition-colors">
									<Building2 className="h-6 w-6 text-[#FFB900]" />
								</div>
								<div className="text-center">
									<span className="text-sm font-medium text-white block">View Companies</span>
									<span className="text-xs text-slate-400 block">Manage your companies</span>
								</div>
							</Button>
							<Button
								onClick={() => router.push('/dashboard/documents')}
								variant="outline"
								className="h-24 flex flex-col items-center justify-center space-y-3 border-slate-700 hover:bg-slate-700/50 hover:border-[#FFB900]/50 transition-all duration-200 group p-15"
							>
								<div className="p-3 bg-[#FFB900]/10 rounded-full group-hover:bg-[#FFB900]/20 transition-colors">
									<FileText className="h-6 w-6 text-[#FFB900]" />
								</div>
								<div className="text-center">
									<span className="text-sm font-medium text-white block">Browse Documents</span>
									<span className="text-xs text-slate-400 block">Search and filter documents</span>
								</div>
							</Button>
							<Button
								onClick={() => router.push('/dashboard/settings')}
								variant="outline"
								className="h-24 flex flex-col items-center justify-center space-y-3 border-slate-700 hover:bg-slate-700/50 hover:border-[#FFB900]/50 transition-all duration-200 group p-15"
							>
								<div className="p-3 bg-[#FFB900]/10 rounded-full group-hover:bg-[#FFB900]/20 transition-colors">
									<svg
										className="h-6 w-6 text-[#FFB900]"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
								<div className="text-center">
									<span className="text-sm font-medium text-white block">Account Settings</span>
									<span className="text-xs text-slate-400 block">Manage your profile</span>
								</div>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
