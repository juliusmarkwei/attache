import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

interface SendOTPEmailParams {
	email: string;
	otp: string;
	companyName?: string;
}

export async function sendOTPEmail({ email, otp, companyName }: SendOTPEmailParams): Promise<boolean> {
	try {
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Your OTP for Attache',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<div style="text-align: center; margin-bottom: 30px;">
						<h2 style="color: #FEB902; margin: 0; font-size: 28px;">Attache</h2>
						<p style="color: #6b7280; margin: 5px 0;">Document Management Platform</p>
					</div>

					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							${companyName ? `Hello ${companyName}!` : 'Hello!'}
						</p>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							Your verification code is:
						</p>
						<div style="background-color: #FEB902; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
							<h1 style="color: #47333B; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
						</div>
						<p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
							This code will expire in 10 minutes.
						</p>
					</div>

					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
						<p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
							If you didn't request this code, please ignore this email.
						</p>
						<p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
							This is an automated message from Attache. Please do not reply to this email.
						</p>
					</div>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		console.log(`OTP email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error('Failed to send OTP email:', error);
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
							Thank you for joining our document management platform. Your account has been successfully created.
						</p>
						<p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
							You can now:
						</p>
						<ul style="margin: 0 0 15px 0; color: #374151; font-size: 16px; padding-left: 20px;">
							<li>Upload and manage your documents</li>
							<li>Organize files by categories</li>
							<li>Share documents with your team</li>
							<li>Track document versions</li>
						</ul>
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
