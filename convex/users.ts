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

		// Check if user exists
		const user = await ctx.db.get(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Validate name if provided
		if (updates.name !== undefined) {
			if (!updates.name.trim()) {
				throw new Error('Name cannot be empty');
			}
			if (updates.name.length > 100) {
				throw new Error('Name is too long');
			}
		}

		// Validate email if provided
		if (updates.email !== undefined) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(updates.email)) {
				throw new Error('Invalid email format');
			}
		}

		// Validate profile picture if provided
		if (updates.profilePicture !== undefined) {
			if (
				updates.profilePicture &&
				!updates.profilePicture.startsWith('data:image/') &&
				!updates.profilePicture.match(/^[a-zA-Z0-9_-]+$/)
			) {
				throw new Error('Invalid profile picture format');
			}
		}

		// Only update fields that are provided
		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (updates.name !== undefined) updateData.name = updates.name.trim();
		if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();
		if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;

		await ctx.db.patch(userId, updateData);

		return { success: true };
	},
});
