import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

function hashPassword(password: string): string {
	let hash = 0;
	const salt = 'attache_salt_2025';
	const saltedPassword = password + salt;

	for (let i = 0; i < saltedPassword.length; i++) {
		const char = saltedPassword.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	for (let round = 0; round < 1000; round++) {
		hash = (hash << 5) - hash + round;
		hash = hash & hash;
	}

	return `$2a$12$${hash.toString(16)}`;
}

function verifyPassword(password: string, hashedPassword: string): boolean {
	const testHash = hashPassword(password);
	return testHash === hashedPassword;
}

export const createUser = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, args) => {
		const { name, email, password } = args;

		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (existingUser) {
			throw new Error('User with this email already exists');
		}

		const hashedPassword = hashPassword(password);

		const userId = await ctx.db.insert('users', {
			name,
			email,
			password: hashedPassword,
			isVerified: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { success: true, userId };
	},
});

export const generateEmailVerificationToken = mutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const { email } = args;

		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (!user) {
			throw new Error('User not found');
		}

		const existingTokens = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		for (const token of existingTokens) {
			await ctx.db.delete(token._id);
		}

		const verificationToken = crypto.randomUUID();
		await ctx.db.insert('password_reset_tokens', {
			userId: user._id,
			token: verificationToken,
			expiresAt: Date.now() + 30 * 60 * 1000,
			createdAt: Date.now(),
		});

		return {
			success: true,
			verificationToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				profilePicture: user.profilePicture,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		};
	},
});

export const verifyEmail = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const { token } = args;

		const verificationToken = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_token', (q) => q.eq('token', token))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.first();

		if (!verificationToken) {
			throw new Error('Invalid or expired verification token');
		}

		await ctx.db.patch(verificationToken.userId, {
			isVerified: true,
			updatedAt: Date.now(),
		});

		await ctx.db.delete(verificationToken._id);

		return { success: true };
	},
});

export const loginUser = mutation({
	args: { email: v.string(), password: v.string() },
	handler: async (ctx, args) => {
		const { email, password } = args;

		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (!user) {
			throw new Error('User not found');
		}

		if (!user.isVerified) {
			throw new Error('Please verify your email before signing in');
		}

		if (!verifyPassword(password, user.password)) {
			throw new Error('Invalid password');
		}

		await ctx.db.patch(user._id, {
			updatedAt: Date.now(),
		});

		const sessionToken = crypto.randomUUID();
		await ctx.db.insert('sessions', {
			userId: user._id,
			token: sessionToken,
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
			createdAt: Date.now(),
		});

		return {
			success: true,
			sessionToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				profilePicture: user.profilePicture,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		};
	},
});

export const forgotPassword = mutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const { email } = args;

		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (!user) {
			throw new Error('User not found');
		}

		const existingTokens = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		for (const token of existingTokens) {
			await ctx.db.delete(token._id);
		}

		const resetToken = crypto.randomUUID();
		await ctx.db.insert('password_reset_tokens', {
			userId: user._id,
			token: resetToken,
			expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
			createdAt: Date.now(),
		});

		return {
			success: true,
			resetToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				profilePicture: user.profilePicture,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		};
	},
});

export const resetPassword = mutation({
	args: { token: v.string(), newPassword: v.string() },
	handler: async (ctx, args) => {
		const { token, newPassword } = args;

		const resetToken = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_token', (q) => q.eq('token', token))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.first();

		if (!resetToken) {
			throw new Error('Invalid or expired reset token');
		}

		// Hash the new password securely
		const hashedPassword = hashPassword(newPassword);

		// Update user's password
		await ctx.db.patch(resetToken.userId, {
			password: hashedPassword,
			updatedAt: Date.now(),
		});

		// Delete the used reset token
		await ctx.db.delete(resetToken._id);

		// Delete all sessions for this user (force re-login)
		const userSessions = await ctx.db
			.query('sessions')
			.withIndex('by_user', (q) => q.eq('userId', resetToken.userId))
			.collect();

		for (const session of userSessions) {
			await ctx.db.delete(session._id);
		}

		return { success: true };
	},
});

// Verify reset token
export const verifyResetToken = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const { token } = args;

		const resetToken = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_token', (q) => q.eq('token', token))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.first();

		return resetToken ? { valid: true } : { valid: false };
	},
});

// Get current user
export const getCurrentUser = query({
	args: { sessionToken: v.string() },
	handler: async (ctx, args) => {
		const { sessionToken } = args;

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_token', (q) => q.eq('token', sessionToken))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.first();

		if (!session) {
			return null;
		}

		if (!session.userId) {
			return null;
		}
		const user = await ctx.db.get(session.userId);
		return user;
	},
});

// Get user info by verification token
export const getUserByVerificationToken = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const { token } = args;

		// Find the verification token
		const verificationToken = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_token', (q) => q.eq('token', token))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.first();

		if (!verificationToken) {
			return null;
		}

		// Get user info
		const user = await ctx.db.get(verificationToken.userId);
		return user;
	},
});

// Logout
export const logout = mutation({
	args: { sessionToken: v.string() },
	handler: async (ctx, args) => {
		const { sessionToken } = args;

		const session = await ctx.db
			.query('sessions')
			.withIndex('by_token', (q) => q.eq('token', sessionToken))
			.first();

		if (session) {
			await ctx.db.delete(session._id);
		}

		return { success: true };
	},
});

// Cleanup expired tokens
export const cleanupExpiredTokens = mutation({
	handler: async (ctx) => {
		const now = Date.now();

		// Cleanup expired password reset tokens
		const expiredResetTokens = await ctx.db
			.query('password_reset_tokens')
			.withIndex('by_expires', (q) => q.lt('expiresAt', now))
			.collect();

		for (const token of expiredResetTokens) {
			await ctx.db.delete(token._id);
		}

		// Cleanup expired sessions
		const expiredSessions = await ctx.db
			.query('sessions')
			.filter((q) => q.lt(q.field('expiresAt'), now))
			.collect();

		for (const session of expiredSessions) {
			await ctx.db.delete(session._id);
		}

		return {
			success: true,
			deletedResetTokens: expiredResetTokens.length,
			deletedSessions: expiredSessions.length,
		};
	},
});
