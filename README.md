# Attache - Document Management Platform

A full-stack document management platform that automatically processes email attachments and organizes them by company. Built with Next.js, Convex, and Gmail API integration.

## 🚀 Features

- **Passwordless Authentication**: OTP-based login system
- **Gmail Integration**: Automatic email processing with webhooks
- **Document Management**: Store and organize documents by company
- **Real-time Updates**: Live document and company listings
- **Secure Storage**: Convex file storage with download functionality
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

## 🏗️ Architecture

### Backend

- **Next.js API Routes**: RESTful endpoints for authentication and document management
- **Convex Database**: Real-time database for companies, documents, and users
- **Convex Storage**: Secure file storage for document attachments
- **Gmail API**: Webhook-based email processing

### Frontend

- **Next.js 14**: App Router with TypeScript
- **Convex React**: Real-time data synchronization
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Beautiful icon library

## 📋 Prerequisites

- Node.js 18+
- pnpm package manager
- Gmail account with API access
- Convex account

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd attache
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Convex (automatically generated)
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_deployment_name

# Gmail API
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json
GMAIL_WEBHOOK_SECRET=your_webhook_secret

# Optional: Custom domain for webhooks
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create a Service Account
5. Download the JSON key file
6. Set up Gmail API credentials

### 4. Convex Setup

The project is already configured with Convex. The database schema and functions are ready to use.

### 5. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 📧 Gmail Webhook Configuration

### Setting up Gmail Push Notifications

1. **Enable Gmail API**: Ensure Gmail API is enabled in your Google Cloud project
2. **Create Service Account**: Set up a service account with Gmail API permissions
3. **Configure Webhook**: Set up push notifications to your webhook endpoint

### Webhook Endpoint

The webhook endpoint is available at:

```
POST /api/gmail/webhook
```

### Email Processing Logic

The system automatically:

- Extracts company names from email subjects
- Downloads email attachments
- Stores documents in Convex storage
- Associates documents with companies
- Updates the UI in real-time

## 🔐 Authentication

The platform uses a passwordless OTP system:

1. **Email Entry**: Users enter their email address
2. **OTP Generation**: System generates a 6-digit OTP
3. **OTP Verification**: Users enter the OTP to authenticate
4. **Session Management**: Secure session tokens with HTTP-only cookies

## 📁 Document Management

### Features

- **Automatic Processing**: Documents are processed when emails are received
- **Company Association**: Documents are linked to companies based on email subjects
- **Download Functionality**: Users can download documents directly
- **Metadata Tracking**: File size, upload date, and source information

### Document Storage

- Files are stored securely in Convex storage
- Metadata is stored in the Convex database
- Download URLs are generated on-demand

## 🎨 UI Components

### Dashboard

- **Company List**: Shows all companies with document counts
- **Document List**: Displays recent documents with download options
- **Statistics**: Overview of companies and documents
- **Real-time Updates**: Live data synchronization

### Authentication

- **Login Form**: Beautiful OTP-based authentication
- **Session Management**: Automatic session handling
- **Logout**: Secure session termination

## 🔧 Development

### Project Structure

```
attache/
├── convex/                 # Convex functions and schema
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication functions
│   ├── companies.ts       # Company management
│   ├── documents.ts       # Document management
│   └── files.ts           # File storage functions
├── src/
│   ├── app/               # Next.js app router
│   │   ├── api/           # API routes
│   │   └── dashboard/     # Dashboard pages
│   └── components/        # React components
└── public/                # Static assets
```

### Key Technologies

- **Next.js 14**: Full-stack React framework
- **Convex**: Real-time database and file storage
- **Gmail API**: Email processing and webhooks
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe development

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy the application

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
- `GMAIL_WEBHOOK_SECRET`

## 🔒 Security Considerations

- **HTTPS Only**: All production deployments should use HTTPS
- **Secure Cookies**: Session tokens are HTTP-only and secure
- **API Key Protection**: Gmail API keys are stored securely
- **Input Validation**: All user inputs are validated
- **Error Handling**: Comprehensive error handling throughout

## 📈 Advanced Features

### Duplicate Email Handling

- Email IDs are tracked to prevent duplicate processing
- Timestamp-based deduplication

### Sender Authentication

- Email domain validation
- Whitelist/blacklist functionality (can be implemented)

### Webhook vs Polling

- **Webhooks**: Real-time processing, lower latency
- **Polling**: Fallback option for reliability
- **Hybrid Approach**: Webhooks with polling backup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ using Next.js, Convex, and modern web technologies**
