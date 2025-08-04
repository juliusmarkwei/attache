'use client';

import { Building2, ChevronLeft, ChevronRight, FileText, Home, LogOut, Mail, Settings, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../ui/button';

interface GmailIntegration {
	_id: string;
	userId: string;
	accessToken: string;
	refreshToken: string;
	expiryDate: number;
	isActive: boolean;
}

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	onLogout: () => void;
	onCollapsedChange?: (collapsed: boolean) => void;
	user?: {
		id: string;
		name: string;
		email: string;
	} | null;
	gmailIntegration?: GmailIntegration;
}

export default function Sidebar({
	isOpen,
	onClose,
	onLogout,
	onCollapsedChange,
	user,
	gmailIntegration,
}: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);
	const { notifications } = useNotifications(user?.id);

	// Check for Gmail integration issues
	const gmailIntegrationIssues = notifications.filter(
		(notification) =>
			notification.type === 'system' &&
			(notification.title.includes('Gmail Integration Expired') ||
				notification.title.includes('Gmail Integration Needs Re-authentication')),
	);

	const handleCollapse = () => {
		const newCollapsed = !collapsed;
		setCollapsed(newCollapsed);
		onCollapsedChange?.(newCollapsed);
	};

	const navigationItems = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: Home,
			href: '/dashboard',
		},
		{
			id: 'companies',
			label: 'Companies',
			icon: Building2,
			href: '/dashboard/companies',
		},
		{
			id: 'documents',
			label: 'Documents',
			icon: FileText,
			href: '/dashboard/documents',
		},
		{
			id: 'gmail-setup',
			label: 'Gmail Setup',
			icon: Mail,
			href: '/gmail-setup',
			hasNotification: gmailIntegrationIssues.length > 0,
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: Settings,
			href: '/dashboard/settings',
		},
	];

	return (
		<>
			{/* Overlay for mobile */}
			{isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

			{/* Sidebar */}
			<div
				className={`fixed left-0 top-0 h-screen bg-slate-800 border-r border-slate-700 transform transition-all duration-300 ease-in-out z-50 ${
					collapsed ? 'w-20' : 'w-64'
				} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-slate-700">
					<div className="flex items-center space-x-2">
						<Building2 className="h-6 w-6 text-[#FFB900]" />
						{!collapsed && <span className="text-lg font-semibold text-white">Attache</span>}
					</div>
					<div className="flex items-center space-x-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCollapse}
							className="hidden lg:flex text-slate-400 hover:text-white"
						>
							{collapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="lg:hidden text-slate-400 hover:text-white"
						>
							<X className="h-6 w-6" />
						</Button>
					</div>
				</div>

				{/* User Profile Section */}
				{user && (
					<div className="px-4 py-3 border-b border-slate-700">
						<div className={`flex items-center space-x-3 ${collapsed ? 'justify-center' : ''}`}>
							<div className="h-8 w-8 rounded-full bg-[#FFB900] flex items-center justify-center text-black font-semibold text-sm">
								{user.name.charAt(0).toUpperCase()}
							</div>
							{!collapsed && (
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-white truncate">{user.name}</p>
									<p className="text-xs text-slate-400 truncate">{user.email}</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Navigation */}
				<nav className="p-4 space-y-2">
					{navigationItems.map((item) => {
						const Icon = item.icon;
						let isActive = false;

						if (item.href === '/dashboard') {
							isActive = pathname === '/dashboard';
						} else {
							isActive = pathname === item.href || pathname.startsWith(item.href + '/');
						}

						return (
							<button
								key={item.id}
								onClick={() => router.push(item.href)}
								className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left relative ${
									collapsed ? 'justify-center' : ''
								} ${
									isActive
										? 'bg-[#FFB900]/10 text-[#FFB900] border border-[#FFB900]/20'
										: 'text-slate-300 hover:text-white hover:bg-slate-700/50'
								}`}
								title={collapsed ? item.label : undefined}
							>
								<div className="relative">
									<Icon className="h-8 w-8" />
									{/* Notification badge */}
									{item.hasNotification && (
										<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
									)}
								</div>
								{!collapsed && <span className="font-medium">{item.label}</span>}
							</button>
						);
					})}

					{/* Gmail Status Indicator */}
					<div className="pt-2 border-t border-slate-700">
						<div
							className={`flex items-center space-x-3 px-2 py-2 rounded-lg ${
								collapsed ? 'justify-center' : ''
							}`}
						>
							<div className="relative">
								<Mail
									className={`h-8 w-8 ${gmailIntegration?.isActive ? 'text-green-400' : 'text-red-400'}`}
								/>
								<div
									className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
										gmailIntegration?.isActive ? 'bg-green-400' : 'bg-red-400'
									}`}
								/>
							</div>
							{!collapsed && (
								<div className="flex flex-col">
									<span className="text-xs text-slate-400">Gmail Status</span>
									<span
										className={`text-xs font-medium ${gmailIntegration?.isActive ? 'text-green-400' : 'text-red-400'}`}
									>
										{gmailIntegration?.isActive ? 'Active' : 'Inactive'}
									</span>
								</div>
							)}
						</div>
					</div>
				</nav>

				{/* Footer */}
				<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
					<div className="space-y-3">
						<Button
							onClick={onLogout}
							variant="outline"
							size="sm"
							className={`border-slate-600 text-slate-200 hover:bg-transparent hover:text-slate-200 hover:cursor-pointer h-10 rounded-lg ${
								collapsed ? 'w-10 px-0' : 'w-full'
							}`}
							title={collapsed ? 'Logout' : undefined}
						>
							<LogOut className="h-6 w-6" />
							{!collapsed && <span className="ml-2">Logout</span>}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
