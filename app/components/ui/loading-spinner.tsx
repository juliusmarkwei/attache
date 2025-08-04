import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	text?: string;
	className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12',
	};

	return (
		<div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
			<Loader2 className={`${sizeClasses[size]} animate-spin text-[#FFB900]`} />
			{text && <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>}
		</div>
	);
}

export function DashboardLoadingSpinner() {
	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
			<div className="flex-1 flex items-center justify-center">
				<LoadingSpinner size="lg" text="Loading dashboard..." className="text-center" />
			</div>
		</div>
	);
}
