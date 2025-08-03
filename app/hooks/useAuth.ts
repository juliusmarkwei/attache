import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthResponse, User } from '../types';
import { API_ENDPOINTS, SUCCESS_MESSAGES } from '../utils/constants';

export function useAuth() {
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [authChecked, setAuthChecked] = useState(false);
	const router = useRouter();

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
		loading,
		user,
		setUser,
		authChecked,
		checkAuth,
		handleLogout,
	};
}
