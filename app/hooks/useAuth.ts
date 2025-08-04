import { useAuthStore } from '../stores/authStore';

export function useAuth() {
	const { user, loading, authChecked, checkAuth, handleLogout, forceRefreshAuth, setUser, initializeAuth } =
		useAuthStore();

	return {
		user,
		loading,
		authChecked,
		checkAuth,
		handleLogout,
		forceRefreshAuth,
		setUser,
		initializeAuth,
	};
}
