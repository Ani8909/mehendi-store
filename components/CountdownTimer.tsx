import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock } from "react-icons/fi";

interface CountdownTimerProps {
  targetDate: string | Date;
  onExpire?: () => void;
  className?: string;
  theme?: "light" | "dark" | "pink";
}

export default function CountdownTimer({ targetDate, onExpire, className = "", theme = "pink" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (onExpire) onExpire();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!timeLeft) return null;

  if (isExpired) {
    return (
      <div className={`inline-flex items-center space-x-2 text-red-500 font-bold bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-red-200 shadow-sm ${className}`}>
        <FiClock className="animate-pulse" />
        <span>Offer Expired</span>
      </div>
    );
  }

  const themes = {
    light: "bg-white/90 text-gray-800 border-gray-100",
    dark: "bg-gray-900/90 text-white border-gray-700",
    pink: "bg-gradient-to-r from-pink-500/90 to-rose-500/90 text-white border-pink-400/50"
  };

  const blockThemes = {
    light: "bg-gray-100 text-[var(--color-primary)]",
    dark: "bg-gray-800 text-pink-400",
    pink: "bg-white/20 text-white backdrop-blur-sm"
  };

  const labelThemes = {
    light: "text-gray-500",
    dark: "text-gray-400",
    pink: "text-pink-100"
  };

  return (
    <div className={`inline-flex items-center p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-lg border backdrop-blur-md ${themes[theme]} ${className}`}>
      <div className="hidden sm:flex items-center justify-center bg-white/20 p-3 rounded-full mr-4 shadow-inner">
        <FiClock className="text-2xl animate-pulse" />
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <TimeBlock value={timeLeft.days} label="Days" blockTheme={blockThemes[theme]} labelTheme={labelThemes[theme]} />
        <span className="text-xl md:text-2xl font-bold opacity-50 mb-4">:</span>
        <TimeBlock value={timeLeft.hours} label="Hours" blockTheme={blockThemes[theme]} labelTheme={labelThemes[theme]} />
        <span className="text-xl md:text-2xl font-bold opacity-50 mb-4">:</span>
        <TimeBlock value={timeLeft.minutes} label="Mins" blockTheme={blockThemes[theme]} labelTheme={labelThemes[theme]} />
        <span className="text-xl md:text-2xl font-bold opacity-50 mb-4 animate-pulse">:</span>
        <TimeBlock value={timeLeft.seconds} label="Secs" blockTheme={blockThemes[theme]} labelTheme={labelThemes[theme]} />
      </div>
    </div>
  );
}

function TimeBlock({ value, label, blockTheme, labelTheme }: { value: number, label: string, blockTheme: string, labelTheme: string }) {
  return (
    <div className="flex flex-col items-center min-w-[50px] md:min-w-[60px]">
      <div className={`w-full flex items-center justify-center h-12 md:h-14 rounded-xl shadow-inner font-mono text-2xl md:text-3xl font-black tracking-tighter ${blockTheme} relative overflow-hidden`}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest mt-2 ${labelTheme}`}>
        {label}
      </span>
    </div>
  );
}
