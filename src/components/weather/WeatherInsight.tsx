import React from 'react';
import { Info, CloudRain } from 'lucide-react';

interface WeatherInsightProps {
  note: string;
}

export const WeatherInsight: React.FC<WeatherInsightProps> = ({ note }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-medium backdrop-blur-md">
      <CloudRain className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
      <span>{note}</span>
    </div>
  );
};
