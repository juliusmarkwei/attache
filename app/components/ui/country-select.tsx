'use client';

import Select, { StylesConfig } from 'react-select';
import { getAllCountries } from '../../utils/country-utils';

// Get countries from the library
const countries = getAllCountries();

interface CountrySelectProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function CountrySelect({ value, onChange, placeholder = 'Select country', className }: CountrySelectProps) {
	const selectedCountry = countries.find((country) => country.value === value);

	const customStyles: StylesConfig<{ flag: string; label: string; value: string }, false> = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			borderColor: state.isFocused ? '#FFB900' : '#876F53',
			borderRadius: '8px',
			minHeight: '48px',
			boxShadow: state.isFocused ? '0 0 0 1px #FFB900' : 'none',
			'&:hover': {
				borderColor: '#FFB900',
			},
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? '#FFB900'
				: state.isFocused
					? 'rgba(255, 185, 0, 0.2)'
					: 'rgba(255, 255, 255, 0.05)',
			color: state.isSelected ? '#47333B' : '#ffffff',
			cursor: 'pointer',
			padding: '12px 16px',
			'&:hover': {
				backgroundColor: state.isSelected ? '#FFB900' : 'rgba(255, 185, 0, 0.15)',
			},
		}),
		menu: (provided) => ({
			...provided,
			backgroundColor: 'rgba(71, 51, 59, 0.95)',
			border: '1px solid #876F53',
			borderRadius: '8px',
			backdropFilter: 'blur(10px)',
			boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
		}),
		menuList: (provided) => ({
			...provided,
			padding: '8px 0',
			maxHeight: '200px',
		}),
		singleValue: (provided) => ({
			...provided,
			color: '#ffffff',
		}),
		input: (provided) => ({
			...provided,
			color: '#ffffff',
		}),
		placeholder: (provided) => ({
			...provided,
			color: 'rgba(255, 255, 255, 0.4)',
		}),
		indicatorSeparator: () => ({
			display: 'none',
		}),
		dropdownIndicator: (provided) => ({
			...provided,
			color: 'rgba(255, 255, 255, 0.6)',
			'&:hover': {
				color: '#FFB900',
			},
		}),
	};

	const formatOptionLabel = ({ flag, label }: { flag: string; label: string }) => (
		<div className="flex items-center gap-3">
			<span className="text-lg">{flag}</span>
			<span>{label}</span>
		</div>
	);

	return (
		<Select
			value={selectedCountry}
			onChange={(option) => onChange(option?.value || '')}
			options={countries}
			placeholder={placeholder}
			styles={customStyles}
			formatOptionLabel={formatOptionLabel}
			className={className}
			isClearable={false}
			isSearchable={true}
		/>
	);
}
