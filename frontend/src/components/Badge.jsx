import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px] leading-tight'
    : 'px-2.5 py-1 text-xs leading-normal';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    confirmed: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    pending: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    complete: 'bg-emerald-100/80 text-emerald-900 border border-emerald-300',
    student: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    admin: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    all_students: 'bg-slate-100 text-slate-800 border border-slate-300/80',
    group: 'bg-indigo-50 text-indigo-800 border border-indigo-200/80'
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center font-medium rounded-md tracking-tight ${sizeClasses} ${variantClass}`}>
      {children}
    </span>
  );
}
