import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { NotificationService } from '../../../services/notificationService';

const gmail = google.gmail('v1');

const auth = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI,
);

function validateEnvironment() {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
	}
}

export async function POST(request: NextRequest) {
	try {
		validateEnvironment();

		const body = await request.json();

		if (body.message && body.message.data) {
			try {
				const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
				const gmailData = JSON.parse(decodedData);

				if (gmailData.historyId) {
					await processGmailHistory(gmailData.historyId);
				}
			} catch (error) {
				// Handle error silently
				console.error('❌ Error processing Gmail webhook:', error);
			}
		} else if (body.historyId) {
			await processGmailHistory(body.historyId);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

const processedMessages = new Set<string>();
const processedAttachments = new Set<string>();

function cleanupProcessedMessages() {
	if (processedMessages.size > 1000) {
		const messagesArray = Array.from(processedMessages);
		const toRemove = messagesArray.slice(0, 500);
		toRemove.forEach((id) => processedMessages.delete(id));
	}

	if (processedAttachments.size > 1000) {
		const attachmentsArray = Array.from(processedAttachments);
		const toRemove = attachmentsArray.slice(0, 500);
		toRemove.forEach((id) => processedAttachments.delete(id));
	}
}

function hasAttachments(message: any): boolean {
	const parts = message.payload?.parts || [];

	// Check main parts for attachments
	for (const part of parts) {
		if (part.filename && part.body?.attachmentId) {
			return true;
		}

		// Check nested parts for attachments
		if (part.parts) {
			for (const subPart of part.parts) {
				if (subPart.filename && subPart.body?.attachmentId) {
					return true;
				}
			}
		}
	}

	// Check if the message itself is an attachment (multipart/mixed or similar)
	if (message.payload?.filename && message.payload?.body?.attachmentId) {
		return true;
	}

	return false;
}

async function processGmailHistory(historyId: string) {
	try {
		let activeIntegrations: any[] = [];
		let retryCount = 0;
		const maxRetries = 3;

		while (retryCount < maxRetries) {
			try {
				const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				activeIntegrations = await convexClient.query(api.gmail.getActiveGmailIntegrations);
				break;
			} catch (error) {
				retryCount++;

				if (retryCount >= maxRetries) {
					return;
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
			}
		}

		// Process each active integration
		for (const integration of activeIntegrations) {
			try {
				auth.setCredentials({
					access_token: integration.accessToken,
					refresh_token: integration.refreshToken,
				});

				try {
					await gmail.users.getProfile({ auth: auth, userId: 'me' });
				} catch (tokenError) {
					console.log(`🔄 Token expired for integration ${integration._id}, attempting refresh...`);
					if (integration.refreshToken) {
						try {
							const { credentials } = await auth.refreshAccessToken();

							// Update the auth object with new credentials
							auth.setCredentials({
								access_token: credentials.access_token!,
								refresh_token: credentials.refresh_token || integration.refreshToken,
								expiry_date: credentials.expiry_date || Date.now() + 3600000,
							});

							const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
							await convexClient.mutation(api.gmail.updateGmailIntegration, {
								integrationId: integration._id,
								accessToken: credentials.access_token!,
								refreshToken: credentials.refresh_token || integration.refreshToken,
								expiryDate: credentials.expiry_date || Date.now() + 3600000,
							});

							console.log(`✅ Token refreshed successfully for integration ${integration._id}`);
						} catch (refreshError) {
							console.error(
								`❌ Failed to refresh token for integration ${integration._id}:`,
								refreshError,
							);
							continue;
						}
					} else {
						console.log(`❌ No refresh token available for integration ${integration._id}`);
						continue;
					}
				}

				console.log(
					`📧 Fetching Gmail history for integration ${integration._id} with historyId: ${historyId}`,
				);

				const historyResponse = await gmail.users.history.list({
					auth: auth,
					userId: 'me',
					startHistoryId: historyId,
					maxResults: 100,
				});

				const history = historyResponse.data.history;
				if (!history || history.length === 0) {
					try {
						const messagesResponse = await gmail.users.messages.list({
							auth: auth,
							userId: 'me',
							maxResults: 10,
							q: 'is:unread',
						});

						const messages = messagesResponse.data.messages;
						if (messages && messages.length > 0) {
							for (const message of messages) {
								if (message.id) {
									await processEmail(message.id, integration.userId);
								}
							}
						}
					} catch (fallbackError) {
						// Handle error silently
						console.error('❌ Error processing Gmail history for integration:', fallbackError);
					}
					return;
				}

				for (const change of history) {
					if (change.messagesAdded) {
						for (const messageAdded of change.messagesAdded) {
							if (messageAdded.message?.id) {
								await processEmail(messageAdded.message.id, integration.userId);
							}
						}
					}
				}
			} catch (error) {
				console.error('❌ Error processing Gmail history for integration:', error);
			}
		}
	} catch (error) {
		console.error('❌ Error processing Gmail history:', error);
	}
}

async function processEmail(messageId: string, userId?: string) {
	if (processedMessages.has(messageId)) {
		console.log(`🔄 Skipping already processed message: ${messageId}`);
		return;
	}

	// Mark message as processed immediately to prevent duplicates
	processedMessages.add(messageId);

	try {
		console.log(`📧 Processing email: ${messageId} for user: ${userId || 'unknown'}`);

		// Get the email message
		const messageResponse = await gmail.users.messages.get({
			auth: auth,
			userId: 'me',
			id: messageId,
		});

		const message = messageResponse.data;
		const headers = message.payload?.headers;

		if (!headers) {
			console.log('⚠️ No headers found in email message');
			return;
		}

		// Check if email has attachments BEFORE processing
		if (!hasAttachments(message)) {
			console.log(`📧 Skipping email ${messageId} - no attachments found (no company will be created)`);
			return;
		}

		console.log(`📎 Email ${messageId} has attachments - processing company and documents...`);

		// Extract email subject and sender
		const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
		const from = headers.find((h: any) => h.name === 'From')?.value || '';
		const date = headers.find((h: any) => h.name === 'Date')?.value || '';

		console.log(`📧 Email details - Subject: "${subject}", From: "${from}"`);

		// Extract clean email address from "Name <email@domain.com>" format
		const cleanEmail = extractEmailFromString(from);

		let companyName = extractCompanyFromSubject(subject);

		if (!companyName) {
			companyName = extractCompanyFromEmail(from);
		}

		if (!companyName) {
			console.log('⚠️ Could not extract company name from email');
			return;
		}

		console.log(`🏢 Extracted company: ${companyName} from email: ${cleanEmail}`);

		// Initialize Convex client
		const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

		// Find or create company
		let company = await convexClient.query(api.companies.getCompanyByEmail, {
			email: cleanEmail,
		});

		if (!company) {
			const companyId = await convexClient.mutation(api.companies.createCompany, {
				name: companyName,
				email: cleanEmail,
				ownerId: userId as any,
				metadata: {
					source: 'gmail',
					firstEmailSubject: subject,
					firstEmailDate: date,
				},
			});
			company = await convexClient.query(api.companies.getCompanyById, {
				companyId,
			});
		} else {
			await convexClient.mutation(api.companies.updateCompany, {
				companyId: company._id,
			});
		}

		if (!company) {
			return;
		}

		// Process attachments (email has attachments, so we know this will work)
		await processAttachments(message, company._id, cleanEmail, userId);

		// Only send notification for emails with attachments
		if (userId) {
			try {
				await NotificationService.addEmailNotification(userId, subject, company.name);
			} catch (error) {
				// Handle error silently
			}
		}

		cleanupProcessedMessages();
		console.log(`✅ Successfully processed email ${messageId} with attachments`);
	} catch (error) {
		console.error(`❌ Error processing email ${messageId}:`, error);
	}
}

function extractEmailFromString(emailString: string): string {
	// Extract email from "Name <email@domain.com>" format
	const emailMatch = emailString.match(/<(.+?)>/);
	if (emailMatch && emailMatch[1]) {
		return emailMatch[1].trim();
	}

	// If no angle brackets, return the original string (might already be clean)
	return emailString.trim();
}

function extractCompanyFromEmail(emailString: string): string | null {
	// Extract company name from "Company Name <email@domain.com>" format
	const nameMatch = emailString.match(/^(.+?)\s*</);
	if (nameMatch && nameMatch[1]) {
		const name = nameMatch[1].trim();
		// Filter out common words that aren't company names
		const commonWords = [
			'the',
			'and',
			'or',
			'but',
			'in',
			'on',
			'at',
			'to',
			'for',
			'of',
			'with',
			'by',
			'no-reply',
			'team',
			'support',
			'noreply',
		];
		const words = name.split(' ').filter((word) => word.length > 2 && !commonWords.includes(word.toLowerCase()));

		if (words.length > 0) {
			return words.join(' ');
		}
	}

	// Try to extract from domain name
	const domainMatch = emailString.match(/@([^.]+)\./);
	if (domainMatch && domainMatch[1]) {
		const domain = domainMatch[1];
		// Convert domain to title case for company name
		return domain.charAt(0).toUpperCase() + domain.slice(1);
	}

	return null;
}

function extractCompanyFromSubject(subject: string): string | null {
	// Enhanced pattern matching for company extraction
	const patterns = [
		// Invoice/Document patterns
		/(?:Invoice|Document|Contract|Report|Statement|Receipt)\s*[-:]\s*([A-Za-z0-9\s&.,]+)/i,
		/(?:for|to|from)\s+([A-Za-z0-9\s&.,]+)/i,
		/([A-Za-z0-9\s&.,]+)\s+(?:Invoice|Document|Contract|Report|Statement|Receipt)/i,

		// Email subject patterns
		/(?:Re|Fwd|Fw):\s*([A-Za-z0-9\s&.,]+)/i,

		// Generic company patterns
		/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
	];

	for (const pattern of patterns) {
		const match = subject.match(pattern);
		if (match && match[1]) {
			const company = match[1].trim();
			// Filter out common words that aren't company names
			const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
			const words = company
				.split(' ')
				.filter((word) => word.length > 2 && !commonWords.includes(word.toLowerCase()));

			if (words.length > 0) {
				return words.join(' ');
			}
		}
	}

	// Fallback: extract first capitalized word sequence
	const capitalizedMatch = subject.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
	if (capitalizedMatch) {
		return capitalizedMatch[1].trim();
	}

	return null;
}

async function processAttachments(message: any, companyId: string, uploadedBy: string, userId?: string) {
	try {
		const parts = message.payload?.parts || [];
		let attachmentCount = 0;

		console.log(`📎 Processing attachments for message ${message.id}`);

		for (const part of parts) {
			if (part.filename && part.body?.attachmentId) {
				await processAttachment(part, companyId, uploadedBy, message.id, userId);
				attachmentCount++;
			}

			// Recursively process nested parts
			if (part.parts) {
				for (const subPart of part.parts) {
					if (subPart.filename && subPart.body?.attachmentId) {
						await processAttachment(subPart, companyId, uploadedBy, message.id, userId);
						attachmentCount++;
					}
				}
			}
		}

		console.log(`✅ Processed ${attachmentCount} attachments for message ${message.id}`);
	} catch (error) {
		console.error(`❌ Error processing attachments for message ${message.id}:`, error);
	}
}

async function processAttachment(part: any, companyId: string, uploadedBy: string, messageId: string, userId?: string) {
	// Create unique identifier for this attachment
	const attachmentId = `${messageId}_${part.body.attachmentId}`;

	if (processedAttachments.has(attachmentId)) {
		console.log(`🔄 Skipping already processed attachment: ${part.filename} (${attachmentId})`);
		return;
	}

	try {
		console.log(`📎 Processing attachment: ${part.filename} (${part.mimeType})`);

		// Check file size (limit to 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (part.body?.size && part.body.size > maxSize) {
			console.log(`⚠️ Skipping large file: ${part.filename} (${part.body.size} bytes)`);
			return;
		}

		// Check file type (only allow common document types)
		const allowedTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/bmp',
			'image/tiff',
		];

		if (!allowedTypes.includes(part.mimeType)) {
			console.log(`⚠️ Skipping unsupported file type: ${part.filename} (${part.mimeType})`);
			return;
		}

		const attachmentResponse = await gmail.users.messages.attachments.get({
			auth: auth,
			userId: 'me',
			messageId: messageId,
			id: part.body.attachmentId,
		});

		const attachmentData = attachmentResponse.data.data;
		if (!attachmentData) {
			console.log(`⚠️ No attachment data found for: ${part.filename}`);
			return;
		}

		const buffer = Buffer.from(attachmentData, 'base64');
		console.log(`📎 Downloaded attachment: ${part.filename} (${buffer.length} bytes)`);

		const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

		const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl);

		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				'Content-Type': part.mimeType || 'application/octet-stream',
			},
			body: buffer,
		});

		if (!uploadResponse.ok) {
			throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
		}

		const { storageId } = await uploadResponse.json();

		await convexClient.mutation(api.documents.addDocumentToCompany, {
			companyId: companyId as any,
			filename: part.filename,
			originalName: part.filename,
			contentType: part.mimeType || 'application/octet-stream',
			size: buffer.length,
			storageId,
			uploadedBy,
			metadata: {
				source: 'gmail',
				messageId: part.messageId,
				processedAt: new Date().toISOString(),
			},
		});

		if (userId) {
			try {
				const company = await convexClient.query(api.companies.getCompanyById, {
					companyId: companyId as any,
				});

				if (company) {
					await NotificationService.addDocumentNotification(userId, part.filename, company.name);
				}
			} catch (error) {
				// Handle error silently
			}
		}

		// Mark this attachment as processed
		processedAttachments.add(attachmentId);
		cleanupProcessedMessages();
		console.log(`✅ Successfully processed attachment: ${part.filename}`);
	} catch (error) {
		console.error(`❌ Error processing attachment ${part.filename}:`, error);
	}
}
