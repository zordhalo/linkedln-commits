
import React, { useState, useCallback, useEffect } from 'react';
import type { Activity, DayData } from './types';
import { UserSelector } from './components/UserSelector';
import { ActivityGraph } from './components/ActivityGraph';
import { DetailPanel } from './components/DetailPanel';
import { getActivityDetails } from './services/geminiService';
import { LinkedInIcon } from './components/icons';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>('Alex Doe');
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [dayDetails, setDayDetails] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateData = useCallback((name: string) => {
    const today = new Date();
    const data: Activity[] = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayOfWeek = date.getDay();
      let activityCount = 0;
      // Simulate lower activity on weekends
      if (dayOfWeek > 0 && dayOfWeek < 6) { 
        activityCount = Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : 0;
      } else {
        activityCount = Math.random() > 0.8 ? Math.floor(Math.random() * 4) : 0;
      }

      data.push({
        date: date.toISOString().split('T')[0],
        count: activityCount,
      });
    }
    setActivityData(data.reverse());
    setSelectedDay(null);
    setDayDetails(null);
    setError(null);
  }, []);

  useEffect(() => {
    generateData(userName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserChange = (newName: string) => {
    setUserName(newName);
    generateData(newName);
  };

  const handleDayClick = useCallback(async (day: DayData | null) => {
    if (!day || day.count === 0) {
      setSelectedDay(day);
      setDayDetails(null);
      return;
    }
    if (selectedDay?.date === day.date) return;

    setSelectedDay(day);
    setIsLoadingDetails(true);
    setError(null);
    setDayDetails(null);

    try {
      const details = await getActivityDetails(userName, day.date, day.count);
      setDayDetails(details);
    } catch (err) {
      console.error(err);
      setError('Could not fetch activity details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [userName, selectedDay]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="flex items-center gap-4 mb-6">
          <LinkedInIcon className="w-10 h-10 text-sky-400" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">LinkedIn Activity Tracker</h1>
            <p className="text-slate-400">Visualizing professional engagement over the last year.</p>
          </div>
        </header>

        <main className="space-y-8">
          <UserSelector
            initialName={userName}
            onUserChange={handleUserChange}
          />
          <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl border border-slate-700">
             <h2 className="text-lg font-semibold mb-4 text-white">{activityData.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()} activities in the last year</h2>
            <ActivityGraph 
              data={activityData} 
              onDayClick={handleDayClick}
              selectedDate={selectedDay?.date}
            />
            <div className="flex justify-end items-center mt-2 gap-2 text-xs text-slate-500">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
              <div className="w-3 h-3 rounded-sm bg-sky-900"></div>
              <div className="w-3 h-3 rounded-sm bg-sky-700"></div>
              <div className="w-3 h-3 rounded-sm bg-sky-500"></div>
              <div className="w-3 h-3 rounded-sm bg-sky-300"></div>
              <span>More</span>
            </div>
          </div>

          <DetailPanel 
            selectedDay={selectedDay}
            details={dayDetails}
            isLoading={isLoadingDetails}
            error={error}
          />
        </main>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>Generated for {userName} &copy; {new Date().getFullYear()} LinkedIn Activity Tracker</p>
          <p className="mt-1">This is a concept application. Data is simulated for demonstration purposes.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
