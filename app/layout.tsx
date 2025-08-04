import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthInitializer } from './components/providers/AuthInitializer';
import ConvexProviderWrapper from './components/providers/ConvexProvider';
import { Toaster } from './components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Attache - Document Management Platform',
	description: 'Manage company documents with email integration',
	keywords: ['document management', 'email integration', 'Gmail API', 'file storage', 'company organization'],
	authors: [{ name: 'Attache Team' }],
	creator: 'Attache',
	publisher: 'Attache',
	robots: 'index, follow',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://attache-one.vercel.app',
		title: 'Attache - Document Management Platform',
		description:
			'Manage company documents with email integration. Automatically process emails and organize documents by company.',
		siteName: 'Attache',
		images: [
			{
				url: 'https://attache-one.vercel.app/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Attache - Document Management Platform',
				type: 'image/png',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Attache - Document Management Platform',
		description:
			'Manage company documents with email integration. Automatically process emails and organize documents by company.',
		images: ['https://attache-one.vercel.app/og-image.png'],
		creator: '@attache_app',
		site: '@attache_app',
	},
	icons: {
		icon: [
			{
				url: '/icon.svg',
				type: 'image/svg+xml',
			},
			{
				url: '/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				url: '/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
		apple: [
			{
				url: '/icon.svg',
				type: 'image/svg+xml',
			},
		],
	},
	manifest: '/manifest.json',
	other: {
		'msapplication-TileColor': '#FFB900',
		'theme-color': '#FFB900',
		'og:image:width': '1200',
		'og:image:height': '630',
		'og:image:type': 'image/png',
		'og:image:alt': 'Attache - Document Management Platform',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ConvexProviderWrapper>
					<AuthInitializer />
					{children}
					<Toaster />
				</ConvexProviderWrapper>
			</body>
		</html>
	);
}
