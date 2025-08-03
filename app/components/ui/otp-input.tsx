'use client';

import { useEffect, useRef } from 'react';

interface OtpInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Initialize refs array
	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, length);
	}, [length]);

	const handleChange = (index: number, inputValue: string) => {
		// Only allow digits
		const digit = inputValue.replace(/\D/g, '').slice(0, 1);

		if (digit) {
			// Update the value at the current index
			const newValue = value.split('');
			newValue[index] = digit;
			const result = newValue.join('');
			onChange(result);

			// Move to next input if available
			if (index < length - 1) {
				inputRefs.current[index + 1]?.focus();
			}
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		// Handle backspace
		if (e.key === 'Backspace') {
			if (value[index]) {
				// Clear current digit
				const newValue = value.split('');
				newValue[index] = '';
				onChange(newValue.join(''));
			} else if (index > 0) {
				// Move to previous input and clear it
				const newValue = value.split('');
				newValue[index - 1] = '';
				onChange(newValue.join(''));
				inputRefs.current[index - 1]?.focus();
			}
		}

		// Handle arrow keys
		if (e.key === 'ArrowLeft' && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
		if (e.key === 'ArrowRight' && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}

		// Allow: tab, escape, enter
		if ([9, 27, 13].indexOf(e.keyCode) !== -1) {
			return;
		}

		// Ensure that it is a number and stop the keypress
		if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
		onChange(pastedData);

		// Focus the next empty input or the last input
		const nextIndex = Math.min(pastedData.length, length - 1);
		inputRefs.current[nextIndex]?.focus();
	};

	return (
		<div className="flex justify-center gap-3">
			{Array.from({ length }, (_, index) => (
				<input
					key={index}
					ref={(el) => {
						inputRefs.current[index] = el;
					}}
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					maxLength={1}
					value={value[index] || ''}
					onChange={(e) => handleChange(index, e.target.value)}
					onKeyDown={(e) => handleKeyDown(index, e)}
					onPaste={handlePaste}
					className="w-12 h-12 text-center text-lg font-semibold border-2 border-[#876F53] rounded-lg focus:border-[#FFB900] focus:outline-none focus:ring-2 focus:ring-[#FFB900] bg-white/10 text-white transition-colors"
					placeholder=""
				/>
			))}
		</div>
	);
}
