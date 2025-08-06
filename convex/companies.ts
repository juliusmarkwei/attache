import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get user company by email
export const getUserCompanyByEmail = query({
	args: {
		email: v.string(),
		userId: v.id('users'),
	},
	handler: async (ctx, args) => {
		const { email, userId } = args;

		const userCompany = await ctx.db
			.query('user_companies')
			.withIndex('by_user_email', (q) => q.eq('userId', userId).eq('email', email))
			.first();

		return userCompany;
	},
});

// Get user company by ID
export const getUserCompanyById = query({
	args: { userCompanyId: v.id('user_companies') },
	handler: async (ctx, args) => {
		const { userCompanyId } = args;

		const userCompany = await ctx.db.get(userCompanyId);
		return userCompany;
	},
});

// Create or get user company (for Gmail webhook)
export const createOrGetUserCompany = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		userId: v.id('users'),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { name, email, userId, metadata } = args;

		// Check if user already has this company
		const existingUserCompany = await ctx.db
			.query('user_companies')
			.withIndex('by_user_email', (q) => q.eq('userId', userId).eq('email', email))
			.first();

		if (existingUserCompany) {
			// Update existing user company
			await ctx.db.patch(existingUserCompany._id, {
				lastEmailReceived: Date.now(),
				updatedAt: Date.now(),
			});
			return existingUserCompany._id;
		}

		// Create new user company
		const userCompanyId = await ctx.db.insert('user_companies', {
			userId,
			email,
			name,
			phone: '',
			location: '',
			country: '',
			lastEmailReceived: Date.now(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return userCompanyId;
	},
});

// Update user company details
export const updateUserCompany = mutation({
	args: {
		userCompanyId: v.id('user_companies'),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		location: v.optional(v.string()),
		country: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { userCompanyId, ...updates } = args;

		await ctx.db.patch(userCompanyId, {
			...updates,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Get all companies for a user
export const getAllCompanies = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;

		const userCompanies = await ctx.db
			.query('user_companies')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.collect();

		return userCompanies;
	},
});

// Delete user company (only if it has no documents)
export const deleteUserCompany = mutation({
	args: { userCompanyId: v.id('user_companies') },
	handler: async (ctx, args) => {
		const { userCompanyId } = args;

		// Check if company has any documents
		const documents = await ctx.db
			.query('documents')
			.withIndex('by_user_company', (q) => q.eq('userCompanyId', userCompanyId))
			.collect();

		if (documents.length > 0) {
			throw new Error('Cannot delete company with existing documents');
		}

		// Delete the user company
		await ctx.db.delete(userCompanyId);

		return { success: true };
	},
});
