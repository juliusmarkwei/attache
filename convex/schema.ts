import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	users: defineTable({
		name: v.string(),
		email: v.string(),
		password: v.string(),
		isVerified: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index('by_email', ['email']),

	companies: defineTable({
		name: v.string(),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		location: v.optional(v.string()),
		country: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
		ownerId: v.optional(v.id('users')),
		lastEmailReceived: v.optional(v.number()),
	})
		.index('by_email', ['email'])
		.index('by_name', ['name']),

	documents: defineTable({
		companyId: v.id('companies'),
		filename: v.string(),
		originalName: v.string(),
		contentType: v.string(),
		size: v.number(),
		storageId: v.string(),
		uploadedAt: v.number(),
		uploadedBy: v.optional(v.string()),
		metadata: v.optional(v.any()),
	})
		.index('by_company', ['companyId'])
		.index('by_uploaded_at', ['uploadedAt']),

	notifications: defineTable({
		title: v.string(),
		message: v.string(),
		type: v.union(v.literal('email'), v.literal('document'), v.literal('system')),
		userId: v.id('users'),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index('by_user', ['userId'])
		.index('by_created_at', ['createdAt']),

	sessions: defineTable({
		userId: v.id('users'),
		token: v.string(),
		expiresAt: v.number(),
		createdAt: v.number(),
	})
		.index('by_token', ['token'])
		.index('by_user', ['userId']),

	password_reset_tokens: defineTable({
		userId: v.id('users'),
		token: v.string(),
		expiresAt: v.number(),
		createdAt: v.number(),
	})
		.index('by_token', ['token'])
		.index('by_user', ['userId'])
		.index('by_expires', ['expiresAt']),

	gmail_integrations: defineTable({
		userId: v.id('users'),
		accessToken: v.string(),
		refreshToken: v.string(),
		expiryDate: v.number(),
		historyId: v.optional(v.string()),
		subscriptionExpiration: v.optional(v.number()),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_user', ['userId'])
		.index('by_active', ['isActive']),
});
