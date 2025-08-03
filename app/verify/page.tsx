'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';
import { OtpInput } from '../components/ui/otp-input';

export default function VerifyPage() {
	const [otp, setOtp] = useState('');
	const [verifyLoading, setVerifyLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(60); // Start with 60 seconds
	const [otpSentTime, setOtpSentTime] = useState<Date | null>(null);
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	// Countdown timer for resend OTP
	useEffect(() => {
		if (resendCountdown > 0) {
			const timer = setTimeout(() => {
				setResendCountdown(resendCountdown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [resendCountdown]);

	// Get email from sessionStorage and set initial OTP sent time
	useEffect(() => {
		const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
		if (storedEmail) {
			setEmail(storedEmail);
			if (!otpSentTime) {
				setOtpSentTime(new Date());
			}
		} else {
			// No email found, redirect to login
			router.push('/login');
		}
		setIsLoading(false);
	}, [otpSentTime, router]);

	// Handle direct access with old URL format (for backward compatibility)
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get('email');
		if (emailParam) {
			// Clear the URL parameter and store in sessionStorage
			sessionStorage.setItem('pendingVerificationEmail', emailParam);
			// Replace URL without the email parameter
			window.history.replaceState({}, '', '/verify');
			setEmail(emailParam);
			if (!otpSentTime) {
				setOtpSentTime(new Date());
			}
		}
	}, [otpSentTime]);

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			toast.error('Email is required');
			return;
		}

		setVerifyLoading(true);
		try {
			const response = await fetch('/api/auth/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, otp }),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('Verification successful!', {
					description: 'Welcome to Attache.',
				});
				// Clear sessionStorage and redirect to dashboard
				sessionStorage.removeItem('pendingVerificationEmail');
				router.push('/dashboard');
			} else {
				toast.error(data.error || 'Invalid OTP');
			}
		} catch (error) {
			console.error('OTP verification error:', error);
			toast.error('Network error. Please try again.');
		} finally {
			setVerifyLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (!email) {
			toast.error('Email is required');
			return;
		}

		setResendLoading(true);
		try {
			const response = await fetch('/api/auth/otp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('OTP resent successfully!', {
					description: 'Check your email for the new 6-digit code.',
				});
				setResendCountdown(60); // Reset to 60 seconds
				setOtpSentTime(new Date());
			} else {
				toast.error(data.error || 'Failed to resend OTP');
			}
		} catch (error) {
			console.error('Resend OTP error:', error);
			toast.error('Network error. Please try again.');
		} finally {
			setResendLoading(false);
		}
	};

	// Show loading while email is being retrieved
	if (isLoading) {
		return (
			<AuthLayout title="Verifying..." subtitle="Please wait">
				<div className="flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[#FFB900]" />
				</div>
			</AuthLayout>
		);
	}

	// Show loading if no email found (will redirect to login)
	if (!email) {
		return null;
	}

	return (
		<AuthLayout title="OTP VERIFICATION" subtitle="Enter the OTP sent to your email">
			<div className="space-y-8">
				{/* OTP Input Section */}
				<div className="text-center space-y-4">
					<OtpInput value={otp} onChange={setOtp} />

					{/* Countdown Timer */}
					{resendCountdown > 0 && (
						<div className="flex justify-center items-center gap-2">
							<p className="text-sm text-white/80">Resend in </p>
							<p className="text-sm text-white/80">
								{Math.floor(resendCountdown / 60)
									.toString()
									.padStart(2, '0')}
								:{(resendCountdown % 60).toString().padStart(2, '0')}
							</p>
						</div>
					)}

					{/* Resend Section - Only show when countdown reaches 0 */}
					{resendCountdown === 0 && (
						<div className="text-center">
							<p className="text-sm text-white/80 mb-2">
								Didn't receive code?{' '}
								<button
									type="button"
									onClick={handleResendOtp}
									disabled={resendLoading}
									className="text-[#FFB900] hover:text-[#FFB900]/80 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{resendLoading ? 'Resending...' : 'Re-send'}
								</button>
							</p>
						</div>
					)}
				</div>

				{/* Submit Button */}
				<form onSubmit={handleOtpSubmit}>
					<Button
						type="submit"
						className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
						disabled={verifyLoading || otp.length !== 6 || resendLoading}
					>
						{verifyLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Verifying...
							</>
						) : (
							'Submit'
						)}
					</Button>
				</form>

				{/* Back to Login Link */}
				<div className="text-center">
					<button
						type="button"
						onClick={() => router.push('/login')}
						className="text-sm text-white/80 hover:text-white transition-colors underline cursor-pointer"
					>
						Back to Login
					</button>
				</div>
			</div>
		</AuthLayout>
	);
}
