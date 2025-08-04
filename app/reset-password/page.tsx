'use client';

import { CheckCircle, Eye, EyeOff, Loader2, Lock, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function ResetPasswordPage() {
	const [passwordData, setPasswordData] = useState({
		password: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);
	const [passwordReset, setPasswordReset] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	useEffect(() => {
		if (!token) {
			setTokenValid(false);
			return;
		}

		const verifyToken = async () => {
			try {
				const response = await fetch('/api/auth/verify-reset-token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ token }),
				});

				const data = await response.json();
				setTokenValid(data.valid);
			} catch (error) {
				setTokenValid(false);
			}
		};

		verifyToken();
	}, [token]);

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (passwordData.password !== passwordData.confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (passwordData.password.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return;
		}

		setLoading(true);
		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token,
					newPassword: passwordData.password,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('Password reset successfully!', {
					description: 'You can now sign in with your new password.',
				});
				setPasswordReset(true);
			} else {
				toast.error(data.error || 'Failed to reset password');
			}
		} catch (error) {
			toast.error('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const isFormValid = passwordData.password.trim() !== '' && passwordData.confirmPassword.trim() !== '';

	if (tokenValid === null) {
		return (
			<AuthLayout title="Verifying..." subtitle="Please wait while we verify your reset link">
				<div className="flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[#FFB900]" />
				</div>
			</AuthLayout>
		);
	}

	if (tokenValid === false) {
		return (
			<AuthLayout title="Invalid Reset Link" subtitle="This password reset link is invalid or has expired">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
							<XCircle className="w-8 h-8 text-red-500" />
						</div>
						<h3 className="text-xl font-semibold text-white">Invalid Reset Link</h3>
						<p className="text-white/80">
							This password reset link is invalid or has expired. Please request a new one.
						</p>
					</div>

					<div className="space-y-3">
						<Button
							onClick={() => router.push('/forgot-password')}
							className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
						>
							Request New Reset Link
						</Button>
						<Button
							type="button"
							variant="link"
							onClick={() => router.push('/login')}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							Back to Sign In
						</Button>
					</div>
				</div>
			</AuthLayout>
		);
	}

	if (passwordReset) {
		return (
			<AuthLayout title="Password Reset Success" subtitle="Your password has been reset successfully">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
							<CheckCircle className="w-8 h-8 text-green-500" />
						</div>
						<h3 className="text-xl font-semibold text-white">Password Reset Success</h3>
						<p className="text-white/80">
							Your password has been reset successfully. You can now sign in with your new password.
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

	// Reset password form
	return (
		<AuthLayout title="Reset Password" subtitle="Enter your new password">
			<div className="space-y-6">
				<form onSubmit={handleResetPassword} className="space-y-4">
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type={showPassword ? 'text' : 'password'}
							placeholder="New Password"
							value={passwordData.password}
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									password: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-gray-400 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10 pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>

					<div className="relative">
						<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder="Confirm New Password"
							value={passwordData.confirmPassword}
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									confirmPassword: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-gray-400 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10 pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
						>
							{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>

					<Button
						type="submit"
						className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B] disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading || !isFormValid}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Resetting Password...
							</>
						) : (
							'Reset Password'
						)}
					</Button>
				</form>
			</div>
		</AuthLayout>
	);
}

export default function ResetPasswordPageWithSuspense() {
	return (
		<Suspense>
			<ResetPasswordPage />
		</Suspense>
	);
}
