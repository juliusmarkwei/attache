// Auth types
export type AuthStep = 'register' | 'login' | 'otp';

export interface RegisterData {
	name: string;
	email: string;
}

export interface AuthResponse {
	success?: boolean;
	authenticated?: boolean;
	userId?: string;
	sessionToken?: string;
	user?: User;
	message?: string;
	error?: string;
}

// User types
export interface User {
	id: string;
	name: string;
	email: string;
	createdAt?: number;
	updatedAt?: number;
}

// Company types
export interface Company {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	location?: string;
	country?: string;
	createdAt?: number;
	updatedAt?: number;
	ownerId?: string;
	lastEmailReceived?: number;
}

// Document types
export interface Document {
	_id: string;
	companyId: string;
	filename: string;
	originalName: string;
	contentType: string;
	size: number;
	storageId: string;
	uploadedAt: number;
	uploadedBy?: string;
	metadata?: any;
	company?: Company;
}

// Component prop types
export interface DocumentListProps {
	companyId?: string;
}

export interface AuthLayoutProps {
	title: string;
	subtitle: string;
	children: React.ReactNode;
}

export interface OtpInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
}

// API Response types
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// File upload types
export interface FileUploadData {
	storageId: string;
	filename: string;
	contentType: string;
	size: number;
}

// Gmail webhook types
export interface GmailWebhookPayload {
	historyId: string;
}

export interface GmailMessage {
	id: string;
	payload?: {
		headers?: Array<{
			name: string;
			value: string;
		}>;
		parts?: Array<{
			filename?: string;
			mimeType?: string;
			body?: {
				attachmentId?: string;
			};
			messageId?: string;
		}>;
	};
}
