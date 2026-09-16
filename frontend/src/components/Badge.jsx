import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs font-semibold';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    complete: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    student: 'bg-sky-50 text-sky-700 border border-sky-200',
    admin: 'bg-purple-50 text-purple-700 border border-purple-200',
    all_students: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    group: 'bg-violet-50 text-violet-700 border border-violet-200'
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${variantClass}`}>
      {children}
    </span>
  );
}
