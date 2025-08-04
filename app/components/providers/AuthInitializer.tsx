'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';

export function AuthInitializer() {
	const { initializeAuth } = useAuthStore();
	const initialized = useRef(false);

	useEffect(() => {
		// Initialize auth only once when the component mounts
		if (!initialized.current) {
			initialized.current = true;
			initializeAuth();
		}
	}, []); // Remove initializeAuth from dependencies to prevent re-runs

	return null;
}
