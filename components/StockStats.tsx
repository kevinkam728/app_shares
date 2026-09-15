'use client';

import React from 'react';

interface StockStatsProps {
  stats?: {
    marketCap?: number | string;
    peRatio?: number | string;
    ebitda?: number | string;
    eps?: number | string;
    yearHigh?: number | string;
    yearLow?: number | string;
    [key: string]: any;
  };
}

export default function StockStats({ stats }: StockStatsProps) {
  const formatValue = (val: any, isCurrency = false) => {
    if (val === undefined || val === null || val === 'N/A') return 'N/A';
    if (typeof val === 'number') {
      if (isCurrency || val > 1000000) {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const statItems = [
    { label: 'Market Cap', value: formatValue(stats?.marketCap, true) },
    { label: 'P/E Ratio', value: formatValue(stats?.peRatio) },
    { label: 'EBITDA', value: formatValue(stats?.ebitda, true) },
    { label: 'EPS', value: formatValue(stats?.eps) },
    { label: '52W High', value: formatValue(stats?.yearHigh) },
    { label: '52W Low', value: formatValue(stats?.yearLow) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-gray-400 text-sm font-medium">{item.label}</span>
          <span className="text-xl font-bold text-white mt-2 font-mono">
            {item.value || 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
}
