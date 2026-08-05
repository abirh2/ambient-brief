import React from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0.1 to 1.0
  id?: string;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className = '',
  intensity,
  id,
}) => {
  const { settings } = useSettingsStore();
  const effectiveIntensity = intensity ?? settings.glassIntensity ?? 0.65;

  return (
    <div
      id={id}
      className={`glass-panel relative transition-all duration-300 ${className}`}
      style={{
        backgroundColor: `rgba(15, 23, 42, ${Math.min(Math.max(effectiveIntensity, 0.2), 0.95)})`,
      }}
    >
      <div className="specular-highlight absolute top-0 left-0 right-0 h-px pointer-events-none" />
      {children}
    </div>
  );
};
