import React from 'react';

export function Progress({
  value = 0,
  max = 100,
  size = 'md', // 'sm' | 'md' | 'lg'
  color = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose'
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };

  return (
    <div className={`progress progress--${size} ${className}`}>
      <div
        className={`progress__bar ${colorMap[color] || 'bg-indigo-500'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
