import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variantClass = `btn--${variant}`;
  const sizeClass = size !== 'md' ? `btn--${size}` : '';
  const loadingClass = loading ? 'btn--loading' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {Icon && !loading && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

export function ButtonGroup({ children, className = '' }) {
  return <div className={`btn-group ${className}`}>{children}</div>;
}
