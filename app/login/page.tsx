'use client';

import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
	const [loginData, setLoginData] = useState({
		email: '',
		password: '',
	});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();
	const { setUser } = useAuth();

	// Debug redirect parameter
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const redirectUrl = urlParams.get('redirect');
		console.log('🔍 Login page loaded with redirect URL:', redirectUrl);
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(loginData),
			});

			const data = await response.json();

			if (response.ok) {
				// Update the auth store with the user data
				setUser(data.user);

				toast.success('Login successful!', {
					description: 'Welcome back to Attache.',
				});

				// Check if there's a redirect URL
				const urlParams = new URLSearchParams(window.location.search);
				const redirectUrl = urlParams.get('redirect');

				// Redirect to the specified URL or dashboard
				if (redirectUrl) {
					router.push(redirectUrl);
				} else {
					router.push('/dashboard');
				}
			} else {
				toast.error(data.error || 'Login failed');
			}
		} catch (error) {
			toast.error('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const isFormValid = loginData.email.trim() !== '' && loginData.password.trim() !== '';

	return (
		<AuthLayout title="Sign In" subtitle="Welcome back! Please sign in to your account">
			<div className="space-y-6">
				<form onSubmit={handleLogin} className="space-y-4">
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
						<Input
							type="email"
							placeholder="Email Address"
							value={loginData.email}
							onChange={(e) =>
								setLoginData({
									...loginData,
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
							value={loginData.password}
							onChange={(e) =>
								setLoginData({
									...loginData,
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

					<Button
						type="submit"
						className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B] disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading || !isFormValid}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Signing In...
							</>
						) : (
							'Sign In'
						)}
					</Button>

					<div className="text-center space-y-2">
						<Button
							type="button"
							variant="link"
							onClick={() => router.push('/forgot-password')}
							className="text-[#FFB900] hover:text-[#FFB900]/80 text-sm"
						>
							Forgot your password?
						</Button>
						<div>
							<Button
								type="button"
								variant="link"
								onClick={() => router.push('/signup')}
								className="text-[#FFB900] hover:text-[#FFB900]/80"
							>
								Don't have an account? Sign up
							</Button>
						</div>
					</div>
				</form>
			</div>
		</AuthLayout>
	);
}
