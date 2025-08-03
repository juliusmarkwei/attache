'use client';

import { Bell, Building2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../ui/button';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
	children: React.ReactNode;
	onLogout: () => void;
	gmailIntegration?: any;
	user?: {
		id: string;
		name: string;
		email: string;
		profilePicture?: string;
	} | null;
}

export default function DashboardLayout({ children, onLogout, gmailIntegration, user }: DashboardLayoutProps) {
	const router = useRouter();
	const { notifications, clearNotifications } = useNotifications(user?.id);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);

	const handleNotificationClick = async (notification: any) => {
		// Navigate to documents page
		router.push('/dashboard/documents');

		// Clear all notifications for this user
		if (user?.id) {
			await clearNotifications(user.id);
		}

		// Close notification dropdown
		setShowNotifications(false);
	};

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onLogout={onLogout}
				onCollapsedChange={setSidebarCollapsed}
				user={user}
				gmailIntegration={gmailIntegration}
			/>

			{/* Main Content */}
			<div
				className={`transition-all duration-300 w-full min-h-screen ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
			>
				{/* Mobile Header */}
				<div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4">
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSidebarOpen(true)}
							className="text-slate-400 hover:text-white"
						>
							<X className="h-4 w-4" />
						</Button>
						<div className="flex items-center space-x-2">
							<Building2 className="h-6 w-6 text-[#FFB900]" />
							<span className="text-lg font-semibold text-white">Attache</span>
						</div>
						<div className="w-10" /> {/* Spacer */}
					</div>
				</div>

				{/* Page Content */}
				<main className="max-w-7xl mx-auto lg:px-6 py-4 relative">
					{/* Notification Icon - Top Right */}
					<div className="absolute top-4 right-4 z-10">
						<div className="relative">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowNotifications(!showNotifications)}
								className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-full w-10 h-10 p-0"
							>
								<Bell className="h-5 w-5" />
								{notifications.length > 0 && (
									<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
										<span className="text-xs text-white font-bold">{notifications.length}</span>
									</div>
								)}
							</Button>

							{/* Notification Dropdown */}
							{showNotifications && (
								<div className="absolute top-12 right-0 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
									<div className="p-3 border-b border-slate-700">
										<div className="flex items-center justify-between">
											<h3 className="text-sm font-medium text-white">Notifications</h3>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowNotifications(false)}
												className="text-slate-400 hover:text-white h-6 w-6 p-0"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="max-h-64 overflow-y-auto">
										{notifications.length === 0 ? (
											<div className="p-4 text-center">
												<p className="text-sm text-slate-400">No new notifications</p>
											</div>
										) : (
											<div className="p-2">
												{notifications.slice(0, 10).map((notification) => (
													<div
														key={notification.id}
														onClick={() => handleNotificationClick(notification)}
														className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors cursor-pointer mb-2"
													>
														<div className="flex items-start space-x-3">
															<div className="flex-shrink-0">
																{notification.type === 'email' && (
																	<Bell className="h-4 w-4 text-blue-400" />
																)}
																{notification.type === 'document' && (
																	<Bell className="h-4 w-4 text-green-400" />
																)}
																{notification.type === 'system' && (
																	<Bell className="h-4 w-4 text-yellow-400" />
																)}
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-medium text-white truncate">
																	{notification.title}
																</p>
																<p className="text-xs text-slate-300 truncate mt-1">
																	{notification.message}
																</p>
																<p className="text-xs text-slate-400 mt-2">
																	{notification.timestamp.toLocaleTimeString()}
																</p>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{children}
				</main>
			</div>
		</div>
	);
}
