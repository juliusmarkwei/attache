'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className="toaster group"
			style={
				{
					'--normal-bg': '#FEB902',
					'--normal-text': '#47333B',
					'--normal-border': '#FEB902',
					'--success-bg': '#FEB902',
					'--success-text': '#47333B',
					'--success-border': '#FEB902',
					'--error-bg': '#FEB902',
					'--error-text': '#47333B',
					'--error-border': '#FEB902',
					'--warning-bg': '#FEB902',
					'--warning-text': '#47333B',
					'--warning-border': '#FEB902',
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
