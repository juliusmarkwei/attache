import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const addDocumentToUserCompany = mutation({
	args: {
		userCompanyId: v.id('user_companies'),
		filename: v.string(),
		originalName: v.string(),
		contentType: v.string(),
		size: v.number(),
		storageId: v.string(),
		uploadedBy: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { userCompanyId, filename, originalName, contentType, size, storageId, uploadedBy, metadata } = args;

		const existingDocument = await ctx.db
			.query('documents')
			.withIndex('by_user_company', (q) => q.eq('userCompanyId', userCompanyId))
			.filter((q) => q.eq(q.field('storageId'), storageId))
			.first();

		if (existingDocument) {
			console.log(`🔄 Document with storageId ${storageId} already exists for user company ${userCompanyId}`);
			return existingDocument._id;
		}

		const documentId = await ctx.db.insert('documents', {
			userCompanyId,
			filename,
			originalName,
			contentType,
			size,
			storageId,
			uploadedAt: Date.now(),
			uploadedBy,
			metadata,
		});

		return documentId;
	},
});

// Get documents for a user company
export const getDocumentsByUserCompany = query({
	args: { userCompanyId: v.id('user_companies') },
	handler: async (ctx, args) => {
		const { userCompanyId } = args;

		const documents = await ctx.db
			.query('documents')
			.withIndex('by_user_company', (q) => q.eq('userCompanyId', userCompanyId))
			.order('desc')
			.collect();

		return documents;
	},
});

// Get document by ID
export const getDocumentById = query({
	args: { documentId: v.id('documents') },
	handler: async (ctx, args) => {
		const { documentId } = args;

		const document = await ctx.db.get(documentId);
		return document;
	},
});

// Get all documents for a user
export const getAllDocuments = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;

		// Get all user companies for this user
		const userCompanies = await ctx.db
			.query('user_companies')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.collect();

		const userCompanyIds = userCompanies.map((company) => company._id);

		const allDocuments = await ctx.db.query('documents').order('desc').collect();

		const documents = allDocuments.filter((doc) => doc.userCompanyId && userCompanyIds.includes(doc.userCompanyId));

		return documents;
	},
});

// Delete document
export const deleteDocument = mutation({
	args: { documentId: v.id('documents') },
	handler: async (ctx, args) => {
		const { documentId } = args;

		await ctx.db.delete(documentId);
		return { success: true };
	},
});

// Get documents with company information for a user
export const getDocumentsWithCompany = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;

		const userCompanies = await ctx.db
			.query('user_companies')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.collect();

		const userCompanyIds = userCompanies.map((company) => company._id);
		const allDocuments = await ctx.db.query('documents').order('desc').collect();
		const documents = allDocuments.filter((doc) => doc.userCompanyId && userCompanyIds.includes(doc.userCompanyId));

		const documentsWithCompany = await Promise.all(
			documents.map(async (doc) => {
				const userCompany = doc.userCompanyId ? await ctx.db.get(doc.userCompanyId) : null;
				return {
					...doc,
					company: userCompany,
				};
			}),
		);

		return documentsWithCompany;
	},
});

// Check for duplicate filename and content type within the same user company
export const checkDuplicateDocument = query({
	args: {
		userCompanyId: v.id('user_companies'),
		filename: v.string(),
		contentType: v.string(),
		userId: v.id('users'),
	},
	handler: async (ctx, args) => {
		const { userCompanyId, filename, contentType, userId } = args;

		const userCompany = await ctx.db.get(userCompanyId);
		if (!userCompany || userCompany.userId !== userId) {
			return false;
		}

		// Normalize filename for case-insensitive comparison
		const normalizedFilename = filename.toLowerCase().trim();

		const existingDocument = await ctx.db
			.query('documents')
			.withIndex('by_filename_content', (q) =>
				q.eq('userCompanyId', userCompanyId).eq('originalName', filename).eq('contentType', contentType),
			)
			.first();

		// If no exact match, check for case-insensitive match
		if (!existingDocument) {
			const allDocuments = await ctx.db
				.query('documents')
				.withIndex('by_user_company', (q) => q.eq('userCompanyId', userCompanyId))
				.collect();

			const caseInsensitiveMatch = allDocuments.find(
				(doc) => doc.originalName.toLowerCase() === normalizedFilename && doc.contentType === contentType,
			);

			if (caseInsensitiveMatch) {
				console.log(
					`🔍 Duplicate detected: ${filename} (${contentType}) already exists for user company ${userCompanyId} (user ${userId})`,
				);
				return true;
			}
		} else {
			console.log(
				`🔍 Duplicate detected: ${filename} (${contentType}) already exists for user company ${userCompanyId} (user ${userId})`,
			);
		}

		return !!existingDocument;
	},
});

// Add a new function to check for duplicates more efficiently
export const checkDuplicateDocumentByStorageId = query({
	args: {
		userCompanyId: v.id('user_companies'),
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		const { userCompanyId, storageId } = args;

		const existingDocument = await ctx.db
			.query('documents')
			.withIndex('by_user_company', (q) => q.eq('userCompanyId', userCompanyId))
			.filter((q) => q.eq(q.field('storageId'), storageId))
			.first();

		return !!existingDocument;
	},
});
