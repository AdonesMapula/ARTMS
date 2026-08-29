import React from "react";

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E15B1D]">Human Resources</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl transition-colors">Employee Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome to your personal employee portal.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600 font-medium">Dashboard widgets and overview metrics will be displayed here.</p>
      </div>
    </div>
  );
}
