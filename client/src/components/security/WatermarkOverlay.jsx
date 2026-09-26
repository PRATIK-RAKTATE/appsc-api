import React from 'react';
import { useAuthStore } from '../../stores/authStore';

export const WatermarkOverlay = ({ enabled = true }) => {
  const user = useAuthStore((s) => s.user);

  if (!enabled || !user) return null;

  const watermarkText = `${user.email || user.fullName || user._id} • APPSC PREP • ${new Date().toLocaleDateString()}`;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
      aria-hidden="true"
    >
      <svg className="h-full w-full opacity-[0.04]">
        <defs>
          <pattern
            id="watermark-pattern"
            width="340"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            <text
              x="20"
              y="90"
              fill="currentColor"
              fontSize="12"
              fontWeight="600"
              className="text-neutral-100 font-mono tracking-wider"
            >
              {watermarkText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>
    </div>
  );
};
