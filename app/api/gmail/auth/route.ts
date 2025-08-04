import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI,
);

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const code = url.searchParams.get('code');

		console.log('🔍 Auth endpoint called with URL:', url.toString());
		console.log('🔍 Environment variables:', {
			GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
			GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
		});

		if (!code) {
			const authUrl = auth.generateAuthUrl({
				access_type: 'offline',
				scope: [
					'https://www.googleapis.com/auth/gmail.readonly',
					'https://www.googleapis.com/auth/gmail.modify',
				],
				prompt: 'consent',
				redirect_uri: process.env.GOOGLE_REDIRECT_URI,
			});

			return NextResponse.json({
				authUrl,
				message: 'Visit this URL to authorize Gmail access',
			});
		}

		const codeKey = `used_code_${code}`;
		if ((global as unknown as Record<string, boolean>)[codeKey]) {
			console.log('❌ Authorization code already used');
			return NextResponse.json(
				{
					error: 'Authorization code already used',
					message:
						'This authorization code has already been exchanged for tokens. Please start a new authorization flow.',
					code: 'CODE_ALREADY_USED',
				},
				{ status: 400 },
			);
		}

		(global as unknown as Record<string, boolean>)[codeKey] = true;

		const { tokens } = await auth.getToken(code);

		return NextResponse.json({
			success: true,
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			expiry_date: tokens.expiry_date || Date.now() + 3600000,
			message: 'Tokens received successfully',
		});
	} catch (error) {
		console.error('Gmail auth error:', error);

		// Enhanced error handling with more specific error messages
		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();

			if (errorMessage.includes('invalid_grant')) {
				return NextResponse.json(
					{
						error: 'Authorization code expired or already used',
						message:
							'The authorization code has expired or was already used. This typically happens when:\n' +
							'1. The code was used more than once\n' +
							'2. The code expired (they expire within 10 minutes)\n' +
							'3. There was a redirect URI mismatch\n\n' +
							'Please try the authorization flow again by visiting the auth URL.',
						code: 'EXPIRED_CODE',
						details: {
							redirectUri: process.env.GOOGLE_REDIRECT_URI,
							timestamp: new Date().toISOString(),
						},
					},
					{ status: 400 },
				);
			}

			if (errorMessage.includes('redirect_uri_mismatch')) {
				return NextResponse.json(
					{
						error: 'Redirect URI mismatch',
						message:
							'The redirect URI in your Google Cloud Console does not match the one in your environment variables.\n\n' +
							'Expected: ' +
							process.env.GOOGLE_REDIRECT_URI +
							'\n' +
							'Please check your Google Cloud Console OAuth2 configuration.',
						code: 'REDIRECT_MISMATCH',
						details: {
							expectedRedirectUri: process.env.GOOGLE_REDIRECT_URI,
						},
					},
					{ status: 400 },
				);
			}

			if (errorMessage.includes('invalid_client')) {
				return NextResponse.json(
					{
						error: 'Invalid client credentials',
						message:
							'Your Google OAuth2 client credentials are invalid. Please check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
						code: 'INVALID_CLIENT',
					},
					{ status: 400 },
				);
			}

			if (errorMessage.includes('invalid_request')) {
				return NextResponse.json(
					{
						error: 'Invalid request',
						message: 'The OAuth request was malformed. This could be due to missing or invalid parameters.',
						code: 'INVALID_REQUEST',
					},
					{ status: 400 },
				);
			}
		}

		// Generic error response
		return NextResponse.json(
			{
				error: 'Authentication failed',
				message: error instanceof Error ? error.message : 'Unknown error',
				details: {
					redirectUri: process.env.GOOGLE_REDIRECT_URI,
					timestamp: new Date().toISOString(),
				},
			},
			{ status: 500 },
		);
	}
}
