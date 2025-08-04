import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Add document to company
export const addDocumentToCompany = mutation({
	args: {
		companyId: v.id('companies'),
		filename: v.string(),
		originalName: v.string(),
		contentType: v.string(),
		size: v.number(),
		storageId: v.string(),
		uploadedBy: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { companyId, filename, originalName, contentType, size, storageId, uploadedBy, metadata } = args;

		// Check if document with same storageId already exists for this company
		const existingDocument = await ctx.db
			.query('documents')
			.withIndex('by_company', (q) => q.eq('companyId', companyId))
			.filter((q) => q.eq(q.field('storageId'), storageId))
			.first();

		if (existingDocument) {
			console.log(`🔄 Document with storageId ${storageId} already exists for company ${companyId}`);
			return existingDocument._id;
		}

		const documentId = await ctx.db.insert('documents', {
			companyId,
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

// Get documents for a company
export const getDocumentsByCompany = query({
	args: { companyId: v.id('companies') },
	handler: async (ctx, args) => {
		const { companyId } = args;

		const documents = await ctx.db
			.query('documents')
			.withIndex('by_company', (q) => q.eq('companyId', companyId))
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

		// First get all companies owned by this user
		const userCompanies = await ctx.db
			.query('companies')
			.filter((q) => q.eq(q.field('ownerId'), userId))
			.collect();

		const companyIds = userCompanies.map((company) => company._id);

		// Then get all documents and filter by company IDs
		const allDocuments = await ctx.db.query('documents').order('desc').collect();

		// Filter documents to only include those from user's companies
		const documents = allDocuments.filter((doc) => companyIds.includes(doc.companyId));

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

		// First get all companies owned by this user
		const userCompanies = await ctx.db
			.query('companies')
			.filter((q) => q.eq(q.field('ownerId'), userId))
			.collect();

		const companyIds = userCompanies.map((company) => company._id);

		// Then get all documents and filter by company IDs
		const allDocuments = await ctx.db.query('documents').order('desc').collect();

		// Filter documents to only include those from user's companies
		const documents = allDocuments.filter((doc) => companyIds.includes(doc.companyId));

		// Get company information for each document
		const documentsWithCompany = await Promise.all(
			documents.map(async (doc) => {
				const company = await ctx.db.get(doc.companyId);
				return {
					...doc,
					company,
				};
			}),
		);

		return documentsWithCompany;
	},
});
