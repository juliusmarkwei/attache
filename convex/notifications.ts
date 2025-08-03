import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Add a new notification
export const addNotification = mutation({
	args: {
		title: v.string(),
		message: v.string(),
		type: v.union(v.literal('email'), v.literal('document'), v.literal('system')),
		userId: v.id('users'),
	},
	handler: async (ctx, args) => {
		const { title, message, type, userId } = args;

		const notificationId = await ctx.db.insert('notifications', {
			title,
			message,
			type,
			userId,
			isRead: false,
			createdAt: Date.now(),
		});

		return notificationId;
	},
});

// Get notifications for a user
export const getNotifications = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;

		const notifications = await ctx.db
			.query('notifications')
			.filter((q) => q.eq(q.field('userId'), userId))
			.order('desc')
			.collect();

		return notifications.map((notification) => ({
			...notification,
			timestamp: new Date(notification.createdAt),
		}));
	},
});

// Mark notification as read
export const markNotificationAsRead = mutation({
	args: { notificationId: v.id('notifications') },
	handler: async (ctx, args) => {
		const { notificationId } = args;

		await ctx.db.patch(notificationId, {
			isRead: true,
		});

		return { success: true };
	},
});

// Clear all notifications for a user
export const clearNotifications = mutation({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;

		const notifications = await ctx.db
			.query('notifications')
			.filter((q) => q.eq(q.field('userId'), userId))
			.collect();

		// Delete all notifications for the user
		for (const notification of notifications) {
			await ctx.db.delete(notification._id);
		}

		return { success: true, deletedCount: notifications.length };
	},
});
