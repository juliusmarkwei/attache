import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthResponse, AuthStep, RegisterData, User } from '../types';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

export function useAuth() {
	const [step, setStep] = useState<AuthStep>('register');
	const [registerData, setRegisterData] = useState<RegisterData>({
		name: '',
		email: '',
	});
	const [loginEmail, setLoginEmail] = useState('');
	const [otp, setOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [authChecked, setAuthChecked] = useState(false);
	const router = useRouter();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch(API_ENDPOINTS.auth.register, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(registerData),
			});

			const data: AuthResponse = await response.json();

			if (response.ok) {
				toast.success(SUCCESS_MESSAGES.registration);
				setLoginEmail(registerData.email);
				setStep('otp');
			} else {
				toast.error(data.error || 'Registration failed');
			}
		} catch (error) {
			console.error('Registration error:', error);
			toast.error(ERROR_MESSAGES.network);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch(API_ENDPOINTS.auth.login, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: loginEmail }),
			});

			const data: AuthResponse = await response.json();

			if (response.ok) {
				toast.success(data.message || SUCCESS_MESSAGES.login);
				setStep('otp');
			} else {
				toast.error(data.error || 'Failed to send OTP');
			}
		} catch (error) {
			console.error('Login error:', error);
			toast.error(ERROR_MESSAGES.network);
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const response = await fetch(API_ENDPOINTS.auth.verify, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: loginEmail, otp }),
			});

			const data: AuthResponse = await response.json();

			if (response.ok) {
				toast.success(SUCCESS_MESSAGES.verification);

				// Update local user state if user data is provided
				if (data.user) {
					setUser(data.user);
				}

				// Add a small delay to ensure the cookie is set before redirecting
				setTimeout(() => {
					router.push('/dashboard');
				}, 100);
			} else {
				toast.error(data.error || 'OTP verification failed');
			}
		} catch (error) {
			console.error('OTP verification error:', error);
			toast.error(ERROR_MESSAGES.network);
		} finally {
			setLoading(false);
		}
	};

	const checkAuth = async (redirectOnFailure = true) => {
		try {
			console.log('🔍 Checking authentication...');
			const response = await fetch(API_ENDPOINTS.auth.check);
			const data: AuthResponse = await response.json();

			console.log('🔍 Auth check response:', data);

			if (data.authenticated && data.user) {
				console.log('✅ User authenticated:', data.user.id);
				setUser(data.user);
				setAuthChecked(true);
				return true;
			} else {
				console.log('❌ Not authenticated' + (redirectOnFailure ? ', redirecting to login' : ''));
				setAuthChecked(true);
				if (redirectOnFailure) {
					window.location.href = '/login';
				}
				return false;
			}
		} catch (error) {
			console.error('❌ Auth check failed:', error);
			setAuthChecked(true);
			if (redirectOnFailure) {
				window.location.href = '/login';
			}
			return false;
		}
	};

	const handleLogout = async () => {
		try {
			const response = await fetch(API_ENDPOINTS.auth.logout, {
				method: 'POST',
			});

			if (response.ok) {
				toast.success(SUCCESS_MESSAGES.logout);
				window.location.href = '/login';
			} else {
				toast.error('Logout failed');
			}
		} catch (error) {
			toast.error('Logout failed');
		}
	};

	return {
		step,
		setStep,
		registerData,
		setRegisterData,
		loginEmail,
		setLoginEmail,
		otp,
		setOtp,
		loading,
		user,
		setUser,
		authChecked,
		handleRegister,
		handleLogin,
		handleOtpSubmit,
		checkAuth,
		handleLogout,
	};
}
