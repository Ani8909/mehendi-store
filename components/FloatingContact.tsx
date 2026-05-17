import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaPhone, FaInstagram, FaFacebookF, FaPinterest, FaYoutube } from "react-icons/fa";
import { FiMessageCircle, FiX } from "react-icons/fi";

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configuration
  const phone = "7906297942";
  const whatsappMessage = encodeURIComponent("Hi Jyoti Mehendi! I would like to know more about your services.");

  const contacts = [
    {
      name: "Instagram",
      icon: <FaInstagram size={20} />,
      color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]",
      href: "https://www.instagram.com/mehndi_artist__jyoti?igsh=M200NHNncnZjOWQz",
      delay: 0.1,
    },
    {
      name: "Facebook",
      icon: <FaFacebookF size={18} />,
      color: "bg-[#1877F2]",
      href: "https://www.facebook.com/share/1AwpsjFKnh/",
      delay: 0.2,
    },
    {
      name: "Pinterest",
      icon: <FaPinterest size={20} />,
      color: "bg-[#BD081C]",
      href: "https://pin.it/2ZoiasFlN",
      delay: 0.3,
    },
    {
      name: "YouTube",
      icon: <FaYoutube size={20} />,
      color: "bg-[#FF0000]",
      href: "https://youtube.com/@jyotimehndiartist-m9g?si=a_nUhTHsi0zv-4nX",
      delay: 0.4,
    },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed bottom-24 md:bottom-10 right-6 z-[100] flex flex-col items-center space-y-4">
      {/* Standalone WhatsApp Button - Always Visible */}
      <motion.a
        href={`https://wa.me/91${phone}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.3)] border-2 border-white flex items-center justify-center relative group overflow-hidden"
        aria-label="WhatsApp Us"
      >
        <FaWhatsapp size={24} className="animate-[whatsapp-bounce_2s_infinite]" />
        <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/20">
          WhatsApp: +91 {phone}
        </span>
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full"></div>
      </motion.a>

      {/* Standalone Call Button - Always Visible */}
      <motion.a
        href={`tel:+91${phone}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-green-500 text-white p-4 rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.3)] border-2 border-white flex items-center justify-center relative group overflow-hidden"
        aria-label="Call Now"
      >
        <FaPhone size={24} className="animate-[wiggle_1.2s_ease-in-out_infinite]" />
        <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/20">
          Call Now: +91 {phone}
        </span>
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full"></div>
      </motion.a>

      {/* Social Media Expandable Menu */}
      <div className="flex flex-col items-center">
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col-reverse items-center space-y-reverse space-y-4 mb-4">
              {contacts.map((contact, index) => (
                <motion.a
                  key={contact.name}
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.5 }}
                  transition={{ duration: 0.2, delay: contact.delay }}
                  className={`${contact.color} text-white p-3.5 rounded-full shadow-xl hover:scale-110 transition-transform relative group`}
                  aria-label={contact.name}
                >
                  {contact.icon}
                  <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {contact.name}
                  </span>
                </motion.a>
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`${isOpen ? 'bg-gray-800 border-gray-700' : 'bg-[var(--color-primary)] border-white'} text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-colors border-2`}
        >
          {isOpen ? <FiX size={28} /> : <FiMessageCircle size={28} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
          )}
        </motion.button>
      </div>

      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes whatsapp-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
