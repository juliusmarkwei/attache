// App configuration
export const APP_CONFIG = {
	name: 'Attache',
	description: 'Document Management Platform',
	version: '1.0.0',
} as const;

// API endpoints
export const API_ENDPOINTS = {
	auth: {
		register: '/api/auth/register',
		login: '/api/auth/otp',
		verify: '/api/auth/verify',
		check: '/api/auth/check',
		logout: '/api/auth/logout',
	},
	documents: {
		download: '/api/documents/download',
		delete: '/api/documents/delete',
	},
	gmail: {
		webhook: '/api/gmail/webhook',
	},
} as const;

// Form validation
export const VALIDATION = {
	email: {
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		message: 'Please enter a valid email address',
	},
	phone: {
		pattern: /^[\+]?[1-9][\d]{0,15}$/,
		message: 'Please enter a valid phone number',
	},
	otp: {
		length: 6,
		pattern: /^\d{6}$/,
		message: 'Please enter a 6-digit code',
	},
} as const;

// File upload
export const FILE_CONFIG = {
	maxSize: 10 * 1024 * 1024, // 10MB
	allowedTypes: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'image/jpeg',
		'image/png',
		'image/gif',
		'text/plain',
	],
} as const;

// UI constants
export const UI = {
	colors: {
		primary: '#FFB900',
		secondary: '#876F53',
		dark: '#47333B',
		success: '#10B981',
		error: '#EF4444',
		warning: '#F59E0B',
		info: '#3B82F6',
	},
	breakpoints: {
		sm: '640px',
		md: '768px',
		lg: '1024px',
		xl: '1280px',
		'2xl': '1536px',
	},
} as const;

// Session configuration
export const SESSION_CONFIG = {
	expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
	otpExpiresIn: 10 * 60 * 1000, // 10 minutes
} as const;

// Error messages
export const ERROR_MESSAGES = {
	network: 'Network error. Please check your connection.',
	unauthorized: 'You are not authorized to access this resource.',
	notFound: 'The requested resource was not found.',
	serverError: 'Internal server error. Please try again later.',
	validation: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
	registration: 'Company registered successfully! Please check your email for OTP.',
	login: 'OTP sent to your email!',
	verification: 'OTP verified successfully! Redirecting...',
	logout: 'Logged out successfully',
	download: 'Download started',
	delete: 'Document deleted successfully',
} as const;
