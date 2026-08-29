import React from "react";

export default function EmployeeRequirements() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E15B1D]">Onboarding</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl transition-colors">My Requirements</h1>
          <p className="mt-1 text-sm text-slate-500">Submit and manage your post-hire documentation.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600 font-medium">Please submit your post-hire requirements here.</p>
        <div className="mt-4 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-slate-500 transition-colors hover:border-[#111A62]/30 hover:bg-[#111A62]/5">
          Upload Documents UI goes here...
        </div>
      </div>
    </div>
  );
}
