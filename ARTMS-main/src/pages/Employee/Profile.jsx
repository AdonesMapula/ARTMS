import React from "react";

export default function EmployeeProfile() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E15B1D]">Preferences</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111A62] sm:text-3xl transition-colors">Employee Profile</h1>
          <p className="mt-1 text-sm text-slate-500">View and update your personal information.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600 font-medium">Personal Information</p>
        <div className="mt-4 flex flex-col gap-3 max-w-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">First Name</label>
            <input type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 outline-none" placeholder="Your first name" disabled />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Last Name</label>
            <input type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 outline-none" placeholder="Your last name" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
