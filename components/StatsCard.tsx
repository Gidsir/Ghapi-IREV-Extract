import React from 'react';

export const StatsCard = ({ title, value, color = 'blue' }: { title: string, value: string | number, color?: string }) => (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 border-${color}-500 p-5`}>
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
    </div>
);