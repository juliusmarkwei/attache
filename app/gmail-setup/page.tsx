'use client';

import { useQuery } from 'convex/react';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import Sidebar from '../components/dashboard/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
	const { user, loading, authChecked, handleLogout } = useAuth();
	const gmailIntegration = useQuery(api.gmail.getGmailIntegration, user?.id ? { userId: user.id as any } : 'skip');
	const [status, setStatus] = useState<AuthStatus>({
		step: 'initial',
		message: 'Ready to configure Gmail integration',
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const userIdRef = useRef<string | null>(null);

	useEffect(() => {
		userIdRef.current = user?.id || null;
	}, [user?.id]);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const hasCode = urlParams.get('code');
		const hasSuccess = urlParams.get('success') === 'true';
		const hasTokenId = urlParams.get('tokenId');

		console.log('🔍 Gmail setup useEffect triggered:', {
			hasCode: !!hasCode,
			hasSuccess,
			hasTokenId: !!hasTokenId,
			user: !!user,
			userId: user?.id,
			loading,
			authChecked,
			hasGmailIntegration: !!gmailIntegration,
		});

		// Wait for auth check to complete before making decisions
		if (loading || !authChecked) {
			console.log('🔍 Waiting for auth check to complete...');
			return;
		}

		// If user has an active Gmail integration and no OAuth flow in progress, show completed state
		if (user?.id && gmailIntegration && !hasCode && !hasSuccess && !hasTokenId) {
			console.log('🔍 User has active Gmail integration, showing completed state');
			setStatus({
				step: 'completed',
				message: 'Gmail integration is already active!',
				subscription: {
					historyId: gmailIntegration.historyId || 'Active',
					expiration: gmailIntegration.subscriptionExpiration
						? new Date(gmailIntegration.subscriptionExpiration).toLocaleString()
						: 'Active',
				},
			});
			return;
		}

		// If user is not authenticated but has an authorization code, store it and redirect to login
		if (!user && hasCode && !hasTokenId) {
			console.log('🔍 User not authenticated with code, storing code and redirecting to login');
			// Store the code in sessionStorage for later processing
			sessionStorage.setItem('pending_gmail_code', hasCode);
			const currentUrl = window.location.href;
			window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
			return;
		}

		// If user is not authenticated but has tokenId, it means the API redirect happened
		// but the user session expired. We need to wait for authentication.
		if (!user && hasTokenId) {
			console.log('🔍 User not authenticated but has tokenId, waiting for auth...');
			return;
		}

		// If user is authenticated, handle the OAuth flow
		if (user?.id) {
			console.log('🔍 User authenticated, handling OAuth flow');

			// Check for pending code from sessionStorage
			const pendingCode = sessionStorage.getItem('pending_gmail_code');
			if (pendingCode) {
				console.log('🔍 Found pending code in sessionStorage, processing...');
				sessionStorage.removeItem('pending_gmail_code');
				// Process the pending code
				handleAuthCallbackWithCode(pendingCode);
				return;
			}

			if (hasSuccess && hasTokenId) {
				console.log('🔍 Handling auth success with tokenId');
				handleAuthSuccessWithTokenId();
			} else if (hasCode) {
				console.log('🔍 Handling auth callback with code');
				// If we have a code but no success, it means the redirect didn't work
				// Let's handle the code directly
				handleAuthCallback();
			} else if (hasTokenId) {
				console.log('🔍 Handling auth success with tokenId');
				handleAuthSuccessWithTokenId();
			} else {
				console.log('🔍 No code or success parameters found, checking for delayed redirect...');
				// Check if we're in the middle of a redirect
				setTimeout(() => {
					const currentUrlParams = new URLSearchParams(window.location.search);
					const currentSuccess = currentUrlParams.get('success');
					const currentTokenId = currentUrlParams.get('tokenId');
					const currentCode = currentUrlParams.get('code');

					console.log(
						'🔍 Delayed check - success:',
						currentSuccess,
						'tokenId:',
						currentTokenId,
						'code:',
						currentCode,
					);

					if (currentSuccess === 'true' && currentTokenId) {
						console.log('🔍 Found tokenId after delay, handling auth success');
						handleAuthSuccessWithTokenId();
					} else if (currentCode) {
						console.log('🔍 Found code after delay, handling auth callback');
						handleAuthCallback();
					}
				}, 2000);
			}
		}
	}, [user?.id, loading, authChecked, gmailIntegration]);

	// Add a separate effect to log when the component mounts
	useEffect(() => {
		console.log('🔍 Gmail setup page mounted, current URL:', window.location.href);
		console.log('🔍 Current user:', user?.id);

		// Log all URL parameters for debugging
		const urlParams = new URLSearchParams(window.location.search);
		const allParams: Record<string, string> = {};
		urlParams.forEach((value, key) => {
			allParams[key] = value.substring(0, 20) + '...'; // Truncate long values
		});
		console.log('🔍 All URL parameters:', allParams);

		// Check if we have a tokenId and user is authenticated
		const tokenId = urlParams.get('tokenId');
		const success = urlParams.get('success');
		if (user && success === 'true' && tokenId) {
			console.log('🔍 User authenticated with tokenId, processing...');
			handleAuthSuccessWithTokenId();
		}
	}, [user, loading, authChecked]);

	// Add a separate effect to monitor URL changes
	useEffect(() => {
		const handleUrlChange = () => {
			console.log('🔍 URL changed to:', window.location.href);
			const urlParams = new URLSearchParams(window.location.search);
			const tokenId = urlParams.get('tokenId');
			const success = urlParams.get('success');
			console.log('🔍 URL change - tokenId:', tokenId, 'success:', success);
		};

		// Listen for URL changes
		window.addEventListener('popstate', handleUrlChange);

		// Check current URL immediately
		handleUrlChange();

		return () => {
			window.removeEventListener('popstate', handleUrlChange);
		};
	}, []);

	if (!user) {
		return null;
	}

	const startAuth = async () => {
		window.history.replaceState({}, document.title, window.location.pathname);

		for (let i = 0; i < sessionStorage.length; i++) {
			const key = sessionStorage.key(i);
			if (key && key.startsWith('processed_')) {
				sessionStorage.removeItem(key);
			}
		}

		if (!user?.id) {
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
			const response = await fetch(`/api/gmail/auth?userId=${user.id}`);
			const data = await response.json();

			if (response.ok && data.authUrl) {
				setStatus({
					step: 'authorizing',
					message: 'Authorization URL generated. Please complete the OAuth flow.',
					authUrl: data.authUrl,
				});
			} else {
				setStatus({
					step: 'error',
					message: 'Failed to generate authorization URL',
					error: data.error || 'Unknown error',
				});
			}
		} catch (error) {
			setStatus({
				step: 'error',
				message: 'Failed to start authorization',
				error: 'Network error. Please try again.',
			});
		}
	};

	const handleAuthSuccessWithTokenId = async () => {
		console.log('🔍 handleAuthSuccessWithTokenId called');
		console.log('🔍 Current URL:', window.location.href);

		const urlParams = new URLSearchParams(window.location.search);
		const tokenId = urlParams.get('tokenId');

		console.log('🔍 handleAuthSuccessWithTokenId called with tokenId:', tokenId);

		if (!tokenId) {
			console.log('❌ No tokenId found in URL parameters');
			console.log('❌ All URL parameters:', Array.from(urlParams.entries()));
			setStatus({
				step: 'error',
				message: 'Authorization failed',
				error: 'No tokenId received from OAuth flow',
			});
			return;
		}

		// Clear URL parameters
		window.history.replaceState({}, document.title, window.location.pathname);

		try {
			// Fetch tokens from the API using tokenId
			const response = await fetch(`/api/gmail/auth/tokens?tokenId=${tokenId}`);
			const data = await response.json();

			if (response.ok && data.tokens) {
				const tokens = data.tokens;
				console.log('🔍 Retrieved tokens from API');

				setStatus({
					step: 'authorized',
					message: 'Gmail access authorized successfully!',
					tokens,
				});

				setTimeout(() => subscribeToGmail(tokens.access_token), 1000);
			} else {
				console.log('❌ Failed to retrieve tokens from API');
				setStatus({
					step: 'error',
					message: 'Authorization failed',
					error: 'Failed to retrieve tokens from server',
				});
			}
		} catch (error) {
			console.log('❌ Error retrieving tokens:', error);
			setStatus({
				step: 'error',
				message: 'Authorization failed',
				error: 'Network error while retrieving tokens',
			});
		}
	};

	const handleAuthSuccess = () => {
		console.log('🔍 handleAuthSuccess called');
		console.log('🔍 Current URL:', window.location.href);

		const urlParams = new URLSearchParams(window.location.search);
		const accessToken = urlParams.get('access_token');
		const refreshToken = urlParams.get('refresh_token');
		const expiryDate = urlParams.get('expiry_date');

		console.log('🔍 handleAuthSuccess called with tokens:', {
			hasAccessToken: !!accessToken,
			hasRefreshToken: !!refreshToken,
			hasExpiryDate: !!expiryDate,
			accessTokenLength: accessToken?.length || 0,
		});

		if (!accessToken) {
			console.log('❌ No access token found in URL parameters');
			console.log('❌ All URL parameters:', Array.from(urlParams.entries()));
			setStatus({
				step: 'error',
				message: 'Authorization failed',
				error: 'No access token received from OAuth flow',
			});
			return;
		}

		// Clear URL parameters
		window.history.replaceState({}, document.title, window.location.pathname);

		const tokens = {
			access_token: accessToken,
			refresh_token: refreshToken || '',
			expiry_date: parseInt(expiryDate || '0'),
		};

		console.log('🔍 Setting status to authorized and calling subscribeToGmail');
		setStatus({
			step: 'authorized',
			message: 'Gmail access authorized successfully!',
			tokens,
		});

		setTimeout(() => subscribeToGmail(tokens.access_token), 1000);
	};

	const handleAuthCallbackWithCode = async (code: string) => {
		console.log('🔍 handleAuthCallbackWithCode called with code:', code ? code.substring(0, 10) + '...' : 'none');

		if (!code) {
			console.log('❌ No code provided');
			return;
		}

		const processedCodeKey = `processed_${code}`;
		if (sessionStorage.getItem(processedCodeKey)) {
			console.log('❌ Code already processed, skipping');
			return;
		}

		sessionStorage.setItem(processedCodeKey, 'true');

		setStatus({
			step: 'authorizing',
			message: 'Exchanging authorization code for tokens...',
		});

		try {
			console.log('🔍 Making API call to exchange code for tokens');

			const response = await fetch(`/api/gmail/auth?code=${code}`);
			console.log('🔍 API response status:', response.status);

			const data = await response.json();
			console.log('🔍 API response data:', data);

			if (response.ok && data.success && data.access_token) {
				const tokens = {
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					expiry_date: data.expiry_date,
				};

				console.log('🔍 Successfully received tokens');

				setStatus({
					step: 'authorized',
					message: 'Gmail access authorized successfully!',
					tokens,
				});

				setTimeout(() => subscribeToGmail(tokens.access_token), 1000);
			} else {
				console.log('🔍 API call failed:', data);
				setStatus({
					step: 'error',
					message: data.message || 'Failed to complete authorization',
				});
			}
		} catch (error) {
			console.error('🔍 Error in handleAuthCallbackWithCode:', error);
			setStatus({
				step: 'error',
				message: 'Failed to complete authorization',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const handleAuthCallback = async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		console.log('🔍 handleAuthCallback called with code:', code ? code.substring(0, 10) + '...' : 'none');

		if (!code) {
			console.log('❌ No code found in URL parameters');
			return;
		}

		const processedCodeKey = `processed_${code}`;
		if (sessionStorage.getItem(processedCodeKey)) {
			console.log('❌ Code already processed, skipping');
			return;
		}

		sessionStorage.setItem(processedCodeKey, 'true');

		setStatus({
			step: 'authorizing',
			message: 'Exchanging authorization code for tokens...',
		});

		try {
			console.log('🔍 Making API call to exchange code for tokens');

			const response = await fetch(`/api/gmail/auth?code=${code}`);
			console.log('🔍 API response status:', response.status);

			const data = await response.json();
			console.log('🔍 API response data:', data);

			if (response.ok && data.success && data.access_token) {
				const tokens = {
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					expiry_date: data.expiry_date,
				};

				console.log('🔍 Successfully received tokens');

				setStatus({
					step: 'authorized',
					message: 'Gmail access authorized successfully!',
					tokens,
				});

				setTimeout(() => subscribeToGmail(tokens.access_token), 1000);
			} else {
				const errorMessage = data.message || data.error || 'Failed to get tokens';
				const errorCode = data.code;
				let shouldRetry = false;

				if (
					errorCode === 'EXPIRED_CODE' ||
					errorMessage.includes('invalid_grant') ||
					errorCode === 'CODE_ALREADY_USED'
				) {
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
			setStatus({
				step: 'error',
				message: 'Failed to complete authorization',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const subscribeToGmail = async (accessToken?: string) => {
		console.log('🔍 subscribeToGmail called with accessToken:', !!accessToken);

		setStatus({
			step: 'subscribing',
			message: 'Setting up Gmail push notifications...',
		});

		try {
			console.log('🔍 Making subscription request with:', {
				hasAccessToken: !!accessToken,
				hasTokens: !!status.tokens,
				userId: user?.id,
			});

			const response = await fetch('/api/gmail/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					access_token: accessToken || status.tokens?.access_token,
					refresh_token: status.tokens?.refresh_token,
					userId: user?.id,
				}),
			});

			console.log('🔍 Subscription response status:', response.status);
			const data = await response.json();
			console.log('🔍 Subscription response data:', data);

			if (response.ok && data.success) {
				setStatus({
					step: 'completed',
					message: 'Gmail integration setup complete!',
					subscription: {
						historyId: data.historyId || 'Active',
						expiration: data.expiration || 'Active',
					},
				});

				toast.success('Gmail integration setup complete!', {
					description: 'Your Gmail account is now connected and ready to process emails.',
				});
			} else {
				setStatus({
					step: 'error',
					message: 'Failed to setup Gmail notifications',
					error: data.error || 'Unknown error during subscription setup',
				});
			}
		} catch (error) {
			setStatus({
				step: 'error',
				message: 'Failed to setup Gmail notifications',
				error: 'Network error during subscription setup',
			});
		}
	};

	const getStepIcon = () => {
		switch (status.step) {
			case 'initial':
				return <Mail className="h-6 w-6 text-[#FFB900]" />;
			case 'authorizing':
				return <Loader2 className="h-6 w-6 text-[#FFB900] animate-spin" />;
			case 'authorized':
				return <CheckCircle className="h-6 w-6 text-green-400" />;
			case 'subscribing':
				return <Loader2 className="h-6 w-6 text-[#FFB900] animate-spin" />;
			case 'completed':
				return <CheckCircle className="h-6 w-6 text-green-400" />;
			case 'error':
				return <AlertCircle className="h-6 w-6 text-red-400" />;
			default:
				return <Mail className="h-6 w-6 text-[#FFB900]" />;
		}
	};

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onLogout={handleLogout}
				onCollapsedChange={setSidebarCollapsed}
				user={user}
				gmailIntegration={gmailIntegration}
			/>

			<div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
				<main className="max-w-5xl mx-auto px-6 py-8">
					{/* Header Section */}
					<div className="text-center mb-12">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFB900]/10 rounded-full mb-6">
							<Mail className="h-8 w-8 text-[#FFB900]" />
						</div>
						<h1 className="text-4xl font-bold text-white mb-4">Gmail Integration</h1>
						<p className="text-lg text-slate-300 max-w-2xl mx-auto">
							Connect your Gmail account to automatically process emails and organize documents by company
						</p>
					</div>

					{/* Progress Steps */}
					<div className="mb-8">
						<div className="flex items-center justify-center space-x-4">
							{['Authorize', 'Subscribe', 'Complete'].map((step, index) => {
								// Determine step completion based on status
								const isStep1Complete = ['authorized', 'subscribing', 'completed'].includes(
									status.step,
								);
								const isStep2Complete = ['completed'].includes(status.step);
								const isStep3Complete = ['completed'].includes(status.step);

								const isCurrentStep =
									(index === 0 && ['authorizing'].includes(status.step)) ||
									(index === 1 && ['authorized', 'subscribing'].includes(status.step)) ||
									(index === 2 && ['completed'].includes(status.step));

								const isComplete =
									(index === 0 && isStep1Complete) ||
									(index === 1 && isStep2Complete) ||
									(index === 2 && isStep3Complete);

								return (
									<div key={step} className="flex items-center">
										<div
											className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
												isComplete
													? 'bg-[#FFB900] border-[#FFB900] text-slate-900'
													: isCurrentStep
														? 'border-[#FFB900] text-[#FFB900]'
														: 'border-slate-600 text-slate-400'
											}`}
										>
											{index + 1}
										</div>
										{index < 2 && (
											<div
												className={`w-16 h-0.5 mx-2 ${
													isComplete ? 'bg-[#FFB900]' : 'bg-slate-600'
												}`}
											/>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Main Content Card */}
					<Card className="bg-slate-800/50 border-slate-700 shadow-xl">
						<CardContent className="p-8">
							{/* Status Display */}
							<div className="text-center mb-8">
								<div className="inline-flex items-center justify-center w-12 h-12 bg-slate-700/50 rounded-full mb-4">
									{getStepIcon()}
								</div>
								<h2 className="text-2xl font-semibold text-white mb-2">
									{status.step === 'initial' && 'Ready to Connect'}
									{status.step === 'authorizing' && 'Authorizing...'}
									{status.step === 'authorized' && 'Authorization Complete'}
									{status.step === 'subscribing' && 'Setting Up Notifications'}
									{status.step === 'completed' && 'Setup Complete'}
									{status.step === 'error' && 'Setup Error'}
								</h2>
								<p className="text-slate-300">{status.message}</p>
								{status.error && (
									<div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
										<p className="text-red-400 text-sm">{status.error}</p>
									</div>
								)}
							</div>

							{/* Step 1: Authorization */}
							{status.step === 'initial' && (
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-xl font-semibold text-white mb-4">
											Connect Your Gmail Account
										</h3>
										<p className="text-slate-300 max-w-2xl mx-auto">
											Grant Attache permission to read your Gmail messages and process
											attachments. This allows us to automatically organize your emails by
											company.
										</p>
									</div>
									<div className="flex justify-center">
										<Button
											onClick={startAuth}
											size="lg"
											className="px-8 py-4 text-lg bg-[#FFB900] hover:bg-[#FFB900]/90 text-slate-900"
										>
											<Mail className="h-5 w-5 mr-3" />
											Connect Gmail Account
										</Button>
									</div>
								</div>
							)}

							{/* Step 2: Auth URL */}
							{status.step === 'authorizing' && status.authUrl && (
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-xl font-semibold text-white mb-4">
											Complete Authorization
										</h3>
										<p className="text-slate-300 max-w-2xl mx-auto">
											Click the button below to complete the Google OAuth flow in a new window.
										</p>
									</div>
									<div className="flex justify-center">
										<Button
											onClick={() => window.open(status.authUrl, '_blank')}
											size="lg"
											variant="outline"
											className="px-8 py-4 text-lg border-[#FFB900] text-[#FFB900] hover:bg-[#FFB900]/10"
										>
											<ExternalLink className="h-5 w-5 mr-3" />
											Complete Authorization
										</Button>
									</div>
									<div className="text-center">
										<p className="text-sm text-slate-400">
											You'll be redirected back here after authorization.
										</p>
									</div>
								</div>
							)}

							{/* Step 3: Subscription */}
							{status.step === 'authorized' && (
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-xl font-semibold text-white mb-4">
											Setting Up Email Processing
										</h3>
										<p className="text-slate-300 max-w-2xl mx-auto">
											Configuring Gmail API access for automatic email processing and document
											organization.
										</p>
									</div>
									<div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
										<div className="flex items-center space-x-3">
											<CheckCircle className="h-6 w-6 text-green-400" />
											<p className="text-green-400 text-lg font-medium">
												Gmail access authorized successfully!
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Error State */}
							{status.step === 'error' && (
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-xl font-semibold text-white mb-4">Setup Error</h3>
										<p className="text-slate-300 max-w-2xl mx-auto">
											There was an issue with the Gmail integration setup. Please try again.
										</p>
									</div>
									<div className="flex justify-center space-x-4">
										<Button
											onClick={() => {
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
											size="lg"
											className="px-8 py-4 text-lg bg-[#FFB900] hover:bg-[#FFB900]/90 text-slate-900"
										>
											Try Again
										</Button>
										<Button
											onClick={() => {
												window.location.href = '/dashboard';
											}}
											variant="outline"
											size="lg"
											className="px-8 py-4 text-lg"
										>
											Back to Dashboard
										</Button>
									</div>
								</div>
							)}

							{/* Completed State */}
							{status.step === 'completed' && (
								<div className="space-y-6">
									<div className="text-center">
										<h3 className="text-xl font-semibold text-white mb-4">Setup Complete!</h3>
										<p className="text-slate-300 max-w-2xl mx-auto">
											Your Gmail integration is now active. Emails with attachments will be
											automatically processed and organized.
										</p>
									</div>
									<div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
										<div className="flex items-center space-x-3">
											<CheckCircle className="h-6 w-6 text-green-400" />
											<p className="text-green-400 text-lg font-medium">
												Gmail integration is now active!
											</p>
										</div>
									</div>
									<div className="flex justify-center">
										<Button
											onClick={() => {
												window.location.href = '/dashboard';
											}}
											size="lg"
											className="px-8 py-4 text-lg bg-[#FFB900] hover:bg-[#FFB900]/90 text-slate-900"
										>
											Go to Dashboard
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</main>
			</div>
		</div>
	);
}
