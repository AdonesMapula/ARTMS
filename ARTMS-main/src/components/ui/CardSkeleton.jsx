import React from "react";
import Skeleton from "./Skeleton";

export function CardSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/3 rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
            <Skeleton className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/40" />
          </div>
          <Skeleton className="h-8 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800/40" />
          <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800/40" />
        </div>
      ))}
    </div>
  );
}

export default CardSkeleton;
