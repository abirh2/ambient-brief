import React from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0.1 to 1.0
  id?: string;
  variant?: 'primary' | 'secondary';
}

type GlassSurfaceStyle = React.CSSProperties & { '--glass-alpha': number };

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className = '',
  intensity,
  id,
  variant = 'primary',
}) => {
  const { settings } = useSettingsStore();
  const effectiveIntensity = intensity ?? settings.glassIntensity ?? 0.65;
  const minimumAlpha = variant === 'secondary' ? 0.64 : 0.44;
  const maximumAlpha = variant === 'secondary' ? 0.86 : 0.78;
  const softenedIntensity = effectiveIntensity - 0.045;

  const style: GlassSurfaceStyle = {
    '--glass-alpha': Math.min(Math.max(softenedIntensity, minimumAlpha), maximumAlpha),
  };

  return (
    <div
      id={id}
      data-variant={variant}
      className={`glass-panel ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
