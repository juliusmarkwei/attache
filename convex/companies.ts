import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get company by email
export const getCompanyByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const { email } = args;

		const company = await ctx.db
			.query('companies')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		return company;
	},
});

// Get company by ID
export const getCompanyById = query({
	args: { companyId: v.id('companies') },
	handler: async (ctx, args) => {
		const { companyId } = args;

		const company = await ctx.db.get(companyId);
		return company;
	},
});

// Create company (simplified version for Gmail webhook)
export const createCompany = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		ownerId: v.optional(v.id('users')),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { name, email, ownerId, metadata } = args;

		// Check if company already exists
		const existingCompany = await ctx.db
			.query('companies')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (existingCompany) {
			// Update existing company with new metadata if provided
			if (metadata) {
				await ctx.db.patch(existingCompany._id, {
					updatedAt: Date.now(),
					lastEmailReceived: Date.now(),
				});
			}
			return existingCompany._id;
		}

		// Create company with minimal data
		const companyId = await ctx.db.insert('companies', {
			name,
			email,
			ownerId,
			phone: '', // Will be updated later
			location: '', // Will be updated later
			country: '', // Will be updated later
			createdAt: Date.now(),
			updatedAt: Date.now(),
			lastEmailReceived: Date.now(),
		});

		return companyId;
	},
});

// Update company information
export const updateCompany = mutation({
	args: {
		companyId: v.id('companies'),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		location: v.optional(v.string()),
		country: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { companyId, ...updates } = args;

		await ctx.db.patch(companyId, {
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

		// Get companies that belong to this user
		const companies = await ctx.db
			.query('companies')
			.filter((q) => q.eq(q.field('ownerId'), userId))
			.collect();

		return companies;
	},
});

// Delete company (only if it has no documents)
export const deleteCompany = mutation({
	args: { companyId: v.id('companies') },
	handler: async (ctx, args) => {
		const { companyId } = args;

		// Check if company has any documents
		const documents = await ctx.db
			.query('documents')
			.withIndex('by_company', (q) => q.eq('companyId', companyId))
			.collect();

		if (documents.length > 0) {
			throw new Error('Cannot delete company with existing documents');
		}

		// Delete the company
		await ctx.db.delete(companyId);

		return { success: true };
	},
});
