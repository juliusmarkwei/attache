'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBadgeProps {
	userId?: string;
	className?: string;
}

export function NotificationBadge({ userId, className = '' }: NotificationBadgeProps) {
	const { notifications } = useNotifications(userId);

	// Count unread notifications
	const unreadCount = notifications.filter(
		(notification) =>
			notification.type === 'system' &&
			(notification.title.includes('Gmail Integration Expired') ||
				notification.title.includes('Gmail Integration Needs Re-authentication')),
	).length;

	if (unreadCount === 0) return null;

	return (
		<div className={`relative ${className}`}>
			<Bell className="h-5 w-5 text-slate-400" />
			<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
				<span className="text-xs text-white font-bold">{unreadCount}</span>
			</div>
		</div>
	);
}
