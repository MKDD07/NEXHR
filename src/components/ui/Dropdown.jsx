import React, { useState, useRef, useEffect } from 'react';

export function Dropdown({
  trigger,
  children,
  align = 'right', // 'right' | 'left'
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`dropdown ${className}`} ref={containerRef}>
      <div
        className="dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`dropdown__menu ${
            align === 'left' ? 'dropdown__menu--left' : ''
          }`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon: Icon,
  danger = false,
  onClick,
  className = ''
}) {
  return (
    <button
      type="button"
      className={`dropdown__item ${danger ? 'dropdown__item--danger' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="dropdown__divider" />;
}

export function DropdownLabel({ children }) {
  return <div className="dropdown__label">{children}</div>;
}
