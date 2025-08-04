import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate upload URL for file uploads
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

// Get file URL for downloads
export const getFileUrl = query({
	args: { storageId: v.string() },
	handler: async (ctx, args) => {
		const { storageId } = args;
		return await ctx.storage.getUrl(storageId);
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
