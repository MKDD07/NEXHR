import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className = '',
  icon: Icon
}) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
