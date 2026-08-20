import React from 'react';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin" />
        </div>
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase animate-pulse">
          Loading module...
        </span>
      </div>
    </div>
  );
}
