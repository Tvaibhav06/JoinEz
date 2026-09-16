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

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-600">
          <span className="font-medium text-slate-700">
            {label || (
              <>
                <span className="font-semibold text-slate-900 tabular-nums">{confirmed}</span> of{' '}
                <span className="tabular-nums">{total}</span> confirmed
              </>
            )}
          </span>
          <div className="flex items-center space-x-1.5">
            {isComplete ? (
              <Badge variant="complete" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 inline" />
                Complete
              </Badge>
            ) : (
              <span className="font-semibold text-slate-900 tabular-nums text-xs">
                {percentage}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightClass}`}>
        <div
          className={`progress-bar-fill h-full rounded-full ${
            isComplete
              ? 'bg-emerald-600'
              : percentage > 50
              ? 'bg-indigo-600'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
