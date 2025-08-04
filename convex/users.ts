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
	},
	handler: async (ctx, args) => {
		const { userId, ...updates } = args;

		console.log('updateProfile called with:', { userId, updates });

		// Check if user exists
		const user = await ctx.db.get(userId);
		if (!user) {
			throw new Error('User not found');
		}

		console.log('Found user:', user);

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

		// Only update fields that are provided
		const updateData: any = {
			updatedAt: Date.now(),
		};

		if (updates.name !== undefined) updateData.name = updates.name.trim();
		if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();

		console.log('Updating user with data:', updateData);
		await ctx.db.patch(userId, updateData);

		console.log('User updated successfully');
		return { success: true };
	},
});
