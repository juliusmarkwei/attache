'use client';

import { useMutation } from 'convex/react';
import { Camera, Mail, Save, User, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
	const { user, loading, authChecked, handleLogout, checkAuth } = useAuth();

	// Check authentication on mount
	React.useEffect(() => {
		if (!authChecked) {
			checkAuth();
		}
	}, [authChecked, checkAuth]);

	const [name, setName] = useState(user?.name || '');
	const [email, setEmail] = useState(user?.email || '');
	const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Update form when user data changes
	React.useEffect(() => {
		if (user) {
			setName(user.name || '');
			setEmail(user.email || '');
			setProfilePicture(user.profilePicture || '');
		}
	}, [user]);

	const updateProfile = useMutation(api.users.updateProfile);

	const handleSave = async () => {
		if (!user?.id) return;

		try {
			await updateProfile({
				userId: user.id as any,
				name,
				email,
				profilePicture,
			});
			toast.success('Profile updated successfully');
		} catch (error) {
			toast.error('Failed to update profile');
		}
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('File size must be less than 5MB');
			return;
		}

		setIsUploading(true);
		try {
			// Convert to base64 for now (in production, you'd upload to a CDN)
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setProfilePicture(result);
				setIsUploading(false);
				toast.success('Profile picture updated');
			};
			reader.readAsDataURL(file);
		} catch (error) {
			setIsUploading(false);
			toast.error('Failed to upload image');
		}
	};

	const handleRemovePicture = () => {
		setProfilePicture('');
		toast.success('Profile picture removed');
	};

	// Sample notifications for testing
	const sampleNotifications = [
		{
			id: '1',
			title: 'Profile Updated',
			message: 'Your profile has been successfully updated',
			timestamp: new Date(),
			type: 'system' as const,
		},
	];

	return (
		<DashboardLayout onLogout={handleLogout} user={user} notifications={sampleNotifications}>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold text-white">Settings</h1>
					<p className="text-slate-400 mt-1">Manage your account settings and preferences</p>
				</div>

				{/* Profile Settings */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100 flex items-center">
							<User className="h-5 w-5 mr-2" />
							Profile Settings
						</CardTitle>
						<CardDescription className="text-slate-400">
							Update your personal information and profile picture
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Profile Picture */}
						<div className="space-y-4">
							<Label className="text-slate-300">Profile Picture</Label>
							<div className="flex items-center space-x-4">
								<div className="relative">
									{profilePicture ? (
										<img
											src={profilePicture}
											alt="Profile"
											className="h-20 w-20 rounded-full object-cover border-2 border-slate-600"
										/>
									) : (
										<div className="h-20 w-20 rounded-full bg-[#FFB900] flex items-center justify-center text-black font-semibold text-2xl">
											{name.charAt(0).toUpperCase()}
										</div>
									)}
									{isUploading && (
										<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
										</div>
									)}
								</div>
								<div className="space-y-2">
									<Button
										onClick={() => fileInputRef.current?.click()}
										variant="outline"
										size="sm"
										className="border-slate-600 text-slate-200 hover:bg-slate-700"
										disabled={isUploading}
									>
										<Camera className="h-4 w-4 mr-2" />
										{isUploading ? 'Uploading...' : 'Upload Photo'}
									</Button>
									{profilePicture && (
										<Button
											onClick={handleRemovePicture}
											variant="outline"
											size="sm"
											className="border-red-600 text-red-400 hover:bg-red-600/10"
										>
											<X className="h-4 w-4 mr-2" />
											Remove
										</Button>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										onChange={handleFileUpload}
										className="hidden"
									/>
								</div>
							</div>
						</div>

						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="name" className="text-slate-300">
								Name
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
								placeholder="Enter your name"
							/>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email" className="text-slate-300">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
								placeholder="Enter your email"
							/>
						</div>

						{/* Save Button */}
						<Button onClick={handleSave} className="bg-[#FFB900] text-black hover:bg-[#FFB900]/90">
							<Save className="h-4 w-4 mr-2" />
							Save Changes
						</Button>
					</CardContent>
				</Card>

				{/* Account Information */}
				<Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
					<CardHeader>
						<CardTitle className="text-slate-100 flex items-center">
							<Mail className="h-5 w-5 mr-2" />
							Account Information
						</CardTitle>
						<CardDescription className="text-slate-400">
							Your account details and preferences
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label className="text-slate-400 text-sm">User ID</Label>
								<p className="text-slate-200 font-mono text-sm">{user?.id}</p>
							</div>
							<div>
								<Label className="text-slate-400 text-sm">Account Created</Label>
								<p className="text-slate-200 text-sm">
									{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
