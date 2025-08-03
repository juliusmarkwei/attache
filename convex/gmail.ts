import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Create or update Gmail integration for a user
export const createGmailIntegration = mutation({
	args: {
		userId: v.id('users'),
		accessToken: v.string(),
		refreshToken: v.string(),
		expiryDate: v.number(),
		historyId: v.optional(v.string()),
		subscriptionExpiration: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { userId, accessToken, refreshToken, expiryDate, historyId, subscriptionExpiration } = args;

		// Check if user already has an integration
		const existingIntegration = await ctx.db
			.query('gmail_integrations')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.first();

		if (existingIntegration) {
			// Update existing integration
			return await ctx.db.patch(existingIntegration._id, {
				accessToken,
				refreshToken,
				expiryDate,
				historyId,
				subscriptionExpiration,
				isActive: true,
				updatedAt: Date.now(),
			});
		} else {
			// Create new integration
			return await ctx.db.insert('gmail_integrations', {
				userId,
				accessToken,
				refreshToken,
				expiryDate,
				historyId,
				subscriptionExpiration,
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}
	},
});

// Get Gmail integration for a user
export const getGmailIntegration = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('gmail_integrations')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.first();
	},
});

// Update Gmail integration
export const updateGmailIntegration = mutation({
	args: {
		integrationId: v.id('gmail_integrations'),
		accessToken: v.optional(v.string()),
		refreshToken: v.optional(v.string()),
		expiryDate: v.optional(v.number()),
		historyId: v.optional(v.string()),
		subscriptionExpiration: v.optional(v.number()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { integrationId, ...updates } = args;
		return await ctx.db.patch(integrationId, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

// Deactivate Gmail integration
export const deactivateGmailIntegration = mutation({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const integration = await ctx.db
			.query('gmail_integrations')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.first();

		if (integration) {
			return await ctx.db.patch(integration._id, {
				isActive: false,
				updatedAt: Date.now(),
			});
		}
		return null;
	},
});

// Get all active Gmail integrations (for webhook processing)
export const getActiveGmailIntegrations = query({
	handler: async (ctx) => {
		return await ctx.db
			.query('gmail_integrations')
			.withIndex('by_active', (q) => q.eq('isActive', true))
			.collect();
	},
});
