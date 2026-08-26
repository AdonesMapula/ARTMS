import React from 'react';
import { motion } from 'framer-motion';
import logo from "../../assets/Logo/ARTMS_LOGO_white.png";

export default function SplashScreen() {
  // Container variants (fades out and slides up slightly on exit)
  const containerVariants = {
    initial: { opacity: 1 },
    exit: { 
      opacity: 0, 
      y: -30, 
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
      } 
    },
  };

  // Logo/Text variants (entrance animation)
  const childVariants = {
    initial: { opacity: 0, scale: 0.85, y: 15 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1
      }
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060F5A] select-none overflow-hidden"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111A62]/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#F97316]/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#111A62]/40 blur-[80px] pointer-events-none" />
      
      {/* Animated Brand Container */}
      <motion.div variants={childVariants} className="relative z-10 flex flex-col items-center gap-10">
        
        {/* Animated Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring behind the logo */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -m-8 rounded-full bg-[#F97316]/10 blur-xl"
          />
          <img 
            src={logo} 
            alt="Accel4u ARTMS Logo" 
            className="h-24 w-auto object-contain drop-shadow-2xl relative z-10" 
          />
        </div>

        {/* Loading Indicator and Text */}
        <div className="flex flex-col items-center gap-5">
          {/* Animated loading bar */}
          <div className="relative h-1 w-56 overflow-hidden rounded-full bg-[#111A62]/80 shadow-inner">
            <motion.div 
              className="absolute inset-y-0 left-0 h-full rounded-full bg-[#F97316]"
              initial={{ width: "0%", x: "0%" }}
              animate={{ 
                width: ["0%", "40%", "100%", "10%"],
                x: ["0%", "50%", "100%", "900%"]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          </div>
          
          <motion.p 
            className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/50"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Initializing Environment
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
