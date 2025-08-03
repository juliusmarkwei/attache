'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface TestResult {
	status: string;
	environment: any;
	activeIntegrations: number;
	integrationTests: any[];
	webhookAccessible: boolean;
	webhookUrl: string;
	timestamp: string;
}

export default function TestPage() {
	const [testResult, setTestResult] = useState<TestResult | null>(null);
	const [loading, setLoading] = useState(false);

	const runTest = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/gmail/test');
			const result = await response.json();
			setTestResult(result);
		} catch (error) {
			console.error('Test failed:', error);
			setTestResult({
				status: 'error',
				environment: {},
				activeIntegrations: 0,
				integrationTests: [],
				webhookAccessible: false,
				webhookUrl: '',
				timestamp: new Date().toISOString(),
			});
		} finally {
			setLoading(false);
		}
	};

	const testWebhook = async () => {
		try {
			const response = await fetch('/api/gmail/webhook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ test: true, historyId: '12345' }),
			});
			const result = await response.json();
			alert(`Webhook test result: ${JSON.stringify(result, null, 2)}`);
		} catch (error) {
			alert(`Webhook test failed: ${error}`);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-white">Gmail Integration Test</CardTitle>
						<CardDescription className="text-slate-300">
							Test your Gmail integration and webhook setup
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex space-x-4">
							<Button onClick={runTest} disabled={loading}>
								{loading ? 'Running Test...' : 'Run Gmail Test'}
							</Button>
							<Button onClick={testWebhook} variant="outline">
								Test Webhook
							</Button>
						</div>

						{testResult && (
							<div className="space-y-4">
								{/* Environment Check */}
								<Card className="bg-slate-700/50">
									<CardHeader>
										<CardTitle className="text-white text-lg">Environment</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-2 text-sm">
											<div className="flex justify-between">
												<span className="text-slate-300">GOOGLE_CLIENT_ID:</span>
												<span className={testResult.environment.GOOGLE_CLIENT_ID ? 'text-green-400' : 'text-red-400'}>
													{testResult.environment.GOOGLE_CLIENT_ID ? '✅' : '❌'}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-300">GOOGLE_CLIENT_SECRET:</span>
												<span className={testResult.environment.GOOGLE_CLIENT_SECRET ? 'text-green-400' : 'text-red-400'}>
													{testResult.environment.GOOGLE_CLIENT_SECRET ? '✅' : '❌'}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-300">GOOGLE_REDIRECT_URI:</span>
												<span className="text-blue-400">{testResult.environment.GOOGLE_REDIRECT_URI}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-300">NEXT_PUBLIC_CONVEX_URL:</span>
												<span className={testResult.environment.NEXT_PUBLIC_CONVEX_URL ? 'text-green-400' : 'text-red-400'}>
													{testResult.environment.NEXT_PUBLIC_CONVEX_URL ? '✅' : '❌'}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Integration Status */}
								<Card className="bg-slate-700/50">
									<CardHeader>
										<CardTitle className="text-white text-lg">Integration Status</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-slate-300">Active Integrations:</span>
												<span className="text-blue-400">{testResult.activeIntegrations}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-300">Webhook Accessible:</span>
												<span className={testResult.webhookAccessible ? 'text-green-400' : 'text-red-400'}>
													{testResult.webhookAccessible ? '✅' : '❌'}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-slate-300">Webhook URL:</span>
												<span className="text-blue-400 text-xs">{testResult.webhookUrl}</span>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Integration Tests */}
								{testResult.integrationTests.length > 0 && (
									<Card className="bg-slate-700/50">
										<CardHeader>
											<CardTitle className="text-white text-lg">Integration Tests</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												{testResult.integrationTests.map((test, index) => (
													<div key={index} className="border border-slate-600 rounded p-3">
														<div className="flex justify-between items-center mb-2">
															<span className="text-slate-300">User ID:</span>
															<span className="text-blue-400 text-xs">{test.userId}</span>
														</div>
														{test.error ? (
															<div className="text-red-400 text-sm">{test.error}</div>
														) : (
															<div className="grid grid-cols-2 gap-2 text-sm">
																<div className="flex justify-between">
																	<span className="text-slate-300">Email:</span>
																	<span className="text-green-400">{test.email}</span>
																</div>
																<div className="flex justify-between">
																	<span className="text-slate-300">Access Token:</span>
																	<span className={test.accessTokenValid ? 'text-green-400' : 'text-red-400'}>
																		{test.accessTokenValid ? '✅ Valid' : '❌ Invalid'}
																	</span>
																</div>
																<div className="flex justify-between">
																	<span className="text-slate-300">Recent Messages:</span>
																	<span className="text-blue-400">{test.recentMessages}</span>
																</div>
																{test.subscriptionExpiration && (
																	<div className="flex justify-between">
																		<span className="text-slate-300">Subscription Expires:</span>
																		<span className="text-yellow-400">
																			{new Date(test.subscriptionExpiration).toLocaleString()}
																		</span>
																	</div>
																)}
																{test.historyId && (
																	<div className="flex justify-between">
																		<span className="text-slate-300">History ID:</span>
																		<span className="text-blue-400 text-xs">{test.historyId}</span>
																	</div>
																)}
															</div>
														)}
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Troubleshooting Tips */}
								<Card className="bg-blue-500/10 border border-blue-500/20">
									<CardHeader>
										<CardTitle className="text-blue-400 text-lg">Troubleshooting Tips</CardTitle>
									</CardHeader>
									<CardContent className="text-blue-300 text-sm space-y-2">
										{testResult.activeIntegrations === 0 && (
											<p>• No active Gmail integrations found. Complete the OAuth flow in Gmail Setup.</p>
										)}
										{!testResult.webhookAccessible && (
											<p>• Webhook endpoint is not accessible. Check your server configuration.</p>
										)}
										{testResult.activeIntegrations > 0 && testResult.webhookAccessible && (
											<p>• Integration looks good! Try sending an email with an attachment to test webhook processing.</p>
										)}
										<p>• Check the server console for detailed webhook logs when emails are received.</p>
										<p>• Webhooks require a publicly accessible URL. For local development, use ngrok or similar.</p>
									</CardContent>
								</Card>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
