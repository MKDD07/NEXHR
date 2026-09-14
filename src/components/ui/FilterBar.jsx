import React from 'react';
import { Search } from 'lucide-react';

export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search by name, ID or keyword...',
  children,
  className = ''
}) {
  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-bar__search">
        <Search className="w-4 h-4" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>

      {children}
    </div>
  );
}
