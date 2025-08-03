import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface Notification {
	id: string;
	title: string;
	message: string;
	timestamp: Date;
	type: 'email' | 'document' | 'system';
	userId: string;
}

export class NotificationService {
	private static convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

	static async addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
		try {
			const fullNotification: Notification = {
				...notification,
				id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
			};

			// Store notification in Convex
			await this.convexClient.mutation(api.notifications.addNotification, {
				title: fullNotification.title,
				message: fullNotification.message,
				type: fullNotification.type,
				userId: fullNotification.userId as Id<'users'>,
			});

			console.log('✅ Notification added:', fullNotification.title);
			return fullNotification;
		} catch (error) {
			console.error('❌ Error adding notification:', error);
			throw error;
		}
	}

	static async addEmailNotification(userId: string, subject: string, companyName: string) {
		return this.addNotification({
			title: 'New Email Received',
			message: `${subject} from ${companyName}`,
			type: 'email',
			userId,
		});
	}

	static async addDocumentNotification(userId: string, fileName: string, companyName: string) {
		return this.addNotification({
			title: 'Document Processed',
			message: `${fileName} added to ${companyName}`,
			type: 'document',
			userId,
		});
	}

	static async addSystemNotification(userId: string, title: string, message: string) {
		return this.addNotification({
			title,
			message,
			type: 'system',
			userId,
		});
	}
}
