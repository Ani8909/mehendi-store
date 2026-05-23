import { motion } from "framer-motion";

export function PageTransitionLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
        {/* Pulsing rings */}
        <motion.div 
          animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-4 border-pink-300 rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1.5], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 border-4 border-[var(--color-primary)] rounded-full"
        />
        
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-xl p-1 z-10 flex items-center justify-center border-2 border-pink-100"
        >
          <img src="/logo.png" alt="Jyoti Mehendi Loading..." className="w-full h-full object-contain" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export const FullScreenLoader = PageTransitionLoader;
export default PageTransitionLoader;

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <Skeleton className="h-56 w-full" />
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 rounded-full mb-4" />
        <Skeleton className="h-4 w-full rounded-full mb-2" />
        <Skeleton className="h-4 w-5/6 rounded-full mb-6" />
        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGallery({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`relative bg-gray-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-sm ${className}`}>
      {/* Faint logo watermark in the center to show brand while loading */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <img src="/logo.png" alt="" className="w-32 h-32 grayscale" />
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function SkeletonReview() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div>
          <Skeleton className="h-5 w-32 rounded-full mb-2" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded-full mb-2" />
      <Skeleton className="h-4 w-5/6 rounded-full" />
    </div>
  );
}
