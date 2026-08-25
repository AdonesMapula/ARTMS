import React from "react";
import Skeleton from "./Skeleton";

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4 py-4 w-full">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 px-2">
        <Skeleton className="h-10 flex-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
      </div>
      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-16 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
        </div>
      ))}
    </div>
  );
}

export default TableSkeleton;
