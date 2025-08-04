'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';

export default function VerifyEmailPage() {
	const [loading, setLoading] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	useEffect(() => {
		if (!token) {
			setVerificationStatus('error');
			return;
		}

		// Verify email with token
		const verifyEmail = async () => {
			setLoading(true);
			try {
				const response = await fetch('/api/auth/verify-email', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ token }),
				});

				const data = await response.json();

				if (response.ok) {
					toast.success('Email verified successfully!', {
						description: 'You can now sign in to your account.',
					});
					setVerificationStatus('success');
				} else {
					toast.error(data.error || 'Failed to verify email');
					setVerificationStatus('error');
				}
			} catch (error) {
				toast.error('Network error. Please try again.');
				setVerificationStatus('error');
			} finally {
				setLoading(false);
			}
		};

		verifyEmail();
	}, [token]);

	// Loading state
	if (verificationStatus === 'loading' || loading) {
		return (
			<AuthLayout title="Verifying Email..." subtitle="Please wait while we verify your email">
				<div className="flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[#FFB900]" />
				</div>
			</AuthLayout>
		);
	}

	// Error state
	if (verificationStatus === 'error') {
		return (
			<AuthLayout title="Verification Failed" subtitle="We couldn't verify your email address">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
							<XCircle className="w-8 h-8 text-red-500" />
						</div>
						<h3 className="text-xl font-semibold text-white">Verification Failed</h3>
						<p className="text-white/80">
							The verification link is invalid or has expired. Please check your email for a valid link or
							request a new one.
						</p>
					</div>

					<div className="space-y-3">
						<Button
							onClick={() => router.push('/login')}
							className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
						>
							Back to Sign In
						</Button>
						<Button
							type="button"
							variant="link"
							onClick={() => router.push('/signup')}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							Create New Account
						</Button>
					</div>
				</div>
			</AuthLayout>
		);
	}

	// Success state
	if (verificationStatus === 'success') {
		return (
			<AuthLayout title="Email Verified!" subtitle="Your email has been verified successfully">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
							<CheckCircle className="w-8 h-8 text-green-500" />
						</div>
						<h3 className="text-xl font-semibold text-white">Email Verified Successfully!</h3>
						<p className="text-white/80">
							Your email has been verified. You can now sign in to your account and start using Attache.
						</p>
					</div>

					<Button
						onClick={() => router.push('/login')}
						className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
					>
						Sign In
					</Button>
				</div>
			</AuthLayout>
		);
	}

	// Default state (shouldn't reach here)
	return (
		<AuthLayout title="Verifying..." subtitle="Please wait">
			<div className="flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[#FFB900]" />
			</div>
		</AuthLayout>
	);
}
