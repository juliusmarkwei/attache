"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { OtpInput } from "../ui/otp-input";
import { toast } from "sonner";

interface LoginFormProps {
	onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");
	const [loading, setLoading] = useState(false);

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/auth/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				setStep("otp");
				toast.success("OTP sent successfully!", {
					description: "Check your email for the 6-digit code.",
				});
			} else {
				toast.error("Failed to send OTP", {
					description: data.error || "Please try again.",
				});
			}
		} catch (error) {
			toast.error("Network error", {
				description: "Please check your connection and try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/auth/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, otp }),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Login successful!", {
					description: "Welcome to Attache.",
				});
				onSuccess();
			} else {
				toast.error("Invalid OTP", {
					description:
						data.error || "Please check your code and try again.",
				});
			}
		} catch (error) {
			toast.error("Network error", {
				description: "Please check your connection and try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome to Attache
					</h1>
					<p className="text-gray-600">
						Sign in to manage your documents
					</p>
				</div>

				<Card className="shadow-xl">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl text-center">
							{step === "email" ? "Sign In" : "Verify OTP"}
						</CardTitle>
						<CardDescription className="text-center">
							{step === "email"
								? "Enter your email to receive a verification code"
								: `We've sent a 6-digit code to ${email}`}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{step === "email" ? (
							<form
								onSubmit={handleEmailSubmit}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(e) =>
												setEmail(e.target.value)
											}
											placeholder="Enter your email"
											className="pl-10"
											required
										/>
									</div>
								</div>

								<Button
									type="submit"
									className="w-full"
									disabled={loading}
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending OTP...
										</>
									) : (
										<>
											Send OTP
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</form>
						) : (
							<form
								onSubmit={handleOtpSubmit}
								className="space-y-4"
							>
								<div className="space-y-2">
									<OtpInput value={otp} onChange={setOtp} />
									<p className="text-sm text-gray-500 text-center mt-2">
										Enter the 6-digit code sent to your
										email
									</p>
								</div>

								<div className="space-y-3">
									<Button
										type="submit"
										className="w-full"
										disabled={loading}
									>
										{loading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Verifying...
											</>
										) : (
											"Verify OTP"
										)}
									</Button>

									<Button
										type="button"
										variant="outline"
										className="w-full"
										onClick={() => setStep("email")}
									>
										Back to email
									</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
