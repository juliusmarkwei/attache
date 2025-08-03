"use client";

import { Building2 } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	subtitle: string;
}

export default function AuthLayout({
	children,
	title,
	subtitle,
}: AuthLayoutProps) {
	return (
		<div className="min-h-screen flex">
			{/* Left Panel - Image Background */}
			<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
				{/* Background Image */}
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{
						backgroundImage: "url('/Sandy_Tech-02_Single-10.jpg')",
					}}
				></div>

				{/* Overlay for better text readability */}
				<div className="absolute inset-0 bg-gradient-to-r from-[#47333B]/60 to-[#47333B]/40"></div>
			</div>

			{/* Right Panel - Auth Forms with Overlay Branding */}
			<div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#444641] to-[#876F53] px-4 sm:px-6 lg:px-8 relative">
				{/* Background Image for mobile and overlay */}
				<div className="absolute inset-0 lg:hidden">
					<div
						className="absolute inset-0 bg-cover bg-center opacity-20"
						style={{
							backgroundImage:
								"url('/Sandy_Tech-02_Single-10.jpg')",
						}}
					></div>
				</div>

				<div className="w-full max-w-md relative z-10">
					{/* Branding Overlay */}
					<div className="text-center mb-8">
						<div className="flex items-center justify-center mb-6">
							<div className="w-12 h-12 bg-[#FFB900]/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-[#FFB900]/30">
								<Building2 className="w-6 h-6 text-[#FFB900]" />
							</div>
							<h1 className="text-3xl font-bold text-[#FFB900]">
								Attache
							</h1>
						</div>
						<h2 className="text-2xl font-bold mb-2 text-white">
							{title}
						</h2>
						<p className="text-[#FFB900]/80">{subtitle}</p>
					</div>

					{/* Form Container - No card background */}
					<div className="space-y-6">{children}</div>
				</div>
			</div>
		</div>
	);
}
