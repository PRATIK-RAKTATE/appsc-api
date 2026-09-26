import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  isDismissible = true,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={isDismissible ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} glass-panel border border-neutral-800 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>}
            {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
          </div>
          {isDismissible && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
