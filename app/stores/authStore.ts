import { toast } from 'sonner';
import { create } from 'zustand';
import { AuthResponse, User } from '../types';
import { API_ENDPOINTS, SUCCESS_MESSAGES } from '../utils/constants';

interface AuthState {
	// State
	user: User | null;
	loading: boolean;
	authChecked: boolean;
	initialized: boolean;

	// Actions
	checkAuth: (redirectOnFailure?: boolean) => Promise<boolean>;
	handleLogout: () => Promise<void>;
	forceRefreshAuth: () => void;
	setUser: (user: User | null) => void;
	clearAuthState: () => void;
	initializeAuth: () => void;
}

// Mark auth as checked
const markAuthChecked = () => {
	localStorage.setItem('auth_checked', 'true');
};

export const useAuthStore = create<AuthState>((set, get) => ({
	// Initial state
	user: null,
	loading: false,
	authChecked: false,
	initialized: false,

	// Clear auth state
	clearAuthState: () => {
		localStorage.removeItem('auth_checked');
		set({ user: null, authChecked: false, loading: false, initialized: false });
	},

	// Set user
	setUser: (user: User | null) => {
		if (user) {
			// If setting a user (login), clear the auth cache and update state
			localStorage.removeItem('auth_checked');
			set({ user, authChecked: true, loading: false, initialized: true });
		} else {
			// If clearing user (logout), just update state
			set({ user });
		}
	},

	// Initialize auth (called once on app start)
	initializeAuth: () => {
		const state = get();

		// Prevent multiple initializations
		if (state.initialized) {
			return;
		}

		set({ initialized: true });

		// Always check auth on initialization, regardless of localStorage
		// This ensures we have the current user state
		if (typeof window !== 'undefined') {
			get().checkAuth(false); // Don't redirect on failure during initialization
		}
	},

	checkAuth: async (redirectOnFailure = true) => {
		set({ loading: true });

		try {
			const response = await fetch(API_ENDPOINTS.auth.check);
			const data: AuthResponse = await response.json();

			if (data.authenticated && data.user) {
				set({ user: data.user, authChecked: true, loading: false });
				markAuthChecked();
				return true;
			} else {
				set({ user: null, authChecked: true, loading: false });
				markAuthChecked();
				return false;
			}
		} catch (error) {
			set({ user: null, authChecked: true, loading: false });
			markAuthChecked();
			return false;
		}
	},

	handleLogout: async () => {
		try {
			const response = await fetch(API_ENDPOINTS.auth.logout, {
				method: 'POST',
			});

			if (response.ok) {
				get().clearAuthState();
				toast.success(SUCCESS_MESSAGES.logout);
				window.location.reload();
			} else {
				toast.error('Logout failed');
			}
		} catch (error) {
			toast.error('Logout failed');
		}
	},

	forceRefreshAuth: () => {
		get().clearAuthState();
		get().checkAuth();
	},
}));
