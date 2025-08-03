'use client';

import { useMutation } from 'convex/react';
import { createContext, ReactNode, useContext } from 'react';
import { api } from '../../convex/_generated/api';

export interface Notification {
	id: string;
	title: string;
	message: string;
	timestamp: Date;
	type: 'email' | 'document' | 'system';
}

interface NotificationContextType {
	notifications: Notification[];
	clearNotifications: (userId: string) => Promise<void>;
	markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const clearNotificationsMutation = useMutation(api.notifications.clearNotifications);
	const markAsReadMutation = useMutation(api.notifications.markNotificationAsRead);

	const clearNotifications = async (userId: string) => {
		await clearNotificationsMutation({ userId: userId as any });
	};

	const markAsRead = async (id: string) => {
		await markAsReadMutation({ notificationId: id as any });
	};

	return (
		<NotificationContext.Provider
			value={{
				notifications: [], // This will be overridden by DashboardLayout
				clearNotifications,
				markAsRead,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
}
