'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

export default function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = 'Delete',
	cancelText = 'Cancel',
	isLoading = false,
}: ConfirmationModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<Card className="relative w-full max-w-md mx-4 bg-slate-800 border-slate-700">
				<CardHeader className="pb-4">
					<div className="flex items-center space-x-3">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
								<AlertTriangle className="h-5 w-5 text-red-400" />
							</div>
						</div>
						<div className="flex-1">
							<CardTitle className="text-slate-100">{title}</CardTitle>
							<CardDescription className="text-slate-400 mt-1">{description}</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="text-slate-400 hover:text-slate-300 hover:bg-slate-700 h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<div className="flex items-center justify-end space-x-3">
						<Button
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
							className="border-slate-600 text-slate-300 hover:bg-slate-700"
						>
							{cancelText}
						</Button>
						<Button
							onClick={onConfirm}
							disabled={isLoading}
							className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						>
							{isLoading ? (
								<div className="flex items-center space-x-2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									<span>Deleting...</span>
								</div>
							) : (
								confirmText
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
