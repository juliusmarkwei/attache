'use client';

import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const router = useRouter();

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('Email sent successfully!', {
					description: 'Check your email for password reset instructions.',
				});
				setEmailSent(true);
			} else {
				toast.error(data.error || 'Failed to send reset email');
			}
		} catch (error) {
			toast.error('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const isFormValid = email.trim() !== '';

	if (emailSent) {
		return (
			<AuthLayout title="Check Your Email" subtitle="We've sent you a password reset link">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-[#FFB900]/20 rounded-full flex items-center justify-center mx-auto">
							<Mail className="w-8 h-8 text-[#FFB900]" />
						</div>
						<h3 className="text-xl font-semibold text-white">Check your email</h3>
						<p className="text-white/80">
							We&apos;ve sent a password reset link to <strong>{email}</strong>
						</p>
						<p className="text-sm text-white/60">
							The link will expire in 30 minutes. If you don&apos;t see the email, check your spam folder.
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
							onClick={() => {
								setEmailSent(false);
								setEmail('');
							}}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							Send another email
						</Button>
					</div>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
			<div className="space-y-6">
				<form onSubmit={handleForgotPassword} className="space-y-4">
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type="email"
							placeholder="Email Address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-gray-300 placeholder-gray-400 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10"
						/>
					</div>

					<Button
						type="submit"
						className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B] disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading || !isFormValid}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending Email...
							</>
						) : (
							'Send Reset Link'
						)}
					</Button>

					<div className="text-center">
						<Button
							type="button"
							variant="link"
							onClick={() => router.push('/login')}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Sign In
						</Button>
					</div>
				</form>
			</div>
		</AuthLayout>
	);
}
