import React from 'react';

export function Tabs({
  tabs, // Array of { id, label, count?, icon? }
  activeTab,
  onChange,
  fullWidth = false,
  className = ''
}) {
  return (
    <div className={`tabs ${fullWidth ? 'tabs--full' : ''} ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tabs__tab ${isActive ? 'tabs__tab--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tabs__tab__count">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
