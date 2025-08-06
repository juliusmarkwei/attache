'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface DocumentActivityChartProps {
	data: number[];
}

export default function DocumentActivityChart({ data }: DocumentActivityChartProps) {
	const [tooltipData, setTooltipData] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

	const chartData = data.map((value, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		return {
			name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			documents: value,
		};
	});

	// Custom fill function to avoid styling issues
	const getBarFill = () => '#FFB900';

	return (
		<div className="w-full h-[200px] relative" onMouseLeave={() => setTooltipData(null)}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
					<XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
					<YAxis
						stroke="#9CA3AF"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `${value}`}
					/>
					<Bar
						dataKey="documents"
						fill={getBarFill()}
						radius={[4, 4, 0, 0]}
						onMouseOver={(data, index) => {
							if (data && data.payload) {
								setTooltipData({
									x: data.x || 0,
									y: (data.y || 0) - 50,
									label: data.payload.name,
									value: data.payload.documents,
								});
							}
						}}
						onMouseOut={() => setTooltipData(null)}
						onMouseLeave={() => setTooltipData(null)}
					/>
				</BarChart>
			</ResponsiveContainer>

			{/* Custom tooltip */}
			{tooltipData && (
				<div
					style={{
						position: 'absolute',
						left: tooltipData.x,
						top: tooltipData.y,
						backgroundColor: '#1f2937',
						border: '1px solid #374151',
						borderRadius: '8px',
						padding: '12px',
						boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
						color: '#d1d5db',
						fontSize: '14px',
						zIndex: 1000,
						pointerEvents: 'none',
					}}
				>
					<div style={{ color: '#d1d5db', fontSize: '14px' }}>{tooltipData.label}</div>
					<div style={{ color: '#FFB900', fontWeight: '600', fontSize: '14px' }}>
						{tooltipData.value} documents
					</div>
				</div>
			)}
		</div>
	);
}
