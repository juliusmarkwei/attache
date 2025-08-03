import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

// Save file metadata after upload
export const saveFileMetadata = mutation({
	args: {
		storageId: v.string(),
		filename: v.string(),
		contentType: v.string(),
		size: v.number(),
	},
	handler: async (ctx, args) => {
		const { storageId, filename, contentType, size } = args;
		return { storageId, filename, contentType, size };
	},
});

// Get file URL for download
export const getFileUrl = query({
	args: { storageId: v.string() },
	handler: async (ctx, args) => {
		const { storageId } = args;

		const url = await ctx.storage.getUrl(storageId);
		return url;
	},
});

// Delete file from storage
export const deleteFile = mutation({
	args: { storageId: v.string() },
	handler: async (ctx, args) => {
		const { storageId } = args;

		await ctx.storage.delete(storageId);
		return { success: true };
	},
});
