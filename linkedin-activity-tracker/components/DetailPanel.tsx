
import React from 'react';
import type { DayData } from '../types';
import { InfoIcon, LoadingSpinnerIcon, WarningIcon } from './icons';

interface DetailPanelProps {
  selectedDay: DayData | null;
  details: string | null;
  isLoading: boolean;
  error: string | null;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ selectedDay, details, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3 text-slate-400">
          <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
          <span>Generating AI-powered activity summary...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-3 text-red-400">
          <WarningIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      );
    }

    if (!selectedDay) {
      return (
        <div className="flex items-center gap-3 text-slate-400">
          <InfoIcon className="w-5 h-5" />
          <span>Select a day on the graph to see AI-generated details.</span>
        </div>
      );
    }

    if (selectedDay.count === 0) {
      return (
        <div className="flex items-center gap-3 text-slate-400">
          <InfoIcon className="w-5 h-5" />
          <span>No activity on this day.</span>
        </div>
      );
    }

    if (details) {
      return <p className="text-white leading-relaxed">{details}</p>;
    }
    
    return null;
  };
  
  const formattedDate = selectedDay
    ? new Date(selectedDay.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      })
    : 'Activity Details';
  
  const activityText = selectedDay ? `${selectedDay.count} activities` : 'No day selected';


  return (
    <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl border border-slate-700 min-h-[100px] flex flex-col justify-center">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-white">{formattedDate}</h3>
        <span className="text-sm bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">{activityText}</span>
      </div>
      <div className="text-base">
        {renderContent()}
      </div>
    </div>
  );
};
