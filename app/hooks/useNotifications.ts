'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface Notification {
	id: string;
	title: string;
	message: string;
	createdAt: number;
	type: 'email' | 'document' | 'system';
}

export function useNotifications(userId?: string) {
	const rawNotifications =
		useQuery(api.notifications.getNotifications, userId ? { userId: userId as Id<'users'> } : 'skip') || [];

	// Map Convex data to our Notification interface
	const notifications: Notification[] = rawNotifications.map((notification) => ({
		id: notification._id,
		title: notification.title,
		message: notification.message,
		createdAt: notification.createdAt,
		type: notification.type,
	}));

	const clearNotificationsMutation = useMutation(api.notifications.clearNotifications);
	const markAsReadMutation = useMutation(api.notifications.markNotificationAsRead);

	const clearNotifications = async (userId: string) => {
		await clearNotificationsMutation({ userId: userId as Id<'users'> });
	};

	const markAsRead = async (id: string) => {
		await markAsReadMutation({ notificationId: id as Id<'notifications'> });
	};

	return {
		notifications,
		clearNotifications,
		markAsRead,
	};
}
