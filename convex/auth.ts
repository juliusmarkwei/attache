import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Simple hash function for OTP (not cryptographically secure, but sufficient for OTP)
function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return hash.toString(16);
}

export const generateOTP = mutation({
	args: { email: v.string(), otp: v.string() },
	handler: async (ctx, args) => {
		const { email, otp } = args;

		const hashedOTP = simpleHash(otp);

		console.log(`Generating new OTP for ${email}`);

		// Find existing OTP for this email
		const existingOTP = await ctx.db
			.query('otp_tokens')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (existingOTP) {
			// UPDATE existing OTP
			console.log(`Updating existing OTP: ${existingOTP._id}`);
			await ctx.db.patch(existingOTP._id, {
				otp: hashedOTP,
				expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
				createdAt: Date.now(),
			});
			console.log(`Updated OTP for ${email}`);
		} else {
			// INSERT new OTP
			console.log(`Creating new OTP for ${email}`);
			const newOTPId = await ctx.db.insert('otp_tokens', {
				email,
				otp: hashedOTP,
				expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
				createdAt: Date.now(),
			});
			console.log(`Created new OTP: ${newOTPId} for ${email}`);
		}

		console.log(`OTP value: ${otp}`);
		return { success: true, message: 'OTP sent to your email' };
	},
});

// Cleanup expired OTPs
export const cleanupExpiredOTPs = mutation({
	args: {},
	handler: async (ctx) => {
		const expiredOTPs = await ctx.db
			.query('otp_tokens')
			.withIndex('by_expires', (q) => q.lt('expiresAt', Date.now()))
			.collect();

		console.log(`Found ${expiredOTPs.length} expired OTPs to cleanup`);

		for (const expiredOTP of expiredOTPs) {
			await ctx.db.delete(expiredOTP._id);
		}

		console.log(`Cleaned up ${expiredOTPs.length} expired OTPs`);
		return { success: true, cleanedCount: expiredOTPs.length };
	},
});

export const createUser = mutation({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const { name, email } = args;

		const userId = await ctx.db.insert('users', {
			name,
			email,
			isVerified: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { success: true, userId };
	},
});

// Verify OTP and create user session
export const verifyOTP = mutation({
	args: { email: v.string(), otp: v.string() },
	handler: async (ctx, args) => {
		const { email, otp } = args;

		// Find the most recent OTP record
		const otpRecord = await ctx.db
			.query('otp_tokens')
			.withIndex('by_email', (q) => q.eq('email', email))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.order('desc')
			.first();

		if (!otpRecord) {
			throw new Error('Invalid or expired OTP');
		}

		// Compare the provided OTP with the hashed OTP
		const hashedInputOTP = simpleHash(otp);
		const isValidOTP = hashedInputOTP === otpRecord.otp;
		if (!isValidOTP) {
			throw new Error('Invalid OTP');
		}

		// Delete the used OTP
		await ctx.db.delete(otpRecord._id);

		// Find user
		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (!user) {
			throw new Error('User not found. Please register first.');
		}

		// Update user as verified and update last login
		await ctx.db.patch(user._id, {
			isVerified: true,
			updatedAt: Date.now(),
		});

		// Create session
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
			},
		};
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

export const getUserByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const { email } = args;
		return await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();
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

// Get OTP for email (for email sending)
export const getOTPForEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const { email } = args;

		const otpRecord = await ctx.db
			.query('otp_tokens')
			.withIndex('by_email', (q) => q.eq('email', email))
			.filter((q) => q.gt(q.field('expiresAt'), Date.now()))
			.order('desc')
			.first();

		return otpRecord;
	},
});
