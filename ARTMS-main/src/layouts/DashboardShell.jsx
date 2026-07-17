import { Outlet } from "react-router-dom";
import { cn } from "../utils/cn";

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
          <main className={cn("p-4 sm:p-6 lg:p-8", contentClassName)}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

