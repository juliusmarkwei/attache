import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';

export async function GET(request: NextRequest) {
	try {
		console.log('🧪 Testing Gmail integration...');

		// Check environment variables
		const envCheck = {
			GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
			GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
			NEXT_PUBLIC_CONVEX_URL: !!process.env.NEXT_PUBLIC_CONVEX_URL,
		};

		console.log('🔧 Environment check:', envCheck);

		// Check for active Gmail integrations
		const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
		const activeIntegrations = await convex.query(api.gmail.getActiveGmailIntegrations);

		console.log('📧 Active Gmail integrations:', activeIntegrations.length);

		const results = [];

		for (const integration of activeIntegrations) {
			console.log(`🧪 Testing integration for user: ${integration.userId}`);

			try {
				// Initialize Gmail API
				const auth = new google.auth.OAuth2(
					process.env.GOOGLE_CLIENT_ID,
					process.env.GOOGLE_CLIENT_SECRET,
					process.env.GOOGLE_REDIRECT_URI,
				);

				auth.setCredentials({
					access_token: integration.accessToken,
					refresh_token: integration.refreshToken,
				});

				const gmail = google.gmail({ version: 'v1', auth });

				// Test 1: Get Gmail profile
				const profile = await gmail.users.getProfile({ userId: 'me' });
				console.log(`✅ Gmail API access working for: ${profile.data.emailAddress}`);

				// Test 2: Get recent messages
				const messages = await gmail.users.messages.list({
					userId: 'me',
					maxResults: 5,
				});

				console.log(`📨 Found ${messages.data.messages?.length || 0} recent messages`);

				// Test 3: Check if webhook is configured
				const webhookUrl = `${request.nextUrl.origin}/api/gmail/webhook`;
				console.log(`🔗 Webhook URL: ${webhookUrl}`);

				results.push({
					userId: integration.userId,
					email: profile.data.emailAddress,
					accessTokenValid: true,
					recentMessages: messages.data.messages?.length || 0,
					webhookUrl,
					integrationId: integration._id,
					subscriptionExpiration: integration.subscriptionExpiration,
					historyId: integration.historyId,
				});
			} catch (error) {
				console.error(`❌ Error testing integration for user ${integration.userId}:`, error);
				results.push({
					userId: integration.userId,
					error: error instanceof Error ? error.message : 'Unknown error',
					accessTokenValid: false,
				});
			}
		}

		// Check if webhook endpoint is accessible
		const webhookTest = await fetch(`${request.nextUrl.origin}/api/gmail/webhook`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: true }),
		});

		return NextResponse.json({
			status: 'ok',
			environment: envCheck,
			activeIntegrations: activeIntegrations.length,
			integrationTests: results,
			webhookAccessible: webhookTest.ok,
			webhookUrl: `${request.nextUrl.origin}/api/gmail/webhook`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('❌ Gmail test error:', error);
		return NextResponse.json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
