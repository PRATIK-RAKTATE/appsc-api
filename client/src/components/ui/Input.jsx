import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={twMerge('w-full flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-medium text-neutral-400 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-neutral-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={twMerge(
            clsx(
              'w-full bg-neutral-900/60 border rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all duration-200 outline-none',
              'focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:bg-neutral-900/90',
              Icon ? 'pl-10' : 'pl-4',
              error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                : 'border-neutral-800 hover:border-neutral-700',
              className
            )
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
