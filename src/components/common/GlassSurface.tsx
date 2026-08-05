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

  const style: GlassSurfaceStyle = {
    '--glass-alpha': Math.min(Math.max(effectiveIntensity, 0.2), 0.92),
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
