import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { NotificationService } from '../../../services/notificationService';

// Gmail API setup
const gmail = google.gmail('v1');

// Initialize Gmail API with OAuth2 credentials
const auth = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI,
);

// Validate environment variables
function validateEnvironment() {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
	}
}

export async function POST(request: NextRequest) {
	try {
		// Validate environment
		validateEnvironment();

		const body = await request.json();
		console.log('📧 Gmail webhook received:', JSON.stringify(body, null, 2));

		// Handle Gmail push notification from Pub/Sub
		if (body.message && body.message.data) {
			try {
				// Decode the base64 data from Pub/Sub
				const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
				const gmailData = JSON.parse(decodedData);

				console.log('📧 Decoded Gmail data:', gmailData);

				if (gmailData.historyId) {
					console.log(`🔄 Processing Gmail history: ${gmailData.historyId}`);
					await processGmailHistory(gmailData.historyId);
				} else {
					console.log('⚠️ No historyId found in decoded Gmail data');
				}
			} catch (error) {
				console.error('❌ Error decoding Pub/Sub message:', error);
			}
		} else if (body.historyId) {
			// Fallback for direct webhook (not through Pub/Sub)
			console.log(`🔄 Processing Gmail history: ${body.historyId}`);
			await processGmailHistory(body.historyId);
		} else {
			console.log('⚠️ No valid Gmail data found in webhook payload');
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('❌ Gmail webhook error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

// Track processed messages to avoid duplicates
const processedMessages = new Set<string>();

// Clean up old processed messages (keep only last 1000)
function cleanupProcessedMessages() {
	if (processedMessages.size > 1000) {
		const messagesArray = Array.from(processedMessages);
		const toRemove = messagesArray.slice(0, 500); // Remove oldest 500
		toRemove.forEach((id) => processedMessages.delete(id));
		console.log(`🧹 Cleaned up ${toRemove.length} old processed messages`);
	}
}

async function processGmailHistory(historyId: string) {
	try {
		// Get active Gmail integrations from database with retry logic
		let activeIntegrations: any[] = [];
		let retryCount = 0;
		const maxRetries = 3;

		while (retryCount < maxRetries) {
			try {
				const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
				activeIntegrations = await convexClient.query(api.gmail.getActiveGmailIntegrations);
				break; // Success, exit retry loop
			} catch (error) {
				retryCount++;
				console.log(`🔄 Convex connection attempt ${retryCount}/${maxRetries} failed:`, error);

				if (retryCount >= maxRetries) {
					console.error('❌ Failed to connect to Convex after all retries');
					return;
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
			}
		}

		// Process each active integration
		for (const integration of activeIntegrations) {
			try {
				// Set credentials for this integration
				auth.setCredentials({
					access_token: integration.accessToken,
					refresh_token: integration.refreshToken,
				});

				// Test if the access token is still valid
				try {
					await gmail.users.getProfile({ auth: auth, userId: 'me' });
				} catch (tokenError) {
					console.log('🔄 Access token expired, refreshing...');

					if (integration.refreshToken) {
						try {
							const { credentials } = await auth.refreshAccessToken();
							console.log('✅ Successfully refreshed access token');

							// Update the stored tokens in the database
							const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
							await convexClient.mutation(api.gmail.updateGmailIntegration, {
								integrationId: integration._id,
								accessToken: credentials.access_token!,
								refreshToken: credentials.refresh_token || integration.refreshToken,
								expiryDate: credentials.expiry_date || Date.now() + 3600000,
							});
						} catch (refreshError) {
							console.error('❌ Failed to refresh token:', refreshError);
							continue; // Skip this integration if refresh fails
						}
					} else {
						console.error('❌ No refresh token available');
						continue; // Skip this integration
					}
				}

				// Get Gmail history for this integration
				console.log(`🔍 Fetching Gmail history starting from: ${historyId}`);

				const historyResponse = await gmail.users.history.list({
					auth: auth,
					userId: 'me',
					startHistoryId: historyId,
					maxResults: 100, // Get more results
				});

				const history = historyResponse.data.history;
				if (!history || history.length === 0) {
					console.log('📭 No history found for historyId:', historyId);
					console.log('📊 History response:', {
						historyId,
						nextPageToken: historyResponse.data.nextPageToken,
					});

					// Fallback: Get recent messages instead
					console.log('🔄 Trying to get recent messages as fallback...');
					try {
						const messagesResponse = await gmail.users.messages.list({
							auth: auth,
							userId: 'me',
							maxResults: 10,
							q: 'is:unread', // Get unread messages
						});

						const messages = messagesResponse.data.messages;
						if (messages && messages.length > 0) {
							console.log(`📨 Found ${messages.length} recent messages, processing...`);
							for (const message of messages) {
								if (message.id) {
									await processEmail(message.id, integration.userId);
								}
							}
						} else {
							console.log('📭 No recent messages found');
						}
					} catch (fallbackError) {
						console.error('❌ Error in fallback message processing:', fallbackError);
					}
					return;
				}

				console.log(`📋 Processing ${history.length} history changes`);

				for (const change of history) {
					if (change.messagesAdded) {
						console.log(`📨 Processing ${change.messagesAdded.length} new messages`);
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
	// Check if this message has already been processed
	if (processedMessages.has(messageId)) {
		console.log(`🔄 Skipping already processed message: ${messageId}`);
		return;
	}

	try {
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

		// Extract email subject and sender
		const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
		const from = headers.find((h: any) => h.name === 'From')?.value || '';
		const date = headers.find((h: any) => h.name === 'Date')?.value || '';

		// Extract clean email address from "Name <email@domain.com>" format
		const cleanEmail = extractEmailFromString(from);

		console.log(`📧 Processing email: "${subject}" from ${from} (clean: ${cleanEmail})`);

		// Extract company name from subject or from email
		let companyName = extractCompanyFromSubject(subject);

		// If no company name found in subject, try to extract from "From" field
		if (!companyName) {
			companyName = extractCompanyFromEmail(from);
			if (companyName) {
				console.log(`🏢 Extracted company name from email: ${companyName}`);
			}
		} else {
			console.log(`🏢 Extracted company name from subject: ${companyName}`);
		}

		if (!companyName) {
			console.log('❌ No company name found in subject or email:', { subject, from });
			return;
		}

		// Initialize Convex client
		const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

		// Find or create company
		let company = await convexClient.query(api.companies.getCompanyByEmail, {
			email: cleanEmail,
		});

		if (!company) {
			console.log(`🏗️ Creating new company: ${companyName}`);
			// Create new company
			const companyId = await convexClient.mutation(api.companies.createCompany, {
				name: companyName,
				email: cleanEmail,
				ownerId: userId as any, // Associate with the user
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
			console.log(`✅ Found existing company: ${company.name}`);
			// Update last email received timestamp
			await convexClient.mutation(api.companies.updateCompany, {
				companyId: company._id,
			});
		}

		if (!company) {
			console.error('❌ Failed to create or find company');
			return;
		}

		// Add notification for new email
		if (userId) {
			try {
				await NotificationService.addEmailNotification(userId, subject, company.name);
				console.log(`🔔 Email notification added for user: ${userId}`);
			} catch (error) {
				console.error('❌ Error adding email notification:', error);
			}
		}

		// Process attachments
		await processAttachments(message, company._id, cleanEmail, userId);

		// Mark this message as processed
		processedMessages.add(messageId);
		console.log(`✅ Successfully processed message: ${messageId}`);

		// Clean up old processed messages
		cleanupProcessedMessages();
	} catch (error) {
		console.error('❌ Error processing email:', error);
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

		if (attachmentCount === 0) {
			console.log('📭 No attachments found in email');
		} else {
			console.log(`✅ Processed ${attachmentCount} attachment(s)`);
		}
	} catch (error) {
		console.error('❌ Error processing attachments:', error);
	}
}

async function processAttachment(part: any, companyId: string, uploadedBy: string, messageId: string, userId?: string) {
	try {
		console.log(`📄 Processing attachment: ${part.filename} (${part.mimeType})`);

		// Get attachment data
		const attachmentResponse = await gmail.users.messages.attachments.get({
			auth: auth,
			userId: 'me',
			messageId: messageId, // Use the passed messageId parameter
			id: part.body.attachmentId,
		});

		const attachmentData = attachmentResponse.data.data;
		if (!attachmentData) {
			console.log('⚠️ No attachment data found');
			return;
		}

		// Decode base64 attachment
		const buffer = Buffer.from(attachmentData, 'base64');
		console.log(`📦 Attachment size: ${(buffer.length / 1024).toFixed(2)} KB`);

		// Initialize Convex client
		const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

		// Generate upload URL and upload file
		const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl);

		// Upload file to the URL
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
		console.log(`☁️ File uploaded to storage: ${storageId}`);

		// Add document to database
		const documentId = await convexClient.mutation(api.documents.addDocumentToCompany, {
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

		console.log(`✅ Document added to database: ${documentId}`);

		// Add notification for processed document
		if (userId) {
			try {
				// Get company name for notification
				const company = await convexClient.query(api.companies.getCompanyById, {
					companyId: companyId as any,
				});

				if (company) {
					await NotificationService.addDocumentNotification(userId, part.filename, company.name);
					console.log(`🔔 Document notification added for user: ${userId}`);
				}
			} catch (error) {
				console.error('❌ Error adding document notification:', error);
			}
		}

		console.log(`📄 Successfully processed: ${part.filename}`);
	} catch (error) {
		console.error(`❌ Error processing attachment ${part.filename}:`, error);
	}
}
