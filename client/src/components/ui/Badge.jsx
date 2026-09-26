import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variants = {
    neutral: 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    accent: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  };

  const dotColors = {
    neutral: 'bg-neutral-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    accent: 'bg-amber-400',
    info: 'bg-sky-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
    lg: 'text-sm px-3 py-1.5 rounded-lg gap-2',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium border backdrop-blur-md select-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
