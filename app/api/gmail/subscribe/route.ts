import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { access_token, refresh_token, userId } = body;

		// Check for session token in cookies
		const sessionToken = request.cookies.get('session_token')?.value;
		console.log('📧 Subscribe request received:', {
			hasAccessToken: !!access_token,
			hasRefreshToken: !!refresh_token,
			hasUserId: !!userId,
			userId: userId,
			bodyKeys: Object.keys(body),
			hasSessionToken: !!sessionToken,
		});

		if (!access_token) {
			console.log('❌ Missing access_token');
			return NextResponse.json(
				{
					error: 'Access token is required',
				},
				{ status: 400 },
			);
		}

		// If userId is not provided, try to get it from session token
		let finalUserId = userId;
		if (!finalUserId && sessionToken) {
			console.log('🔍 No userId provided, trying to get from session token...');
			try {
				const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				const user = await convex.query(api.auth.getCurrentUser, { sessionToken });
				if (user) {
					finalUserId = user._id;
					console.log('✅ Got userId from session:', finalUserId);
				} else {
					console.log('❌ No user found for session token');
				}
			} catch (error) {
				console.log('❌ Error getting user from session:', error);
			}
		}

		if (!finalUserId) {
			console.log('❌ Missing userId');
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
		}

		// Initialize Gmail API with the provided access token
		const auth = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI,
		);

		// Set the access token and refresh token
		auth.setCredentials({
			access_token,
			refresh_token: refresh_token || undefined,
		});

		const gmail = google.gmail({ version: 'v1', auth });

		// Verify Gmail API access first
		console.log('📧 Verifying Gmail API access...');

		try {
			const profile = await gmail.users.getProfile({ userId: 'me' });
			console.log(`✅ Connected to Gmail account: ${profile.data.emailAddress}`);
		} catch (error) {
			console.log('❌ Access token expired, trying to refresh...');

			// Try to refresh the token
			if (refresh_token) {
				try {
					const { credentials } = await auth.refreshAccessToken();
					console.log('✅ Successfully refreshed access token');

					// Update the stored tokens in the database
					const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
					await convex.mutation(api.gmail.updateGmailIntegration, {
						integrationId: finalUserId as any, // This should be the integration ID, not userId
						accessToken: credentials.access_token!,
						refreshToken: credentials.refresh_token || refresh_token,
						expiryDate: credentials.expiry_date || Date.now() + 3600000,
					});

					// Verify again with new token
					const profile = await gmail.users.getProfile({ userId: 'me' });
					console.log(`✅ Connected to Gmail account: ${profile.data.emailAddress}`);
				} catch (refreshError) {
					console.error('❌ Failed to refresh token:', refreshError);
					return NextResponse.json(
						{
							error: 'Access token expired and refresh failed',
							message: 'Please re-authorize Gmail access',
						},
						{ status: 401 },
					);
				}
			} else {
				console.error('❌ No refresh token available');
				return NextResponse.json(
					{
						error: 'Access token expired and no refresh token available',
						message: 'Please re-authorize Gmail access',
					},
					{ status: 401 },
				);
			}
		}

		// Set up Gmail watch (push notifications) with your specific topic
		console.log('📧 Setting up Gmail push notifications...');

		try {
			const watchResponse = await gmail.users.watch({
				userId: 'me',
				requestBody: {
					topicName: 'projects/inboxsync-467712/topics/gmail-inbox',
					labelIds: ['INBOX'],
				},
			});

			console.log('✅ Gmail watch configured successfully');

			// Store the integration in the database
			const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
			await convex.mutation(api.gmail.createGmailIntegration, {
				userId: finalUserId,
				accessToken: auth.credentials.access_token!,
				refreshToken: auth.credentials.refresh_token || refresh_token || '',
				expiryDate: auth.credentials.expiry_date || Date.now() + 3600000, // 1 hour from now
				historyId: watchResponse.data.historyId || undefined,
				subscriptionExpiration: watchResponse.data.expiration
					? parseInt(watchResponse.data.expiration)
					: undefined,
			});

			// Get the profile again for the response
			const profileResponse = await gmail.users.getProfile({ userId: 'me' });

			return NextResponse.json({
				success: true,
				message: 'Gmail push notifications configured successfully',
				email: profileResponse.data.emailAddress,
				historyId: watchResponse.data.historyId,
				expiration: watchResponse.data.expiration,
			});
		} catch (watchError) {
			console.error('❌ Error setting up Gmail watch:', watchError);

			// Check if it's a topic/push notification issue
			if (watchError instanceof Error && watchError.message.includes('topic')) {
				console.log('📧 Topic not configured, but still storing integration for local development');

				// For local development, still store the integration even if push notifications fail
				const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				await convex.mutation(api.gmail.createGmailIntegration, {
					userId: finalUserId,
					accessToken: auth.credentials.access_token!,
					refreshToken: auth.credentials.refresh_token || refresh_token || '',
					expiryDate: auth.credentials.expiry_date || Date.now() + 3600000,
					historyId: undefined,
					subscriptionExpiration: undefined,
				});

				// Get the profile for the response
				const profileResponse = await gmail.users.getProfile({ userId: 'me' });

				return NextResponse.json({
					success: true,
					message:
						'Gmail integration configured successfully (push notifications disabled for local development)',
					email: profileResponse.data.emailAddress,
					historyId: 'Local Development',
					expiration: 'Local Development',
				});
			}

			return NextResponse.json(
				{
					error: 'Failed to configure Gmail watch',
					message: watchError instanceof Error ? watchError.message : 'Unknown error',
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error('❌ Error setting up Gmail access:', error);
		console.error('❌ Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{
				error: 'Failed to configure Gmail access',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
