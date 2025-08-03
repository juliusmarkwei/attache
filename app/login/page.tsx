'use client';

import { Loader2, Mail, User } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { OtpInput } from '../components/ui/otp-input';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
	const {
		step,
		setStep,
		registerData,
		setRegisterData,
		loginEmail,
		setLoginEmail,
		otp,
		setOtp,
		loading,
		handleRegister,
		handleLogin,
		handleOtpSubmit,
	} = useAuth();

	const getTitleAndSubtitle = () => {
		switch (step) {
			case 'register':
				return {
					title: 'Sign Up',
					subtitle: 'Create your account to manage companies and documents',
				};
			case 'login':
				return {
					title: 'Sign In',
					subtitle: 'Welcome back! Please sign in to your account',
				};
			case 'otp':
				return {
					title: 'Verify OTP',
					subtitle: 'Enter the 6-digit code sent to your email',
				};
			default:
				return {
					title: 'Sign Up',
					subtitle: 'Create your account to manage companies and documents',
				};
		}
	};

	const { title, subtitle } = getTitleAndSubtitle();

	return (
		<AuthLayout title={title} subtitle={subtitle}>
			<div className="space-y-6">
				{step === 'register' && (
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

						<Button
							type="submit"
							className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
							disabled={loading}
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
								onClick={() => setStep('login')}
								className="text-[#FFB900] hover:text-[#FFB900]/80"
							>
								Already have an account? Sign in
							</Button>
						</div>
					</form>
				)}

				{step === 'login' && (
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
							<Input
								type="email"
								placeholder="Email Address"
								value={loginEmail}
								onChange={(e) => setLoginEmail(e.target.value)}
								required
								className="h-12 rounded-lg border-[#876F53] bg-white/10 text-white placeholder-white/40 focus:border-[#FFB900] focus:ring-[#FFB900] pl-10"
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending OTP...
								</>
							) : (
								'Send OTP'
							)}
						</Button>

						<div className="text-center">
							<Button
								type="button"
								variant="link"
								onClick={() => setStep('register')}
								className="text-[#FFB900] hover:text-[#FFB900]/80"
							>
								Don't have an account? Register
							</Button>
						</div>
					</form>
				)}

				{step === 'otp' && (
					<form onSubmit={handleOtpSubmit} className="space-y-4">
						<div className="text-center">
							<div className="flex items-center justify-center gap-2 mb-4">
								<div className="w-8 h-8 bg-[#FFB900] rounded-full flex items-center justify-center">
									<Mail className="w-4 h-4 text-[#47333B]" />
								</div>
								<span className="text-white font-medium">Enter 6-digit OTP</span>
							</div>
							<OtpInput value={otp} onChange={setOtp} />
							<p className="text-sm text-white/80 text-center mt-2">
								Enter the 6-digit code sent to <span className="font-medium">{loginEmail}</span>
							</p>
						</div>

						<Button
							type="submit"
							className="w-full bg-[#FFB900] hover:bg-[#FFB900]/90 h-12 rounded-lg font-semibold text-[#47333B]"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								'Verify OTP'
							)}
						</Button>

						<div className="text-center">
							<Button
								type="button"
								variant="outline"
								className="w-full h-12 rounded-lg border-[#876F53] hover:bg-white/10 text-white"
								onClick={() => setStep('login')}
							>
								Back to login
							</Button>
						</div>
					</form>
				)}
			</div>
		</AuthLayout>
	);
}
