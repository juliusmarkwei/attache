import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export async function sendVerificationEmail({
	email,
	verificationToken,
	userName,
}: {
	email: string;
	verificationToken: string;
	userName: string;
}): Promise<boolean> {
	try {
		const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Verify Your Email - Attache',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<div style="text-align: center; margin-bottom: 30px;">
						<h2 style="color: #FEB902; margin: 0; font-size: 28px;">Attache</h2>
						<p style="color: #6b7280; margin: 5px 0;">Document Management Platform</p>
					</div>

					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #374151; margin: 0 0 15px 0;">Hello ${userName}!</h3>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							Thank you for creating an account with Attache. To complete your registration, please verify your email address.
						</p>
						<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
							Click the button below to verify your email:
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${verificationUrl}" style="display: inline-block; background-color: #47333B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
								Verify Email
							</a>
						</div>
						<p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
							This link will expire in 30 minutes for security reasons.
						</p>
						<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
							If you didn't create this account, please ignore this email.
						</p>
					</div>

					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
						<p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
							This is an automated message from Attache. Please do not reply to this email.
						</p>
					</div>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		console.log(`Verification email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error('Failed to send verification email:', error);
		return false;
	}
}

export async function sendPasswordResetEmail({
	email,
	resetToken,
	userName,
}: {
	email: string;
	resetToken: string;
	userName: string;
}): Promise<boolean> {
	try {
		const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Reset Your Password - Attache',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<div style="text-align: center; margin-bottom: 30px;">
						<h2 style="color: #FEB902; margin: 0; font-size: 28px;">Attache</h2>
						<p style="color: #6b7280; margin: 5px 0;">Document Management Platform</p>
					</div>

					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #374151; margin: 0 0 15px 0;">Hello ${userName}!</h3>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							We received a request to reset your password for your Attache account.
						</p>
						<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
							Click the button below to reset your password:
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${resetUrl}" style="display: inline-block; background-color: #47333B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
								Reset Password
							</a>
						</div>
						<p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
							This link will expire in 30 minutes for security reasons.
						</p>
						<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
							If you didn't request this password reset, please ignore this email.
						</p>
					</div>

					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
						<p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
							This is an automated message from Attache. Please do not reply to this email.
						</p>
					</div>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		console.log(`Password reset email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error('Failed to send password reset email:', error);
		return false;
	}
}

export async function sendWelcomeEmail({
	email,
	companyName,
}: {
	email: string;
	companyName: string;
}): Promise<boolean> {
	try {
		const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Welcome to Attache!',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<div style="text-align: center; margin-bottom: 30px;">
						<h2 style="color: #FEB902; margin: 0; font-size: 28px;">Attache</h2>
						<p style="color: #6b7280; margin: 5px 0;">Document Management Platform</p>
					</div>

					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #374151; margin: 0 0 15px 0;">Welcome to Attache, ${companyName}!</h3>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							Thank you for joining our document management platform. Your account has been successfully verified and is ready to use!
						</p>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							You can now:
						</p>
						<ul style="margin: 0 0 20px 0; color: #374151; font-size: 16px; padding-left: 20px;">
							<li>Upload and manage your documents</li>
							<li>Organize files by categories</li>
							<li>Share documents with your team</li>
							<li>Track document versions</li>
						</ul>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${loginUrl}" style="display: inline-block; background-color: #47333B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
								Get Started
							</a>
						</div>
					</div>

					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
						<p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
							If you have any questions, please contact our support team.
						</p>
					</div>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		console.log(`Welcome email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error('Failed to send welcome email:', error);
		return false;
	}
}
