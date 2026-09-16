import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

export default function ProgressBar({
  value = 0,
  confirmed = 0,
  total = 0,
  showLabel = true,
  label = null,
  size = 'md'
}) {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));
  const isComplete = percentage === 100 && total > 0;

  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-slate-600">
          <span>{label || `${confirmed} of ${total} confirmed`}</span>
          <div className="flex items-center space-x-1.5">
            {isComplete ? (
              <Badge variant="complete" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Complete
              </Badge>
            ) : (
              <span className="font-semibold text-slate-800">{percentage}%</span>
            )}
          </div>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`progress-bar-fill h-full rounded-full ${
            isComplete
              ? 'bg-emerald-500'
              : percentage > 50
              ? 'bg-brand-600'
              : 'bg-brand-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
