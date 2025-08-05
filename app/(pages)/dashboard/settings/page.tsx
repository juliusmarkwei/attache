'use client';

import { useMutation, useQuery } from 'convex/react';
import { Mail, Save, User } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthStore } from '../../../stores/authStore';

export default function SettingsPage() {
	const { user, handleLogout, checkAuth } = useAuth();
	const { setUser } = useAuthStore();
	const gmailIntegration = useQuery(
		api.gmail.getGmailIntegration,
		user?.id ? { userId: user.id as Id<'users'> } : 'skip',
	);

	const [name, setName] = useState(user?.name || '');
	const [email, setEmail] = useState(user?.email || '');
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	React.useEffect(() => {
		if (user) {
			setName(user.name || '');
			setEmail(user.email || '');
			setHasUnsavedChanges(false);
		}
	}, [user]);

	// Track unsaved changes
	React.useEffect(() => {
		const hasChanges = name !== (user?.name || '');

		setHasUnsavedChanges(hasChanges);
	}, [name, user]);

	const updateProfile = useMutation(api.users.updateProfile);

	const handleSave = async () => {
		if (!user?.id) return;

		// Validate required fields
		if (!name.trim()) {
			toast.error('Name is required');
			return;
		}

		try {
			await updateProfile({
				userId: user.id as Id<'users'>,
				name: name.trim(),
			});

			// Update the user in the auth store with new data
			const updatedUser = {
				...user,
				name: name.trim(),
			};
			setUser(updatedUser);

			// Force a refresh of the auth state to ensure all components update
			await checkAuth(false);

			// Clear unsaved changes flag
			setHasUnsavedChanges(false);

			toast.success('Profile updated successfully');
		} catch (error) {
			console.error('Profile update error:', error);
			toast.error('Failed to update profile');
		}
	};

	return (
		<DashboardLayout
			onLogout={handleLogout}
			user={user}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			gmailIntegration={gmailIntegration as any}
		>
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
								disabled
								className="bg-slate-600/50 border-slate-500 text-slate-400 cursor-not-allowed opacity-60"
								placeholder="Email cannot be changed"
							/>
							<p className="text-xs text-slate-500 mt-1">Email address cannot be modified</p>
						</div>

						{/* Save Button */}
						<Button
							onClick={handleSave}
							className={`${
								hasUnsavedChanges
									? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
									: 'bg-[#FFB900] text-black hover:bg-[#FFB900]/90'
							}`}
							disabled={!hasUnsavedChanges}
						>
							<Save className="h-4 w-4 mr-2" />
							{hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
						</Button>

						{hasUnsavedChanges && (
							<p className="text-xs text-orange-400 mt-1">* You have unsaved changes</p>
						)}
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
									{user?.createdAt
										? new Date(user.createdAt).toLocaleDateString('en-US', {
												day: 'numeric',
												month: 'long',
												year: 'numeric',
											}) +
											' at ' +
											new Date(user.createdAt).toLocaleTimeString('en-US', {
												hour: 'numeric',
												minute: '2-digit',
												hour12: true,
											})
										: 'N/A'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
