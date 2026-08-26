import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../utils/cn";
import { Skeleton } from "../components/ui/skeleton";

function PageFallbackLoader() {
  return (
    <div className="flex flex-col space-y-6 w-full animate-in fade-in duration-500 delay-150 fill-mode-both">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl hidden md:block" />
        <Skeleton className="h-32 rounded-2xl hidden md:block" />
        <Skeleton className="h-32 rounded-2xl hidden lg:block" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-3xl" />
    </div>
  );
}

export default function DashboardShell({
  sidebar,
  topbar,
  className,
  contentClassName,
}) {
  return (
    <div className={cn("min-h-screen bg-[var(--artms-soft)]", className)}>
      <div className="flex min-h-screen w-full">
        {sidebar}
        <div className="min-w-0 flex-1">
          {topbar}
          <main className={cn("p-4 pt-6 sm:p-6 sm:pt-8 lg:p-8 lg:pt-10", contentClassName)}>
            <Suspense fallback={<PageFallbackLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

