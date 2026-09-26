import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-sm text-neutral-200">APPSC Prep</span>
            <span className="text-xs text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">Next-Gen Bilingual Examination Architecture</span>
          </div>
          <p className="text-xs text-neutral-500">
            Dedicated prep platform for APPSC Group 1, Group 2, and Group 3 aspirants.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DRM Safeguarded</span>
          </div>
          <span>•</span>
          <span>Single Session Security</span>
          <span>•</span>
          <span>© 2026 APPSC Prep</span>
        </div>
      </div>
    </footer>
  );
};
