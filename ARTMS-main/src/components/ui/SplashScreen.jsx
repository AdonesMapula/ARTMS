import React from 'react';
import logo from "../../assets/Logo/ARTMS_LOGO.png";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500">
      <div className="flex flex-col items-center gap-10 animate-fade-in">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Accel4u ARTMS Logo" 
          className="h-20 w-auto object-contain drop-shadow-sm" 
        />
        
        {/* Minimalist loading line */}
        <div className="relative h-[3px] w-56 overflow-hidden rounded-full bg-slate-100 shadow-inner">
          <div className="absolute inset-y-0 left-0 h-full w-1/3 rounded-full bg-[#111A62] animate-indeterminate drop-shadow-sm"></div>
        </div>
        
        {/* Subtle Loading Text */}
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mt-2">
          Initializing Workspace
        </p>
      </div>
    </div>
  );
}
