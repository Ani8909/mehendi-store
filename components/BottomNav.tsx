import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiHome, FiImage, FiUser, FiTag, FiGrid, FiX, FiCalendar, FiFileText, FiGift, FiSearch, FiLogOut, FiCheckCircle, FiHeart } from "react-icons/fi";
import { GiFlowers } from "react-icons/gi";
import { useAuth } from "@/lib/authContext";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomNav() {
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const [showMenuModal, setShowMenuModal] = useState(false);

  const getProfileHref = () => {
    if (!user) return "/login";
    if (userData?.role === "admin") return "/admin";
    if (userData?.role === "partner") return "/partner";
    return "/dashboard";
  };

  const navItems = [
    { name: "Home", href: "/", icon: FiHome, isAction: false },
    { name: "Packages", href: "/packages", icon: FiTag, isAction: false },
    { name: "Custom ✨", href: "/custom-package", icon: GiFlowers, special: true, isAction: false },
    { name: "Services", href: "/services", icon: FiCalendar, isAction: false },
    { name: "Menu", href: "#", icon: FiGrid, isAction: true },
  ];

  const allPages = [
    { name: "Services", href: "/services", icon: FiCalendar, desc: "Bridal & Guest Mehendi", color: "bg-pink-50 text-pink-700 border-pink-200/60" },
    { name: "Packages", href: "/packages", icon: FiTag, desc: "All Pricing Bundles", color: "bg-purple-50 text-purple-700 border-purple-200/60" },
    { name: "Custom ✨", href: "/custom-package", icon: GiFlowers, desc: "Tailored Package Creator", color: "bg-rose-50 text-rose-700 border-rose-200 font-bold" },
    { name: "Gallery", href: "/gallery", icon: FiImage, desc: "Design Portfolio", color: "bg-amber-50 text-amber-700 border-amber-200/60" },
    { name: "Blog & Tips", href: "/blog", icon: FiFileText, desc: "Mehendi Care & Trends", color: "bg-blue-50 text-blue-700 border-blue-200/60" },
    { name: "Gift Cards 💝", href: "/gift-cards", icon: FiHeart, desc: "Love E-Gift Vouchers", color: "bg-gradient-to-br from-rose-50 via-pink-100 to-red-50 text-rose-700 border-rose-300 shadow-sm font-extrabold animate-pulse" },
    { name: "Track Order", href: "/verify", icon: FiSearch, desc: "Check Booking Status", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
    { name: "Book Now", href: "/booking", icon: FiCalendar, desc: "Schedule Appointment", color: "bg-red-50 text-red-700 border-red-200/60" },
    { name: user ? "My Dashboard" : "Login / Account", href: getProfileHref(), icon: FiUser, desc: user ? "Orders & Profile" : "Login or Register", color: "bg-indigo-50 text-indigo-700 border-indigo-200/60" },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] z-50 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href && !showMenuModal;
            const Icon = item.icon;

            if (item.special) {
              return (
                <Link key={item.name} href={item.href} className="relative -top-4 flex flex-col items-center group">
                  <div className="bg-gradient-to-r from-[var(--color-primary)] to-pink-600 p-3.5 rounded-full shadow-lg shadow-pink-500/40 text-white ring-4 ring-white group-active:scale-95 transition-all duration-300 flex items-center justify-center">
                    <Icon size={26} />
                  </div>
                  <span className="text-[10px] font-black text-[var(--color-primary)] mt-1 tracking-tight">{item.name}</span>
                </Link>
              );
            }

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowMenuModal(true)}
                  className="flex flex-col items-center p-2 flex-1 group focus:outline-none"
                >
                  <Icon 
                    size={22} 
                    className={`mb-1 transition-all duration-300 group-active:scale-90 ${showMenuModal ? "text-[var(--color-primary)] scale-110 stroke-[2.5]" : "text-gray-400 stroke-[1.75]"}`} 
                  />
                  <span className={`text-[10px] tracking-tight transition-colors duration-300 ${showMenuModal ? "text-[var(--color-primary)] font-extrabold" : "text-gray-500 font-medium"}`}>
                    {item.name}
                  </span>
                </button>
              );
            }

            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center p-2 flex-1 group" onClick={() => setShowMenuModal(false)}>
                <Icon 
                  size={22} 
                  className={`mb-1 transition-all duration-300 group-active:scale-90 ${isActive ? "text-[var(--color-primary)] scale-110 stroke-[2.5]" : "text-gray-400 stroke-[1.75]"}`} 
                />
                <span className={`text-[10px] tracking-tight transition-colors duration-300 ${isActive ? "text-[var(--color-primary)] font-extrabold" : "text-gray-500 font-medium"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile App Bottom Sheet Modal (Explore All Pages) with Swipe Down to Dismiss */}
      <AnimatePresence>
        {showMenuModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
          >
            <div 
              className="absolute inset-0" 
              onClick={() => setShowMenuModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 600 }}
              dragElastic={0.25}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) {
                  setShowMenuModal(false);
                }
              }}
              className="relative w-full bg-white rounded-t-[2.5rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto border-t border-pink-100 touch-pan-y"
            >
              {/* Drag Handle (Visual Swipe Hint) */}
              <div className="w-14 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing"></div>

              {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <span className="bg-pink-100 text-[var(--color-primary)] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Quick Navigation ✨
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900 mt-1">Explore Jyoti Mehendi</h3>
              </div>
              <button 
                onClick={() => setShowMenuModal(false)} 
                className="p-2.5 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full active:scale-95 transition-transform"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Grid of All Page Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {allPages.map((page, index) => {
                const PageIcon = page.icon;
                return (
                  <Link
                    key={index}
                    href={page.href}
                    onClick={() => setShowMenuModal(false)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between items-start shadow-2xs active:scale-95 ${page.color}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/80 shadow-xs flex items-center justify-center mb-3">
                      <PageIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-tight">{page.name}</h4>
                      <p className="text-[10px] opacity-80 mt-0.5 font-medium leading-tight">{page.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer / Account Status */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 flex items-center justify-between mb-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[180px]">
                      {userData?.name || user.email || "Logged In"}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <FiCheckCircle size={10} /> Active Account
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">New to Jyoti Mehendi?</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Login to track bookings and custom quotes</p>
                </div>
              )}

              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setShowMenuModal(false);
                  }}
                  className="px-3.5 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <FiLogOut size={13} />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 transition-opacity active:scale-95"
                >
                  Login Now
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
