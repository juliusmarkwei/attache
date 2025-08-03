import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get user by ID
export const getUserById = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const { userId } = args;
		return await ctx.db.get(userId);
	},
});

// Update user profile
export const updateProfile = mutation({
	args: {
		userId: v.id('users'),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		profilePicture: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { userId, ...updates } = args;

		// Only update fields that are provided
		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.email !== undefined) updateData.email = updates.email;
		if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;

		await ctx.db.patch(userId, updateData);

		return { success: true };
	},
});
