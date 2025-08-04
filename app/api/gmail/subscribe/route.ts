import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { access_token, refresh_token, userId } = body;

		const sessionToken = request.cookies.get('session_token')?.value;

		if (!access_token) {
			return NextResponse.json(
				{
					error: 'Access token is required',
				},
				{ status: 400 },
			);
		}

		let finalUserId = userId;

		if (!finalUserId && sessionToken) {
			try {
				const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				const user = await convex.query(api.auth.getCurrentUser, { sessionToken });
				if (user) {
					finalUserId = user._id;
				} else {
					console.log('📧 No user found for session token');
				}
			} catch (error) {
				console.log('❌ Error getting user from session:', error);
			}
		}

		if (!finalUserId) {
			return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
		}

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

		try {
			const profile = await gmail.users.getProfile({ userId: 'me' });
			console.log(`✅ Connected to Gmail account: ${profile.data.emailAddress}`);
		} catch {
			console.log('❌ Access token expired, trying to refresh...');

			// Try to refresh the token
			if (refresh_token) {
				try {
					const { credentials } = await auth.refreshAccessToken();

					// Update the stored tokens in the database
					const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
					await convex.mutation(api.gmail.updateGmailIntegration, {
						integrationId: finalUserId as Id<'gmail_integrations'>, // This should be the integration ID, not userId
						accessToken: credentials.access_token!,
						refreshToken: credentials.refresh_token || refresh_token,
						expiryDate: credentials.expiry_date || Date.now() + 3600000,
					});
				} catch (refreshError) {
					console.error('❌ Refresh token error:', refreshError);
					return NextResponse.json(
						{
							error: 'Access token expired and refresh failed',
							message: 'Please re-authorize Gmail access',
						},
						{ status: 401 },
					);
				}
			} else {
				return NextResponse.json(
					{
						error: 'Access token expired and no refresh token available',
						message: 'Please re-authorize Gmail access',
					},
					{ status: 401 },
				);
			}
		}

		try {
			const watchResponse = await gmail.users.watch({
				userId: 'me',
				requestBody: {
					topicName: 'projects/inboxsync-467712/topics/gmail-inbox',
					labelIds: ['INBOX'],
				},
			});

			const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
			const integrationData = {
				userId: finalUserId as Id<'users'>, // Cast to Convex ID type
				accessToken: auth.credentials.access_token!,
				refreshToken: auth.credentials.refresh_token || refresh_token || '',
				expiryDate: Math.floor(auth.credentials.expiry_date || Date.now() + 3600000), // Ensure it's an integer
				historyId: watchResponse.data.historyId || '',
				subscriptionExpiration: watchResponse.data.expiration ? parseInt(watchResponse.data.expiration) : 0,
			};
			await convex.mutation(api.gmail.createGmailIntegration, integrationData);

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
			console.error('❌ Gmail watch error:', watchError);
			// Check if it's a topic/push notification issue
			if (watchError instanceof Error && watchError.message.includes('topic')) {
				console.log('📧 Topic not configured, but still storing integration for local development');

				// For local development, still store the integration even if push notifications fail
				const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				await convex.mutation(api.gmail.createGmailIntegration, {
					userId: finalUserId as Id<'users'>, // Cast to Convex ID type
					accessToken: auth.credentials.access_token!,
					refreshToken: auth.credentials.refresh_token || refresh_token || '',
					expiryDate: Math.floor(auth.credentials.expiry_date || Date.now() + 3600000),
					historyId: '',
					subscriptionExpiration: 0,
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
		console.error('❌ Subscribe endpoint error:', error);
		return NextResponse.json(
			{
				error: 'Failed to configure Gmail access',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
