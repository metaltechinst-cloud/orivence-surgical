// src/components/WelcomeScreen.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Stage 1: Draw lines & logo
    const t1 = setTimeout(() => setStep(1), 1000);
    // Stage 2: Fade in company text
    const t2 = setTimeout(() => setStep(2), 2200);
    // Stage 3: Smooth exit transition
    const t3 = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // SVG drawing animation presets
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white select-none overflow-hidden"
    >
      {/* Precision Drafting Grid background during intro */}
      <div className="absolute inset-0 drafting-grid opacity-30 pointer-events-none" />

      {/* Dynamic tech-drawing crosshairs in corners */}
      <div className="absolute top-10 left-10 w-16 h-16 border-t border-l border-zinc-300 opacity-50">
        <span className="absolute top-2 left-2 text-[9px] font-mono text-zinc-500">CAL_SYS_v0.1</span>
      </div>
      <div className="absolute top-10 right-10 w-16 h-16 border-t border-r border-zinc-300 opacity-50">
        <span className="absolute top-2 right-2 text-[9px] font-mono text-zinc-500">SYS_STATUS_OK</span>
      </div>
      <div className="absolute bottom-10 left-10 w-16 h-16 border-b border-l border-zinc-300 opacity-50">
        <span className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-500">LATENCY_0.4ms</span>
      </div>
      <div className="absolute bottom-10 right-10 w-16 h-16 border-b border-r border-zinc-300 opacity-50">
        <span className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-500">ISO_9001_CERT</span>
      </div>

      {/* Horizontal & Vertical absolute center drafting axes */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[1px] bg-zinc-400 top-1/2"
      />
      <motion.div 
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute top-0 bottom-0 w-[1px] bg-zinc-400 left-1/2"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Custom Surgical-Precision Logo */}
        <div className="w-28 h-28 relative flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full stroke-[#0b192c] fill-none"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            {/* Outer Precision Ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="opacity-25"
            />
            {/* Fine Calibration Tick Marks */}
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              strokeDasharray="2 6"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="opacity-40"
            />
            {/* Surgical Align Diamond */}
            <motion.polygon
              points="50,18 82,50 50,82 18,50"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="opacity-60"
            />
            {/* Central Vertical Sharp Blade Element */}
            <motion.line
              x1="50"
              y1="10"
              x2="50"
              y2="90"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
            />
            {/* Central Horizontal Axis */}
            <motion.line
              x1="10"
              y1="50"
              x2="90"
              y2="50"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="opacity-50"
            />
            {/* Angle Indicators */}
            <motion.path
              d="M 33 33 L 26 26 M 67 33 L 74 26 M 33 67 L 26 74 M 67 67 L 74 74"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="opacity-30"
            />
            {/* Laser Focal Dot */}
            {step >= 1 && (
              <motion.circle
                cx="50"
                cy="50"
                r="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="fill-[#0b192c]"
              />
            )}
          </svg>
        </div>

        {/* Brand Text Elements */}
        <div className="mt-8 text-center h-20">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.span
                key="welcome"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.6 }}
                className="text-xs md:text-sm tracking-[0.6em] text-zinc-500 font-mono uppercase font-light"
              >
                WELCOME TO
              </motion.span>
            )}

            {step >= 1 && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-xl md:text-2xl font-bold tracking-[0.45em] text-[#0b192c] uppercase font-display">
                  ORIVENCE
                </h1>
                <span className="text-[9px] md:text-[10px] tracking-[0.6em] text-zinc-500 uppercase mt-2 font-mono">
                  SURGICAL INSTRUMENTS
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Loading Percentage indicator in bottom right */}
      <div className="absolute bottom-10 right-10 flex items-center gap-2 font-mono text-[10px] text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>INITIALIZING: 100%</span>
      </div>
    </motion.div>
  );
}
