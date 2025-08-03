'use client';

import { AlertCircle, CheckCircle, ExternalLink, Loader2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';

interface AuthStatus {
	step: 'initial' | 'authorizing' | 'authorized' | 'subscribing' | 'completed' | 'error';
	message: string;
	authUrl?: string;
	tokens?: {
		access_token: string;
		refresh_token: string;
		expiry_date: number;
	};
	subscription?: {
		historyId: string;
		expiration: string;
	};
	error?: string;
}

export default function GmailSetup() {
	const { user, handleLogout, checkAuth, loading, setUser } = useAuth();
	const [status, setStatus] = useState<AuthStatus>({
		step: 'initial',
		message: 'Ready to configure Gmail integration',
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const userIdRef = useRef<string | null>(null);

	// Ensure user is authenticated on mount and handle auth callback
	useEffect(() => {
		const handleAuth = async () => {
			if (!user) {
				// Don't redirect to login if we're in the middle of OAuth flow
				const urlParams = new URLSearchParams(window.location.search);
				if (urlParams.get('code')) {
					// Try to check auth without redirecting
					const isAuthenticated = await checkAuth(false);
					if (!isAuthenticated) {
						setStatus({
							step: 'error',
							message: 'Authentication required. Please log in again.',
							error: 'User not authenticated. Please refresh the page or log in again.',
						});
					}
				} else {
					checkAuth();
				}
			} else {
			}

			// Debug user state

			userIdRef.current = user?.id || null;

			// Check for auth callback
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('code')) {
				// Wait for user authentication to complete before handling callback
				if (user?.id) {
					handleAuthCallback();
				} else if (!loading) {
					// If not loading and no user, authentication failed
					setStatus({
						step: 'error',
						message: 'Authentication required. Please log in again.',
						error: 'User not authenticated. Please refresh the page or log in again.',
					});
				}
			}
		};

		handleAuth();
	}, [user?.id, loading, checkAuth]);

	// Retry authentication if needed
	useEffect(() => {
		if (!user && !loading) {
			checkAuth();
		}
	}, [user, loading, checkAuth]);

	// Show loading state while checking auth
	if (loading || (!user && !loading)) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FFB900] mx-auto"></div>
					<p className="mt-4 text-slate-300">{loading ? 'Loading...' : 'Checking authentication...'}</p>
				</div>
			</div>
		);
	}

	// Check if user already has Gmail integration (disabled for now to fix hooks issue)
	// const gmailIntegration = useQuery(
	// 	api.gmail.getGmailIntegration,
	// 	{ userId: userIdRef.current || '' }
	// );

	// Show existing integration status
	// useEffect(() => {
	// 	if (gmailIntegration && status.step === 'initial' && user?.id) {
	// 		setStatus({
	// 			step: 'completed',
	// 			message: 'Gmail integration is already configured!',
	// 			subscription: {
	// 				historyId: gmailIntegration.historyId || 'Active',
	// 				expiration: gmailIntegration.subscriptionExpiration?.toString() || 'Active',
	// 			},
	// 		});
	// 	}
	// }, [gmailIntegration, status.step, user?.id]);

	const startAuth = async () => {
		// Clear any existing URL parameters to start fresh
		window.history.replaceState({}, document.title, window.location.pathname);

		// Clear any processed code markers
		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key && key.startsWith('processed_')) {
				sessionStorage.removeItem(key);
			}
		}

		if (!user?.id) {
			console.log('❌ No user ID available for Gmail auth');
			setStatus({
				step: 'error',
				message: 'User not authenticated. Please log in again.',
				error: 'User ID not available',
			});
			return;
		}

		setStatus({
			step: 'authorizing',
			message: 'Generating authorization URL...',
		});

		try {
			const response = await fetch('/api/gmail/auth');
			const data = await response.json();

			if (data.authUrl) {
				setStatus({
					step: 'authorizing',
					message: 'Click the button below to authorize Gmail access',
					authUrl: data.authUrl,
				});
			} else {
				throw new Error('Failed to generate auth URL');
			}
		} catch (error) {
			setStatus({
				step: 'error',
				message: 'Failed to start authorization',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const handleAuthCallback = async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		if (!code) {
			setStatus({
				step: 'error',
				message: 'No authorization code received',
				error: 'Authorization code missing from URL',
			});
			return;
		}

		// Check if we've already processed this code
		const processedCodeKey = `processed_${code}`;
		if (sessionStorage.getItem(processedCodeKey)) {
			console.log('🔄 Code already processed, clearing URL...');
			window.history.replaceState({}, document.title, window.location.pathname);
			setStatus({
				step: 'error',
				message: 'Authorization code already processed',
				error: 'This authorization code has already been processed. Please try again.',
			});
			return;
		}

		// Mark this code as being processed
		sessionStorage.setItem(processedCodeKey, 'true');

		setStatus({
			step: 'authorizing',
			message: 'Exchanging authorization code for tokens...',
		});

		try {
			const response = await fetch(`/api/gmail/auth?code=${code}`);
			const data = await response.json();

			if (response.ok && data.success && data.access_token) {
				const tokens = {
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					expiry_date: data.expiry_date,
				};

				setStatus({
					step: 'authorized',
					message: 'Gmail access authorized successfully!',
					tokens,
				});

				// Automatically proceed to subscription with the tokens
				setTimeout(() => subscribeToGmail(tokens.access_token), 1000);
			} else {
				// Handle error response from API
				const errorMessage = data.message || data.error || 'Failed to get tokens';
				const errorCode = data.code;
				let shouldRetry = false;

				if (
					errorCode === 'EXPIRED_CODE' ||
					errorMessage.includes('invalid_grant') ||
					errorCode === 'CODE_ALREADY_USED'
				) {
					// Immediately clear the URL to stop the loop
					window.history.replaceState({}, document.title, window.location.pathname);

					setStatus({
						step: 'error',
						message: 'Authorization code expired or already used. Please try again.',
						error:
							'The authorization code has expired or was already used. This typically happens when:\n' +
							'• The code was used more than once\n' +
							'• The code expired (they expire within 10 minutes)\n' +
							'• There was a redirect URI mismatch\n\n' +
							'Please click "Try Again" to start a fresh authorization process.',
					});
					shouldRetry = true;
				} else if (errorCode === 'REDIRECT_MISMATCH' || errorMessage.includes('redirect_uri_mismatch')) {
					setStatus({
						step: 'error',
						message: 'Redirect URI configuration error.',
						error:
							'The redirect URI in your Google Cloud Console does not match your environment variables.\n\n' +
							'Expected: ' +
							(data.details?.expectedRedirectUri || 'http://localhost:3000') +
							'\n\n' +
							'Please check your Google Cloud Console OAuth2 configuration and ensure the redirect URI matches your GOOGLE_REDIRECT_URI environment variable.',
					});
				} else if (errorCode === 'INVALID_CLIENT') {
					setStatus({
						step: 'error',
						message: 'Invalid client credentials.',
						error: 'Your Google OAuth2 client credentials are invalid. Please check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
					});
				} else if (errorCode === 'INVALID_REQUEST') {
					setStatus({
						step: 'error',
						message: 'Invalid OAuth request.',
						error: 'The OAuth request was malformed. This could be due to missing or invalid parameters.',
					});
				} else {
					setStatus({
						step: 'error',
						message: 'Failed to complete authorization',
						error: errorMessage,
					});
				}

				// If it's an expired code, we can retry
				if (shouldRetry) {
					setTimeout(() => {
						setStatus({
							step: 'initial',
							message: 'Ready to configure Gmail integration',
						});
					}, 3000);
				}
			}
		} catch (error) {
			console.error('Gmail auth callback error:', error);
			setStatus({
				step: 'error',
				message: 'Failed to complete authorization',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const subscribeToGmail = async (accessToken?: string) => {
		if (!user?.id) {
			console.log('❌ No user ID available for Gmail subscription');
			setStatus({
				step: 'error',
				message: 'User not authenticated. Please log in again.',
				error: 'User ID not available',
			});
			return;
		}

		setStatus({
			step: 'subscribing',
			message: 'Setting up Gmail push notifications...',
		});

		try {
			const requestBody = {
				access_token: accessToken || status.tokens?.access_token,
				refresh_token: status.tokens?.refresh_token || '',
				userId: user.id,
			};

			const response = await fetch('/api/gmail/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();

			if (data.success) {
				setStatus({
					step: 'completed',
					message: 'Gmail integration setup complete!',
					subscription: {
						historyId: data.historyId,
						expiration: data.expiration,
					},
				});
			} else {
				throw new Error(data.message || 'Failed to configure Gmail access');
			}
		} catch (error) {
			setStatus({
				step: 'error',
				message: 'Failed to configure Gmail access',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const getStepIcon = () => {
		switch (status.step) {
			case 'initial':
				return <Mail className="h-6 w-6" />;
			case 'authorizing':
			case 'subscribing':
				return <Loader2 className="h-6 w-6 animate-spin" />;
			case 'authorized':
				return <CheckCircle className="h-6 w-6 text-green-500" />;
			case 'completed':
				return <CheckCircle className="h-6 w-6 text-green-500" />;
			case 'error':
				return <AlertCircle className="h-6 w-6 text-red-500" />;
			default:
				return <Mail className="h-6 w-6" />;
		}
	};

	const getStepBadge = () => {
		switch (status.step) {
			case 'initial':
				return <Badge variant="secondary">Ready</Badge>;
			case 'authorizing':
				return <Badge variant="secondary">Authorizing</Badge>;
			case 'authorized':
				return <Badge variant="default">Authorized</Badge>;
			case 'subscribing':
				return <Badge variant="secondary">Subscribing</Badge>;
			case 'completed':
				return <Badge variant="default">Complete</Badge>;
			case 'error':
				return <Badge variant="destructive">Error</Badge>;
			default:
				return <Badge variant="secondary">Ready</Badge>;
		}
	};

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onLogout={handleLogout}
				onCollapsedChange={setSidebarCollapsed}
			/>

			{/* Main Content */}
			<div
				className={`flex-1 transition-all duration-300 w-full h-dvh ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
			>
				{/* Main Content */}
				<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-dvh">
					<div className="max-w-2xl mx-auto">
						<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
							<CardHeader>
								<div className="flex items-center space-x-3">
									{getStepIcon()}
									<div>
										<CardTitle className="text-white">Gmail Integration Setup</CardTitle>
										<CardDescription className="text-slate-300">
											Configure automatic email processing and document organization
										</CardDescription>
									</div>
								</div>
								<div className="mt-4">{getStepBadge()}</div>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* Status Message */}
								<div className="p-4 bg-slate-700/50 rounded-lg">
									<p className="text-slate-200">{status.message}</p>
									{status.error && <p className="text-red-400 text-sm mt-2">{status.error}</p>}
								</div>

								{/* Step 1: Authorization */}
								{status.step === 'initial' && (
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-white">
											Step 1: Authorize Gmail Access
										</h3>
										<p className="text-slate-300">
											Grant Attache permission to read your Gmail messages and process
											attachments.
										</p>
										<Button onClick={startAuth} className="w-full">
											<Mail className="h-4 w-4 mr-2" />
											Authorize Gmail Access
										</Button>
									</div>
								)}

								{/* Step 2: Auth URL */}
								{status.step === 'authorizing' && status.authUrl && (
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-white">
											Step 2: Complete Authorization
										</h3>
										<p className="text-slate-300">
											Click the button below to complete the Google OAuth flow.
										</p>
										<Button
											onClick={() => window.open(status.authUrl, '_blank')}
											className="w-full"
											variant="outline"
										>
											<ExternalLink className="h-4 w-4 mr-2" />
											Complete Authorization
										</Button>
										<p className="text-xs text-slate-400">
											You'll be redirected back here after authorization.
										</p>
									</div>
								)}

								{/* Step 3: Subscription */}
								{status.step === 'authorized' && (
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-white">
											Step 3: Configure Gmail Access
										</h3>
										<p className="text-slate-300">
											Setting up Gmail API access for email processing.
										</p>
										<div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
											<p className="text-green-400 text-sm">
												✅ Gmail access authorized successfully!
											</p>
										</div>
									</div>
								)}

								{/* Step 4: Completion */}
								{status.step === 'completed' && (
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-white">Setup Complete!</h3>
										<div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
											<p className="text-green-400 text-sm">
												✅ Gmail access configured successfully!
											</p>
											{status.subscription && (
												<div className="text-xs text-slate-300 space-y-1">
													<p>History ID: {status.subscription.historyId}</p>
													<p>
														Expires:{' '}
														{new Date(status.subscription.expiration).toLocaleString()}
													</p>
												</div>
											)}
										</div>
										<p className="text-slate-300 text-sm">
											Your Gmail account is now connected. New emails with attachments will be
											automatically processed and organized by company.
										</p>
									</div>
								)}

								{/* Error State */}
								{status.step === 'error' && (
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-white">Setup Failed</h3>
										<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
											<p className="text-red-400 text-sm">{status.error}</p>
										</div>
										<div className="flex space-x-2">
											<Button
												onClick={() => {
													// Clear URL parameters and restart
													window.history.replaceState(
														{},
														document.title,
														window.location.pathname,
													);
													setStatus({
														step: 'initial',
														message: 'Ready to configure Gmail integration',
													});
												}}
												className="flex-1"
											>
												Try Again
											</Button>
											<Button
												onClick={() => {
													checkAuth();
													setStatus({
														step: 'initial',
														message: 'Checking authentication...',
													});
												}}
												variant="outline"
												className="flex-1"
											>
												Re-authenticate
											</Button>
										</div>
										{/* Additional help for expired code */}
										{status.error?.includes('expired') && (
											<div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
												<p className="text-blue-400 text-xs">
													💡 Tip: Authorization codes expire quickly. If you see this error,
													click "Try Again" to start a fresh authorization process.
												</p>
											</div>
										)}

										{/* Additional help for redirect URI issues */}
										{status.error?.includes('redirect_uri_mismatch') && (
											<div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
												<p className="text-yellow-400 text-xs">
													🔧 Troubleshooting: Check your Google Cloud Console OAuth2
													configuration. The redirect URI should be exactly:{' '}
													<code className="bg-slate-700 px-1 rounded">
														http://localhost:3000
													</code>
												</p>
											</div>
										)}

										{/* Additional help for client credentials */}
										{status.error?.includes('client credentials') && (
											<div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
												<p className="text-yellow-400 text-xs">
													🔧 Troubleshooting: Verify your environment variables
													GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correctly set.
												</p>
											</div>
										)}
									</div>
								)}

								{/* Progress Steps */}
								<div className="flex items-center justify-between text-xs text-slate-400">
									<div
										className={`flex items-center space-x-2 ${status.step !== 'initial' ? 'text-green-400' : ''}`}
									>
										<span>1. Authorize</span>
									</div>
									<div className="flex-1 h-px bg-slate-600 mx-4" />
									<div
										className={`flex items-center space-x-2 ${['authorized', 'subscribing', 'completed'].includes(status.step) ? 'text-green-400' : ''}`}
									>
										<span>2. Subscribe</span>
									</div>
									<div className="flex-1 h-px bg-slate-600 mx-4" />
									<div
										className={`flex items-center space-x-2 ${status.step === 'completed' ? 'text-green-400' : ''}`}
									>
										<span>3. Complete</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		</div>
	);
}
