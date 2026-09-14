import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title = 'No records found',
  description = 'There are currently no items to display in this view.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-200 font-display">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
