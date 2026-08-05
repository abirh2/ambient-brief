import React from 'react';

interface WeatherInsightProps {
  note: string;
}

export const WeatherInsight: React.FC<WeatherInsightProps> = ({ note }) => {
  return (
    <div className="weather-insight inline-flex items-center text-sm font-medium">
      <span>{note}</span>
    </div>
  );
};
