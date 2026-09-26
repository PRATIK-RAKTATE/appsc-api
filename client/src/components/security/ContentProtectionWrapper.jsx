import React, { useEffect } from 'react';

export const ContentProtectionWrapper = ({ children, enabled = true, showNotice = false }) => {
  useEffect(() => {
    if (!enabled) return;

    // 1. Disable Right Click Context Menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Intercept Print & Copy Shortcuts
    const handleKeyDown = (e) => {
      // Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        alert('Printing and downloading proprietary APPSC study material is disabled.');
        return false;
      }
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText('');
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return (
    <div className={enabled ? 'no-copy select-none' : ''}>
      {children}
    </div>
  );
};
