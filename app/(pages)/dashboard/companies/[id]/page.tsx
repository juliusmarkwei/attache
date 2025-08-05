'use client';

import { useMutation, useQuery } from 'convex/react';
import { Building2, Calendar, Edit, FileText, Mail, Save, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import ConfirmationModal from '../../../../components/ui/confirmation-modal';
import DocumentList from '../../../../components/ui/document-list';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { useAuth } from '../../../../hooks/useAuth';

export default function CompanyDetails() {
	const { id } = useParams();
	const router = useRouter();
	const { user, loading, authChecked, handleLogout } = useAuth();

	const company = useQuery(api.companies.getCompanyById, { companyId: id as Id<'companies'> });
	const documents = useQuery(api.documents.getDocumentsByCompany, { companyId: id as Id<'companies'> });
	const gmailIntegration = useQuery(
		api.gmail.getGmailIntegration,
		user?.id ? { userId: user.id as Id<'users'> } : 'skip',
	);
	const updateCompanyMutation = useMutation(api.companies.updateCompany);
	const deleteCompanyMutation = useMutation(api.companies.deleteCompany);

	const [isEditing, setIsEditing] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
	const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
	const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		phone: '',
		location: '',
		country: '',
	});

	// Initialize form data when company loads
	useEffect(() => {
		if (company) {
			setFormData({
				phone: company.phone || '',
				location: company.location || '',
				country: company.country || '',
			});
		}
	}, [company]);

	if (loading || !authChecked || documents === undefined) {
		return (
			<DashboardLayout onLogout={handleLogout} user={user}>
				<div className="flex items-center justify-center h-64">
					<div className="text-slate-400">Loading...</div>
				</div>
			</DashboardLayout>
		);
	}

	if (!company) {
		return (
			<DashboardLayout onLogout={handleLogout} user={user}>
				<div className="flex items-center justify-center h-64">
					<div className="text-slate-400">Company not found</div>
				</div>
			</DashboardLayout>
		);
	}

	const handleSave = async () => {
		try {
			await updateCompanyMutation({
				companyId: company._id,
				phone: formData.phone,
				location: formData.location,
				country: formData.country,
			});

			setIsEditing(false);
			toast.success('Company updated successfully');
		} catch (error) {
			toast.error('Failed to update company');
		}
	};

	const handleDeleteClick = () => {
		if (documents === undefined) {
			toast.error('Please wait for documents to load');
			return;
		}
		if (documents.length > 0) {
			toast.error('Cannot delete company with existing documents');
			return;
		}
		setShowDeleteModal(true);
	};

	const handleDeleteConfirm = async () => {
		setIsDeleting(true);
		try {
			await deleteCompanyMutation({ companyId: company._id });
			toast.success('Company deleted successfully');
			router.push('/dashboard/companies');
		} catch (error) {
			toast.error('Failed to delete company');
		} finally {
			setIsDeleting(false);
			setShowDeleteModal(false);
		}
	};

	const handleDeleteDocument = async (documentId: string, filename: string) => {
		setDeletingDocumentId(documentId);
		try {
			const response = await fetch(`/api/documents/delete?documentId=${documentId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				toast.success('Document deleted successfully');
				closeDeleteDocumentModal();
			} else {
				const errorData = await response.json();
				console.error('Delete failed:', errorData.error);
				toast.error('Failed to delete document');
			}
		} catch (error) {
			console.error('Delete failed:', error);
			toast.error('Failed to delete document');
		} finally {
			setDeletingDocumentId(null);
		}
	};

	const openDeleteDocumentModal = (documentId: string, filename: string) => {
		setDocumentToDelete({ id: documentId, name: filename });
		setShowDeleteDocumentModal(true);
	};

	const closeDeleteDocumentModal = () => {
		setShowDeleteDocumentModal(false);
		setDocumentToDelete(null);
	};

	const documentCount = documents?.length || 0;

	return (
		<DashboardLayout
			onLogout={handleLogout}
			user={user}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			gmailIntegration={gmailIntegration as any}
		>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Button
							variant="ghost"
							onClick={() => router.push('/dashboard/companies')}
							className="text-slate-400 hover:text-white"
						>
							<X className="h-4 w-4 mr-2" />
							Back to Companies
						</Button>
						<div className="h-6 w-px bg-slate-600" />
						<h1 className="text-3xl font-bold text-white">{company.name}</h1>
					</div>
					<div className="flex items-center space-x-2">
						{!isEditing ? (
							<Button
								onClick={() => setIsEditing(true)}
								variant="outline"
								className="border-slate-600 text-slate-300 hover:bg-transparent hover:text-slate-300 hover:cursor-pointer"
							>
								<Edit className="h-4 w-4 mr-2" />
								Edit
							</Button>
						) : (
							<div className="flex items-center space-x-2">
								<Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
									<Save className="h-4 w-4 mr-2" />
									Save
								</Button>
								<Button
									onClick={() => setIsEditing(false)}
									variant="outline"
									className="border-slate-600 text-slate-300 hover:bg-slate-700"
								>
									<X className="h-4 w-4 mr-2" />
									Cancel
								</Button>
							</div>
						)}
						{documents !== undefined && documents.length === 0 && (
							<Button
								onClick={handleDeleteClick}
								variant="outline"
								className="border-red-600 text-red-400 hover:bg-red-600/10"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</Button>
						)}
					</div>
				</div>

				{/* Company Information */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Basic Info */}
					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader>
							<CardTitle className="text-white flex items-center">
								<Building2 className="h-5 w-5 mr-2 text-[#FFB900]" />
								Company Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Company Name - Read Only */}
							<div>
								<Label className="text-slate-300">Company Name</Label>
								<div className="mt-1 p-3 bg-slate-700/50 rounded-lg text-white">{company.name}</div>
							</div>

							{/* Email - Read Only */}
							<div>
								<Label className="text-slate-300">Email</Label>
								<div className="mt-1 p-3 bg-slate-700/50 rounded-lg text-white flex items-center">
									<Mail className="h-4 w-4 mr-2 text-slate-400" />
									{company.email}
								</div>
							</div>

							{/* Phone - Editable */}
							<div>
								<Label className="text-slate-300">Phone</Label>
								{isEditing ? (
									<Input
										value={formData.phone}
										onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
										className="mt-1 bg-slate-700 border-slate-600 text-white"
										placeholder="Enter phone number"
									/>
								) : (
									<div className="mt-1 p-3 bg-slate-700/50 rounded-lg text-white">
										{company.phone || 'Not specified'}
									</div>
								)}
							</div>

							{/* Location - Editable */}
							<div>
								<Label className="text-slate-300">Location</Label>
								{isEditing ? (
									<Input
										value={formData.location}
										onChange={(e) => setFormData({ ...formData, location: e.target.value })}
										className="mt-1 bg-slate-700 border-slate-600 text-white"
										placeholder="Enter location"
									/>
								) : (
									<div className="mt-1 p-3 bg-slate-700/50 rounded-lg text-white">
										{company.location || 'Not specified'}
									</div>
								)}
							</div>

							{/* Country - Editable */}
							<div>
								<Label className="text-slate-300">Country</Label>
								{isEditing ? (
									<Input
										value={formData.country}
										onChange={(e) => setFormData({ ...formData, country: e.target.value })}
										className="mt-1 bg-slate-700 border-slate-600 text-white"
										placeholder="Enter country"
									/>
								) : (
									<div className="mt-1 p-3 bg-slate-700/50 rounded-lg text-white">
										{company.country || 'Not specified'}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Statistics */}
					<Card className="bg-slate-800/50 border-slate-700">
						<CardHeader>
							<CardTitle className="text-white flex items-center">
								<FileText className="h-5 w-5 mr-2 text-[#FFB900]" />
								Statistics
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="p-4 bg-slate-700/50 rounded-lg">
									<div className="text-2xl font-bold text-white">{documentCount}</div>
									<div className="text-sm text-slate-400">Documents</div>
								</div>
								<div className="p-4 bg-slate-700/50 rounded-lg">
									<div className="text-2xl font-bold text-white">
										{company.lastEmailReceived
											? new Date(company.lastEmailReceived).toLocaleDateString()
											: 'Never'}
									</div>
									<div className="text-sm text-slate-400">Last Email</div>
								</div>
							</div>

							<div className="p-4 bg-slate-700/50 rounded-lg">
								<div className="flex items-center text-sm text-slate-400 mb-2">
									<Calendar className="h-4 w-4 mr-2" />
									Created
								</div>
								<div className="text-white">{new Date(company.createdAt).toLocaleDateString()}</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Documents Section */}
				<Card className="bg-slate-800/50 border-slate-700">
					<CardHeader>
						<CardTitle className="text-white flex items-center">
							<FileText className="h-5 w-5 mr-2 text-[#FFB900]" />
							Documents ({documentCount})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<DocumentList
							documents={documents || []}
							companies={[company]}
							onDeleteRequest={openDeleteDocumentModal}
							showDeleteButton={true}
							deletingDocumentId={deletingDocumentId}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Delete Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={handleDeleteConfirm}
				title="Delete Company"
				description={`Are you sure you want to delete "${company?.name}"? This action cannot be undone.`}
				confirmText="Delete Company"
				cancelText="Cancel"
				isLoading={isDeleting}
			/>

			{/* Delete Document Confirmation Modal */}
			<ConfirmationModal
				isOpen={showDeleteDocumentModal}
				onClose={closeDeleteDocumentModal}
				onConfirm={() => documentToDelete && handleDeleteDocument(documentToDelete.id, documentToDelete.name)}
				title="Delete Document"
				description={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
				confirmText="Delete Document"
				cancelText="Cancel"
				isLoading={deletingDocumentId !== null}
			/>
		</DashboardLayout>
	);
}
