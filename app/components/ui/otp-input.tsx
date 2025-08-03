'use client';

import { useRef } from 'react';

interface OtpInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = e.target.value;

		// Only allow digits
		inputValue = inputValue.replace(/\D/g, '');

		// Limit to the specified length
		inputValue = inputValue.slice(0, length);

		onChange(inputValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Allow: backspace, delete, tab, escape, enter
		if (
			[8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
			// Allow Ctrl+A
			(e.keyCode === 65 && e.ctrlKey === true) ||
			// Allow Ctrl+C
			(e.keyCode === 67 && e.ctrlKey === true) ||
			// Allow Ctrl+V
			(e.keyCode === 86 && e.ctrlKey === true) ||
			// Allow Ctrl+X
			(e.keyCode === 88 && e.ctrlKey === true) ||
			// Allow home, end, left, right
			(e.keyCode >= 35 && e.keyCode <= 39)
		) {
			return;
		}

		// Ensure that it is a number and stop the keypress
		if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		}
	};

	return (
		<div className="flex justify-center">
			<input
				ref={inputRef}
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				maxLength={length}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				className="w-80 h-14 text-center text-lg font-semibold border-2 border-[#876F53] rounded-lg focus:border-[#FFB900] focus:outline-none focus:ring-2 focus:ring-[#FFB900] bg-white/10 text-white transition-colors tracking-widest"
				placeholder="Enter 6-digit code"
				style={{ letterSpacing: '0.5em' }}
			/>
		</div>
	);
}
