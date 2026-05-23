import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiGift, FiX, FiTag } from "react-icons/fi";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CountdownTimer from "./CountdownTimer";
import Link from "next/link";

export default function FlashOfferWidget() {
  const [flashOffer, setFlashOffer] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem("flashOfferDismissed")) {
      setIsExpanded(false);
    }

    async function fetchFlashOffer() {
      try {
        const qCoupons = query(collection(db, "coupons"), where("isActive", "==", true), where("isFlashOffer", "==", true));
        const couponsSnap = await getDocs(qCoupons);
        const validFlashOffers = couponsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => c.expiresAt && new Date(c.expiresAt).getTime() > Date.now());
        
        if (validFlashOffers.length > 0) {
          validFlashOffers.sort((a: any, b: any) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
          setFlashOffer(validFlashOffers[0]);
        }
      } catch (error) {
        console.error("Error fetching flash offers", error);
      }
    }
    fetchFlashOffer();
  }, []);

  if (!flashOffer) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    sessionStorage.setItem("flashOfferDismissed", "true");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(flashOffer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed top-24 left-0 z-[100]">
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsExpanded(false)} 
              className="fixed inset-0 w-screen h-screen z-[-1]" 
            />
            <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-4 top-2 w-[320px] sm:w-[380px] bg-white/95 backdrop-blur-xl border border-pink-200 p-6 rounded-3xl shadow-[0_20px_50px_rgba(236,72,153,0.2)] overflow-hidden origin-top-left"
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-100/50 hover:bg-gray-200 p-1.5 rounded-full transition-colors z-10"
            >
              <FiX size={16} />
            </button>

            {/* Branding Header */}
            <div className="flex items-center justify-center mb-5 mt-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-pink-600 bg-pink-50/80 px-4 py-1.5 rounded-full border border-pink-100 shadow-sm flex items-center gap-2">
                <img src="/logo.png" alt="Jyoti Mehendi Logo" className="w-4 h-4 object-contain" />
                Jyoti Mehndi Exclusive
              </span>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-pink-100 text-[var(--color-primary)] p-2 rounded-xl">
                <FiTag size={16} />
              </div>
              <h3 className="font-black text-gray-800 text-sm leading-tight pr-6">
                {flashOffer.bannerText || `Special Offer: ${flashOffer.discountType === 'percent' ? flashOffer.discountAmount + '%' : '₹' + flashOffer.discountAmount} OFF`}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100 flex justify-center scale-90 origin-center -mx-2">
              <CountdownTimer 
                targetDate={flashOffer.expiresAt} 
                onExpire={() => setFlashOffer(null)} 
                theme="light"
                className="!p-2 shadow-none border-none bg-transparent"
              />
            </div>

            <div className="flex flex-col items-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Use Promo Code</p>
              <button 
                onClick={handleCopy}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-full py-2.5 rounded-xl text-center font-black tracking-widest shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                {copied ? "COPIED!" : flashOffer.code}
              </button>
              
              <Link 
                href={`/booking?coupon=${flashOffer.code}`}
                onClick={() => setIsExpanded(false)}
                className="mt-3 bg-black text-white w-full py-3 rounded-xl text-center font-bold text-sm shadow-lg hover:bg-gray-800 transition-colors uppercase tracking-wider"
              >
                Claim This Offer
              </Link>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            exit={{ x: -50 }}
            whileHover={{ scale: 1.05, x: 3 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className="absolute left-0 top-0 bg-gradient-to-r from-[var(--color-primary)] to-pink-500 text-white py-2 pl-1.5 pr-3 rounded-r-full shadow-[4px_0_15px_rgba(236,72,153,0.3)] flex items-center justify-center group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-300 rounded-r-full blur opacity-50 group-hover:opacity-80 transition duration-500"></div>
            <FiGift size={18} className="animate-pulse relative z-10" />
            
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
