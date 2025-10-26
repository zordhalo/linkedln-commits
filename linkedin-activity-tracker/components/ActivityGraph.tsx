
import React from 'react';
import type { Activity, DayData } from '../types';

interface ActivityGraphProps {
  data: Activity[];
  onDayClick: (day: DayData) => void;
  selectedDate: string | undefined;
}

const getColorLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

const colorClasses = [
  'bg-slate-700 hover:bg-slate-600', // level 0
  'bg-sky-900 hover:bg-sky-800',     // level 1
  'bg-sky-700 hover:bg-sky-600',     // level 2
  'bg-sky-500 hover:bg-sky-400',     // level 3
  'bg-sky-300 hover:bg-sky-200',     // level 4
];

const DayCell: React.FC<{ day: DayData | null; isSelected: boolean; onDayClick: (day: DayData) => void; }> = ({ day, isSelected, onDayClick }) => {
  if (!day) {
    return <div className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  }
  
  const level = day.level;
  const classes = `w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm cursor-pointer transition-all duration-150 ${colorClasses[level]} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`;
  
  return (
    <div className="group relative">
      <div 
        className={classes}
        onClick={() => onDayClick(day)}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 text-white text-xs rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
        {day.count} activities on {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'})}
      </div>
    </div>
  );
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ data, onDayClick, selectedDate }) => {
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setDate(today.getDate() - 364);
  
  const activityMap = new Map<string, number>();
  data.forEach(item => {
    activityMap.set(item.date, item.count);
  });
  
  const days: (DayData | null)[] = [];
  const firstDay = new Date(data.length > 0 ? data[0].date : yearAgo.toISOString().split('T')[0]);
  firstDay.setDate(firstDay.getDate() + 1); // Adjust for UTC
  const dayOfWeekOffset = firstDay.getUTCDay();

  for (let i = 0; i < dayOfWeekOffset; i++) {
    days.push(null);
  }

  for (const activity of data) {
    days.push({
      date: activity.date,
      count: activity.count,
      level: getColorLevel(activity.count)
    });
  }

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const renderMonthLabels = () => {
    const labels = [];
    let lastMonth = -1;
    if (data.length === 0) return null;
    
    for (let week = 0; week < 53; week++) {
      const dayIndex = week * 7 + (7 - dayOfWeekOffset);
      if (dayIndex >= data.length) continue;

      const date = new Date(data[dayIndex].date);
      date.setDate(date.getDate() + 1); // Adjust for UTC
      const month = date.getUTCMonth();

      if (month !== lastMonth) {
        labels.push(
          <div key={week} className="text-xs text-slate-400 absolute" style={{left: `${week * (16+4)}px`}}>
            {monthLabels[month]}
          </div>
        );
        lastMonth = month;
      }
    }
    return labels;
  };

  return (
    <div className="relative overflow-x-auto pb-4">
      <div className="relative h-6 mb-1" style={{ width: `${53 * 20}px`}}>
        {renderMonthLabels()}
      </div>
      <div className="flex gap-1.5">
        <div className="grid grid-rows-7 gap-1 text-xs text-slate-400 pr-2 shrink-0">
          <div className="h-3.5 sm:h-4 flex items-center">Mon</div>
          <div className="h-3.5 sm:h-4"></div>
          <div className="h-3.5 sm:h-4 flex items-center">Wed</div>
          <div className="h-3.5 sm:h-4"></div>
          <div className="h-3.5 sm:h-4 flex items-center">Fri</div>
          <div className="h-3.5 sm:h-4"></div>
          <div className="h-3.5 sm:h-4"></div>
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-1">
          {days.map((day, index) => (
            <DayCell 
              key={day ? day.date : `empty-${index}`} 
              day={day} 
              isSelected={day?.date === selectedDate}
              onDayClick={onDayClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
