import React from 'react';

export default function Loader() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative w-12 h-12">
        {/* Elegant Spin Ring (Primary color) */}
        <div className="absolute inset-0 rounded-full border-4 border-pink-100 border-t-[var(--color-primary)] animate-spin"></div>
        {/* Inner Amber Pulsing Glow Indicator */}
        <div className="absolute inset-1.5 rounded-full border-4 border-transparent border-t-amber-500 animate-pulse"></div>
      </div>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-[#fffcf9] z-[9999] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-6">
        {/* Pulsing Wreath Radial Halo */}
        <div className="absolute -inset-4 rounded-full bg-[var(--color-primary)]/10 animate-ping duration-1000"></div>
        {/* Circular Branding Logo Container */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full p-2.5 shadow-xl border border-pink-50 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Jyoti Mehendi Logo" 
            className="w-full h-full object-contain animate-pulse" 
          />
        </div>
      </div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--color-header)] tracking-wider">
        Jyoti Mehendi
      </h1>
      <div className="w-12 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-header)] rounded-full my-3 mx-auto animate-pulse"></div>
      <p className="text-gray-500 text-sm font-medium tracking-wide animate-pulse">
        Crafting Royalty in the City of Love...
      </p>
    </div>
  );
}

