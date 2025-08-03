'use client';

import { useQuery } from 'convex/react';
import { BarChart3, Building2, Calendar, Download, FileText, Mail, TrendingUp, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../convex/_generated/api';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

import { useAuth } from '../hooks/useAuth';

// Simple chart component for statistics
function SimpleChart({ data, title, color }: { data: number[]; title: string; color: string }) {
	return (
		<div className="space-y-2">
			<p className="text-xs text-slate-400">{title}</p>
			<div className="flex items-end space-x-1 h-16">
				{data.map((value, index) => (
					<div
						key={index}
						className="flex-1 bg-slate-600 rounded-t"
						style={{
							height: `${(value / Math.max(...data)) * 100}%`,
							backgroundColor: color,
						}}
					/>
				))}
			</div>
		</div>
	);
}

export default function Dashboard() {
	const { user, loading, authChecked, handleLogout, checkAuth } = useAuth();

	// Check authentication on mount
	React.useEffect(() => {
		if (!authChecked) {
			checkAuth();
		}
	}, [authChecked, checkAuth]);

	const companies = useQuery(api.companies.getAllCompanies, user?.id ? { userId: user.id as any } : 'skip');
	const documents = useQuery(api.documents.getAllDocuments, user?.id ? { userId: user.id as any } : 'skip');
	const gmailIntegration = useQuery(api.gmail.getGmailIntegration, user?.id ? { userId: user.id as any } : 'skip');

	const [showGmailBanner, setShowGmailBanner] = useState(true);

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
			const documentCount = documents.filter((doc) => doc.companyId === company._id).length;
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

	// Show loading state while data is being fetched
	if (!companies || !documents) {
		return (
			<DashboardLayout onLogout={handleLogout} gmailIntegration={gmailIntegration} user={user}>
				<div className="space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold text-white">Dashboard</h1>
						<p className="text-slate-400 mt-1">
							Welcome back! Here's an overview of your account activity.
						</p>
					</div>

					{/* Loading state for dashboard content */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{Array.from({ length: 2 }).map((_, index) => (
							<div
								key={index}
								className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 animate-pulse"
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

	return (
		<DashboardLayout onLogout={handleLogout} gmailIntegration={gmailIntegration} user={user}>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold text-white">Dashboard</h1>
					<p className="text-slate-400 mt-1">Welcome back! Here's an overview of your account activity.</p>
				</div>

				{/* Gmail Integration Status */}
				{!gmailIntegration && showGmailBanner && (
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 relative">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<Mail className="h-5 w-5 mr-2 text-[#FFB900]" />
									<CardTitle className="text-white">Gmail Integration</CardTitle>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowGmailBanner(false)}
									className="text-slate-400 hover:text-white hover:bg-slate-700/50"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<CardDescription className="text-slate-300">
								Set up automatic email processing and document organization
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-slate-200 text-sm">
										Connect your Gmail account to automatically process emails and organize
										documents by company.
									</p>
								</div>
								<Button
									onClick={() => (window.location.href = '/gmail-setup')}
									variant="outline"
									size="sm"
									className="border-[#FFB900] text-[#FFB900] hover:bg-[#FFB900]/10"
								>
									Setup Gmail
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{gmailIntegration && showGmailBanner && (
					<Card className="bg-green-500/10 border-green-500/20 backdrop-blur-sm">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<Mail className="h-5 w-5 mr-2 text-green-400" />
									<CardTitle className="text-green-400">Gmail Integration Active</CardTitle>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowGmailBanner(false)}
									className="text-slate-400 hover:text-white hover:bg-slate-700/50"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<CardDescription className="text-green-300">
								Your Gmail account is connected and processing emails automatically
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-green-200 text-sm">
										New emails with attachments are automatically processed and organized by
										company.
									</p>
								</div>
								<Button
									onClick={() => (window.location.href = '/gmail-setup')}
									variant="outline"
									size="sm"
									className="border-green-400 text-green-400 hover:bg-green-400/10"
								>
									Manage Integration
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Key Statistics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Total Companies</CardTitle>
							<Building2 className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{totalCompanies}</div>
							<p className="text-xs text-slate-400">Companies in your account</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Total Documents</CardTitle>
							<FileText className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{totalDocuments}</div>
							<p className="text-xs text-slate-400">Documents processed</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Storage Used</CardTitle>
							<Download className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">
								{(totalSize / (1024 * 1024)).toFixed(1)} MB
							</div>
							<p className="text-xs text-slate-400">Total storage used</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Recent Activity</CardTitle>
							<TrendingUp className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{recentDocuments}</div>
							<p className="text-xs text-slate-400">Documents this week</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Document Activity Chart */}
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100 flex items-center">
								<BarChart3 className="h-5 w-5 mr-2" />
								Document Activity (Last 7 Days)
							</CardTitle>
							<CardDescription className="text-slate-400">
								Number of documents uploaded each day
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SimpleChart data={generateChartData()} title="Documents uploaded" color="#FFB900" />
							<div className="flex justify-between text-xs text-slate-400 mt-2">
								{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
									<span key={index}>{day}</span>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Company Activity */}
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100 flex items-center">
								<Building2 className="h-5 w-5 mr-2" />
								Top Companies by Documents
							</CardTitle>
							<CardDescription className="text-slate-400">
								Companies with the most documents
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{generateCompanyData().map((company, index) => (
									<div key={index} className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<div className="w-2 h-2 rounded-full bg-[#FFB900]" />
											<span className="text-slate-200 text-sm">{company.name}</span>
										</div>
										<span className="text-slate-400 text-sm">{company.documents} docs</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100">Quick Actions</CardTitle>
						<CardDescription className="text-slate-400">Common tasks and shortcuts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Button
								onClick={() => (window.location.href = '/dashboard/companies')}
								variant="outline"
								className="border-slate-600 text-slate-200 hover:bg-slate-700 h-auto p-4 flex-col"
							>
								<Building2 className="h-6 w-6 mb-2" />
								<span className="font-medium">View Companies</span>
								<span className="text-xs text-slate-400 mt-1">Manage your companies</span>
							</Button>
							<Button
								onClick={() => (window.location.href = '/dashboard/documents')}
								variant="outline"
								className="border-slate-600 text-slate-200 hover:bg-slate-700 h-auto p-4 flex-col"
							>
								<FileText className="h-6 w-6 mb-2" />
								<span className="font-medium">Browse Documents</span>
								<span className="text-xs text-slate-400 mt-1">Search and filter documents</span>
							</Button>
							<Button
								onClick={() => (window.location.href = '/dashboard/settings')}
								variant="outline"
								className="border-slate-600 text-slate-200 hover:bg-slate-700 h-auto p-4 flex-col"
							>
								<Users className="h-6 w-6 mb-2" />
								<span className="font-medium">Account Settings</span>
								<span className="text-xs text-slate-400 mt-1">Manage your profile</span>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				{documents && documents.length > 0 && (
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100 flex items-center">
								<Calendar className="h-5 w-5 mr-2" />
								Recent Documents
							</CardTitle>
							<CardDescription className="text-slate-400">
								Latest documents uploaded to your account
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{documents
									.sort((a, b) => b.uploadedAt - a.uploadedAt)
									.slice(0, 5)
									.map((doc) => {
										const company = companies?.find((c) => c._id === doc.companyId);
										return (
											<div
												key={doc._id}
												className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
											>
												<div className="flex items-center space-x-3">
													<FileText className="h-4 w-4 text-[#FFB900]" />
													<div>
														<p className="text-slate-200 text-sm font-medium">
															{doc.originalName}
														</p>
														<p className="text-slate-400 text-xs">
															{company?.name} • {(doc.size / (1024 * 1024)).toFixed(2)} MB
														</p>
													</div>
												</div>
												<span className="text-slate-400 text-xs">
													{new Date(doc.uploadedAt).toLocaleDateString()}
												</span>
											</div>
										);
									})}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardLayout>
	);
}
