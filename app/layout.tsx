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
