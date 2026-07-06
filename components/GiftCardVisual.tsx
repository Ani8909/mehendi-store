import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { FiStar, FiHeart } from "react-icons/fi";

export interface GiftCardVisualProps {
  receiverName?: string;
  senderName?: string;
  message?: string;
  amount?: number | string;
  interactive?: boolean;
}

export default function GiftCardVisual({ 
  receiverName = "Sneha (Bride-to-be)", 
  senderName = "Rahul (Brother)", 
  message = "Wishing you a lifetime of happiness! May the color of your bridal henna be the deepest and darkest.", 
  amount = 2100, 
  interactive = true 
}: GiftCardVisualProps) {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      size: Math.random() * 8 + 6,
      delay: Math.random() * 2,
    }));
    setSparkles(generated);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative w-full aspect-[1.6/1] perspective-1000 group max-w-lg mx-auto">
      {/* Ambient Outer Glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-pink-400/30 via-rose-400/30 to-amber-300/20 rounded-[2.5rem] blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Floating Sparkles around the card */}
      {interactive && sparkles.map((sp) => (
        <motion.div
          key={sp.id}
          className={sp.id % 2 === 0 ? "absolute text-rose-500/60 pointer-events-none z-30" : "absolute text-[#db2777]/50 pointer-events-none z-30"}
          style={{
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            width: sp.size,
            height: sp.size,
          }}
          animate={{
            y: [0, -35 - Math.random() * 30],
            opacity: [0, 0.7, 0],
            scale: [0.6, 1.2, 0.6],
            rotate: [0, 120],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: sp.delay,
            ease: "easeInOut",
          }}
        >
          {sp.id % 2 === 0 ? (
            <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
              <path d="M12 0l3.09 9 9 3.09-9 3.09-3.09 9-3.09-9-9-3.09 9-3.09z" />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Main Premium Card */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={interactive ? {
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        } : {}}
        animate={interactive ? {
          y: [0, -6, 0],
        } : {}}
        transition={interactive ? {
          y: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }
        } : {}}
        className="w-full h-full bg-gradient-to-br from-[#FAF5F6] via-[#FCEDF2] to-[#E5D1D6] rounded-[2rem] p-5 sm:p-6 text-[#5c1c3f] shadow-2xl relative overflow-hidden border border-[#db2777]/40 select-none flex flex-col justify-between"
      >
        {/* Shimmer Sweep Animation Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none z-10"
          initial={{ x: "-150%" }}
          animate={interactive ? {
            x: ["-150%", "200%"],
          } : {}}
          transition={interactive ? {
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 3.5,
              ease: "easeInOut",
              delay: 1,
            }
          } : {}}
        />
        {/* Chasing Light Glowing Border */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[2rem] z-20" viewBox="0 0 400 250" preserveAspectRatio="none">
          <defs>
            <linearGradient id="border-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#db2777" stopOpacity="1" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#bd1a6f" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Chasing Glow Dash */}
          <motion.rect
            x="1"
            y="1"
            width="398"
            height="248"
            rx="30"
            fill="none"
            stroke="url(#border-glow-gradient)"
            strokeWidth="2.5"
            strokeDasharray="150 1090"
            animate={{
              strokeDashoffset: [0, -1240],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Faded Golden Background Trail Line */}
          <rect
            x="1"
            y="1"
            width="398"
            height="248"
            rx="30"
            fill="none"
            stroke="#db2777"
            strokeWidth="0.75"
            className="opacity-20"
          />
        </svg>

        {/* Detailed Concentric Henna Heart SVG Overlay with Heartbeat Pulse */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[20%] w-64 sm:w-72 h-64 sm:h-72 pointer-events-none select-none">
          <svg className="w-full h-full stroke-[#db2777]/30 stroke-[0.75]" viewBox="0 0 100 100">
            {/* Pulsing Solid Heart - Styled as a rich dark pink fill */}
            <motion.path 
              d="M50,85 C20,60 5,45 5,28 C5,15 15,5 28,5 C37,5 45,10 50,17 C55,10 63,5 72,5 C85,5 95,15 95,28 C95,45 80,60 50,85 Z" 
              style={{ fill: "#db2777", transformOrigin: "50px 35px" }} 
              animate={{
                scale: [1, 1.05, 0.98, 1.08, 1],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="opacity-[0.65] stroke-none" 
            />
            <path d="M50,75 C25,53 12,41 12,28 C12,18 20,10 30,10 C38,10 45,15 50,21 C55,15 62,10 70,10 C80,10 88,18 88,28 C88,41 75,53 50,75 Z" fill="none" className="stroke-dashed stroke-[0.5] stroke-[#db2777]/40" />
            <path d="M50,65 C30,46 20,36 20,28 C20,21 25,16 32,16 C38,16 44,20 48,25 L50,27 L52,25 C56,20 62,16 68,16 C75,16 80,21 80,28 C80,36 70,46 50,65 Z" fill="none" className="stroke-[0.5] stroke-[#db2777]/35" />
          </svg>
        </div>

        {/* Outer Frame Border (Elegant Golden Filigree Lines) */}
        <div className="absolute inset-2.5 border border-[#db2777]/30 rounded-[1.6rem] pointer-events-none" />

        {/* Decorative Golden Rosettes in Corners */}
        <div className="absolute top-[13px] left-[13px] w-1.5 h-1.5 bg-[#db2777]/65 rounded-full pointer-events-none" />
        <div className="absolute top-[13px] right-[13px] w-1.5 h-1.5 bg-[#db2777]/65 rounded-full pointer-events-none" />
        <div className="absolute bottom-[13px] left-[13px] w-1.5 h-1.5 bg-[#db2777]/65 rounded-full pointer-events-none" />
        <div className="absolute bottom-[13px] right-[13px] w-1.5 h-1.5 bg-[#db2777]/65 rounded-full pointer-events-none" />

        {/* Logo/Details Header */}
        <div className="flex justify-between items-center z-10 pl-1 pr-1" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-[#d4af37]/35 shadow-sm bg-white overflow-hidden flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Jyoti Mehendi Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h4 className="font-serif font-black text-xs tracking-[0.15em] bg-gradient-to-r from-[#5c1c3f] to-[#802254] bg-clip-text text-transparent flex items-center gap-0.5">
                <FiStar className="text-[#d4af37] text-[10px] animate-pulse" />
                Jyoti Mehendi
              </h4>
              <p className="text-[5.5px] uppercase tracking-[0.25em] text-[#7a4857]/60 font-serif font-bold mt-0.5">Agra's Premium Artist</p>
            </div>
          </div>
          <div className="bg-[#fefaf0] border border-[#d4af37]/45 text-[#8a5d13] px-2.5 py-0.5 rounded text-[8px] font-serif font-bold uppercase tracking-[0.2em] shadow-sm">
            Voucher
          </div>
        </div>

        {/* Recipient Details & Message Block */}
        <div className="space-y-2 z-10 pl-1 pr-1" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-[7.5px] uppercase tracking-widest text-[#7a4857] font-semibold">To:</span>
            <span className="font-love text-lg sm:text-xl text-[#5c1c3f] tracking-wide flex items-center gap-0.5 relative top-1 font-bold">
              {receiverName}
              <FiHeart className="text-rose-500 text-[10px] fill-rose-500/20 animate-pulse ml-0.5" />
            </span>
          </div>
          
          {/* Glassmorphic Greeting Bubble */}
          <div className="bg-white/70 backdrop-blur-md border border-white/90 p-2 sm:p-2.5 rounded-xl shadow-[0_4px_20px_rgba(92,28,63,0.05)] max-w-full relative overflow-hidden">
            <p className="text-[9px] text-[#4d1f2e] line-clamp-2 h-6 leading-relaxed italic font-serif pl-3">
              <span className="text-[#db2777]/40 font-serif text-sm absolute left-1 top-0.5">“</span>
              {message}
              <span className="text-[#db2777]/40 font-serif text-sm">”</span>
            </p>
          </div>
          
          <div className="flex items-baseline gap-1.5 text-[7.5px] text-[#7a4857] font-serif font-semibold">
            <span>From:</span>
            <span className="font-love text-base sm:text-lg text-[#5c1c3f] tracking-wide flex items-center gap-0.5 relative top-0.5 font-bold">
              {senderName}
              <FiHeart className="text-rose-500 text-[10px] fill-rose-500 animate-pulse ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex justify-between items-end z-10 pl-1 pr-1" style={{ transform: "translateZ(40px)" }}>
          <p className="text-[5.5px] font-serif tracking-[0.2em] text-[#7a4857]/50 font-bold uppercase">VALID FOR 1 YEAR • AGRA</p>
          <div className="flex flex-col items-end">
            <span className="text-[5.5px] text-[#7a4857]/50 uppercase tracking-[0.2em] font-serif font-bold">Value</span>
            <span className="text-lg sm:text-xl font-black font-serif tracking-tight bg-gradient-to-r from-[#5c1c3f] via-[#a22f60] to-[#bd1a6f] bg-clip-text text-transparent">
              ₹{amount}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
