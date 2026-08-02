import React from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  id?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
  id,
}) => {
  const { settings } = useSettingsStore();
  const isReducedMotion = settings.reducedMotion;

  let variantClass = 'rounded-lg';
  if (variant === 'text') variantClass = 'rounded h-3.5 my-1';
  if (variant === 'circular') variantClass = 'rounded-full';
  if (variant === 'rectangular') variantClass = 'rounded-none';

  const animationClass = isReducedMotion
    ? 'bg-slate-800/60'
    : 'bg-slate-800/60 animate-pulse';

  return (
    <div
      id={id}
      aria-hidden="true"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      className={`relative overflow-hidden ${variantClass} ${animationClass} ${className}`}
    >
      {!isReducedMotion && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.8s_infinite]" />
      )}
    </div>
  );
};
