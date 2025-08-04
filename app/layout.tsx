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
