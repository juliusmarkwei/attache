'use client';

import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function SignupPage() {
	const [registerData, setRegisterData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const router = useRouter();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate passwords match
		if (registerData.password !== registerData.confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		// Validate password strength
		if (registerData.password.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return;
		}

		setLoading(true);
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: registerData.name,
					email: registerData.email,
					password: registerData.password,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('Account created successfully!', {
					description: 'Please check your email to verify your account.',
				});
				setEmailSent(true);
			} else {
				toast.error(data.error || 'Registration failed');
			}
		} catch (error) {
			console.error('Registration error:', error);
			toast.error('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const isFormValid =
		registerData.name.trim() !== '' &&
		registerData.email.trim() !== '' &&
		registerData.password.trim() !== '' &&
		registerData.confirmPassword.trim() !== '';

	if (emailSent) {
		return (
			<AuthLayout title="Check Your Email" subtitle="We've sent you a verification link">
				<div className="space-y-6 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-[#FFB900]/20 rounded-full flex items-center justify-center mx-auto">
							<Mail className="w-8 h-8 text-[#FFB900]" />
						</div>
						<h3 className="text-xl font-semibold text-white">Check your email</h3>
						<p className="text-white/80">
							We've sent a verification link to <strong>{registerData.email}</strong>
						</p>
						<p className="text-sm text-white/60">
							Click the link in your email to verify your account and start using Attache.
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
								setRegisterData({
									name: '',
									email: '',
									password: '',
									confirmPassword: '',
								});
							}}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							Create another account
						</Button>
					</div>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title="Sign Up" subtitle="Create your account to manage companies and documents">
			<div className="space-y-6">
				<form onSubmit={handleRegister} className="space-y-4">
					<div className="relative">
						<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type="text"
							placeholder="Name"
							value={registerData.name}
							onChange={(e) =>
								setRegisterData({
									...registerData,
									name: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-white/40 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10"
						/>
					</div>

					<div className="relative">
						<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type="email"
							placeholder="Email Address"
							value={registerData.email}
							onChange={(e) =>
								setRegisterData({
									...registerData,
									email: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-white/40 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10"
						/>
					</div>

					<div className="relative">
						<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							value={registerData.password}
							onChange={(e) =>
								setRegisterData({
									...registerData,
									password: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-white/40 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10 pr-10"
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
							placeholder="Confirm Password"
							value={registerData.confirmPassword}
							onChange={(e) =>
								setRegisterData({
									...registerData,
									confirmPassword: e.target.value,
								})
							}
							required
							className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-white/40 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10 pr-10"
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
								Creating Account...
							</>
						) : (
							'Sign up'
						)}
					</Button>

					<div className="text-center">
						<Button
							type="button"
							variant="link"
							onClick={() => router.push('/login')}
							className="text-[#FFB900] hover:text-[#FFB900]/80"
						>
							Already have an account? Sign in
						</Button>
					</div>
				</form>
			</div>
		</AuthLayout>
	);
}
