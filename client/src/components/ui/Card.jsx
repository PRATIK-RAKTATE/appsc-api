import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-2xl p-6 transition-all duration-300',
          hoverEffect && 'glow-card hover:-translate-y-0.5',
          glow && 'border-amber-500/30 shadow-lg shadow-amber-500/5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
