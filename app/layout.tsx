import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthInitializer } from './components/providers/AuthInitializer';
import ConvexProviderWrapper from './components/providers/ConvexProvider';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from './contexts/NotificationContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Attache - Document Management Platform',
	description: 'Manage company documents with email integration',
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
					<NotificationProvider>
						<AuthInitializer />
						{children}
						<Toaster />
					</NotificationProvider>
				</ConvexProviderWrapper>
			</body>
		</html>
	);
}
