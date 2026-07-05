import React from 'react';

interface SessionInfoPanelProps {
  sessionTitle: string;
  sessionCourse: string | null;
  hostName: string;
  startTime: string | null;
  estimatedEndTime: string;
}

export const SessionInfoPanel = ({
  sessionTitle,
  sessionCourse,
  hostName,
  startTime,
  estimatedEndTime
}: SessionInfoPanelProps) => {
  const formatTimeStr = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="w-full max-w-xl text-center space-y-2 select-none shrink-0 mb-4 bg-white/40 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200/10 backdrop-blur-sm shadow-sm">
      <h2 className="text-xl font-extrabold text-gray-800 dark:text-white leading-tight">
        {sessionTitle}
      </h2>
      
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-555 font-bold uppercase tracking-wider">Course:</span>
          <span className="text-gray-700 dark:text-gray-200">{sessionCourse || 'General'}</span>
        </div>
        <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-555 font-bold uppercase tracking-wider">Host:</span>
          <span className="text-gray-700 dark:text-gray-200">{hostName || 'Anonymous'}</span>
        </div>
        <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-555 font-bold uppercase tracking-wider">Start:</span>
          <span className="text-gray-700 dark:text-gray-200">{formatTimeStr(startTime)}</span>
        </div>
        <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-555 font-bold uppercase tracking-wider">Est. End:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{estimatedEndTime}</span>
        </div>
      </div>
    </div>
  );
};
