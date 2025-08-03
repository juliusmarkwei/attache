'use client';

import { useQuery } from 'convex/react';
import { Building2, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Search } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

import { useAuth } from '../../hooks/useAuth';

export default function CompaniesPage() {
	const { user, loading, authChecked, handleLogout, checkAuth } = useAuth();

	// Check authentication on mount
	React.useEffect(() => {
		if (!authChecked) {
			checkAuth();
		}
	}, [authChecked, checkAuth]);

	const companies = useQuery(api.companies.getAllCompanies, user?.id ? { userId: user.id as any } : 'skip');
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

	// Filter companies based on search term
	const filteredCompanies =
		companies?.filter(
			(company) =>
				company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				company.location?.toLowerCase().includes(searchTerm.toLowerCase()),
		) || [];

	// Calculate pagination
	const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

	// Show loading state while data is being fetched
	if (!companies) {
		return (
			<DashboardLayout onLogout={handleLogout} user={user}>
				<div className="space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-white">Companies</h1>
							<p className="text-slate-400 mt-1">Manage and view all companies in your account</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Search companies..."
									disabled
									className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
								/>
							</div>
						</div>
					</div>

					{/* Loading statistics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{Array.from({ length: 3 }).map((_, index) => (
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

					{/* Loading companies grid */}
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader>
							<CardTitle className="text-slate-100">All Companies</CardTitle>
							<CardDescription className="text-slate-400">Loading companies...</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{Array.from({ length: 12 }).map((_, index) => (
									<div key={index} className="bg-slate-700/50 rounded-lg p-4 animate-pulse">
										<div className="space-y-3">
											<div className="h-5 bg-slate-600 rounded w-3/4"></div>
											<div className="h-4 bg-slate-600 rounded w-1/2"></div>
											<div className="h-3 bg-slate-600 rounded w-2/3"></div>
										</div>
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
			title: 'New Company Added',
			message: 'Digicoast has been added to your companies',
			timestamp: new Date(),
			type: 'system' as const,
		},
	];

	return (
		<DashboardLayout onLogout={handleLogout} user={user} notifications={sampleNotifications}>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white">Companies</h1>
						<p className="text-slate-400 mt-1">Manage and view all companies in your account</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search companies..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
							/>
						</div>
					</div>
				</div>

				{/* Statistics */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Total Companies</CardTitle>
							<Building2 className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{companies?.length || 0}</div>
							<p className="text-xs text-slate-400">Companies in your account</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Active Companies</CardTitle>
							<Building2 className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">
								{companies?.filter(
									(c) =>
										c.lastEmailReceived &&
										Date.now() - c.lastEmailReceived < 30 * 24 * 60 * 60 * 1000,
								).length || 0}
							</div>
							<p className="text-xs text-slate-400">Active in last 30 days</p>
						</CardContent>
					</Card>

					<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-slate-100">Search Results</CardTitle>
							<Search className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-slate-100">{filteredCompanies.length}</div>
							<p className="text-xs text-slate-400">Matching companies</p>
						</CardContent>
					</Card>
				</div>

				{/* Companies Grid */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100">All Companies</CardTitle>
						<CardDescription className="text-slate-400">
							Showing {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} of{' '}
							{filteredCompanies.length} companies
						</CardDescription>
					</CardHeader>
					<CardContent>
						{filteredCompanies.length === 0 ? (
							<div className="text-center py-12">
								<Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-slate-200 mb-2">No companies found</h3>
								<p className="text-slate-400">
									{searchTerm
										? 'Try adjusting your search terms.'
										: 'Companies will appear here once you start receiving emails.'}
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{paginatedCompanies.map((company) => (
									<Card
										key={company._id}
										className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-colors"
									>
										<CardContent className="p-4">
											<div className="flex items-start space-x-3">
												<Building2 className="h-8 w-8 text-[#FFB900] mt-1" />
												<div className="flex-1 min-w-0">
													<h3 className="text-sm font-medium text-slate-100 truncate">
														{company.name}
													</h3>
													{company.email && (
														<div className="flex items-center mt-1">
															<Mail className="h-3 w-3 text-slate-400 mr-1" />
															<p className="text-xs text-slate-400 truncate">
																{company.email}
															</p>
														</div>
													)}
													{company.phone && (
														<div className="flex items-center mt-1">
															<Phone className="h-3 w-3 text-slate-400 mr-1" />
															<p className="text-xs text-slate-400 truncate">
																{company.phone}
															</p>
														</div>
													)}
													{company.location && (
														<div className="flex items-center mt-1">
															<MapPin className="h-3 w-3 text-slate-400 mr-1" />
															<p className="text-xs text-slate-400 truncate">
																{company.location}
															</p>
														</div>
													)}
													{company.lastEmailReceived && (
														<div className="mt-2">
															<p className="text-xs text-slate-500">
																Last email:{' '}
																{new Date(
																	company.lastEmailReceived,
																).toLocaleDateString()}
															</p>
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between">
						<div className="text-sm text-slate-400">
							Showing {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} of{' '}
							{filteredCompanies.length} companies
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
			</div>
		</DashboardLayout>
	);
}
