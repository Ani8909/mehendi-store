import Link from "next/link";
import { FiInstagram, FiFacebook, FiPhone, FiMail, FiMapPin, FiClock } from "react-icons/fi";
import { FaYoutube, FaPinterest, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#FFF5F7] to-[#FCFAFA] text-gray-700 pt-16 pb-24 md:pb-12 border-t border-pink-100/80 relative overflow-hidden shadow-sm">
      {/* Decorative Subtle Rose Petal Background Accent */}
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-pink-100/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute left-0 top-0 w-60 h-60 bg-pink-50/40 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <div className="flex items-center space-x-3.5 flex-nowrap">
              <img 
                src="/favicon.png" 
                alt="Jyoti Mehendi Logo" 
                className="w-11 h-11 object-contain flex-shrink-0"
              />
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[var(--color-header)] tracking-wide whitespace-nowrap">
                Jyoti Mehendi
              </h3>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Agra's premier bridal & traditional henna artists. Crafting organic, deep-staining, and flawless mehendi art that adds royal charm to your auspicious celebrations since 2014.
            </p>
            {/* Elegant Social Icons */}
            <div className="flex space-x-3 pt-2">
              {[
                { icon: <FiInstagram size={18} />, href: "https://www.instagram.com/mehndi_artist__jyoti?igsh=M200NHNncnZjOWQz", label: "Instagram" },
                { icon: <FiFacebook size={18} />, href: "https://www.facebook.com/share/1AwpsjFKnh/", label: "Facebook" },
                { icon: <FaYoutube size={18} />, href: "https://youtube.com/@jyotimehndiartist-m9g?si=a_nUhTHsi0zv-4nX", label: "YouTube" },
                { icon: <FaPinterest size={18} />, href: "https://pin.it/2ZoiasFlN", label: "Pinterest" },
                { icon: <FaWhatsapp size={18} />, href: "https://wa.me/917906297942", label: "WhatsApp" },
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white border border-pink-100 flex items-center justify-center text-pink-600 hover:text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-300 hover:-translate-y-1 shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest border-b border-pink-100/50 pb-2">Navigation</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Home Portfolio", href: "/" },
                { name: "Our Services", href: "/services" },
                { name: "Design Gallery", href: "/gallery" },
                { name: "Luxury Packages", href: "/packages" },
                { name: "Special Offers", href: "/offers" },
                { name: "Book Appointment", href: "/booking" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-gray-500 hover:text-[var(--color-primary)] text-sm transition-all duration-300 flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-300 mr-2 group-hover:bg-[var(--color-primary)] group-hover:scale-125 transition-all"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Booking & Portals */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest border-b border-pink-100/50 pb-2">Portals</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Customer Dashboard", href: "/login" },
                { name: "Artist Partner Login", href: "/partner" },
                { name: "Agra Coverage Map", href: "/#packages" },
                { name: "Management Portal", href: "/login?mode=admin" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-gray-500 hover:text-[var(--color-primary)] text-sm transition-all duration-300 flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-200 mr-2 group-hover:bg-[var(--color-primary)] transition-all"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Contact Details */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-widest border-b border-pink-100/50 pb-2">Agra Studio</h4>
            <ul className="space-y-3.5">
              <li className="flex items-start space-x-3 text-gray-500 text-sm">
                <FiMapPin className="text-[var(--color-primary)] mt-1 flex-shrink-0" size={16} />
                <span>5 Pathwari Mandir, Behind Delhi Public School, <br />Shastripuram, Sikandra, Agra</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-500 text-sm">
                <FiPhone className="text-[var(--color-primary)] flex-shrink-0" size={16} />
                <a href="tel:+917906297942" className="hover:text-[var(--color-primary)] font-semibold transition-colors text-gray-700">+91 7906297942</a>
              </li>
              <li className="flex items-center space-x-3 text-gray-500 text-sm">
                <FiMail className="text-[var(--color-primary)] flex-shrink-0" size={16} />
                <a href="mailto:suport@jyotimehendi.in" className="hover:text-[var(--color-primary)] transition-colors text-gray-700">suport@jyotimehendi.in</a>
              </li>
              <li className="flex items-center space-x-3 text-gray-500 text-sm">
                <FiClock className="text-[var(--color-primary)] flex-shrink-0" size={16} />
                <span>Daily: 9:00 AM - 9:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Featured On */}
        <div className="mt-12 pt-10 pb-4 border-t border-pink-100/60 flex flex-col items-center justify-center relative z-10">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Also Featured & Verified On</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center px-4">
            <a href="#" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 transform hover:-translate-y-1">
              <div className="flex items-center">
                <span className="font-black text-2xl tracking-tighter text-[#FF6A00]">Just</span>
                <span className="font-black text-2xl tracking-tighter text-gray-800">dial</span>
              </div>
            </a>
            <a href="#" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 transform hover:-translate-y-1">
              <span className="font-bold text-2xl tracking-tight text-[#0A58A3] font-serif italic">Sulekha</span>
            </a>
            <a href="#" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 transform hover:-translate-y-1">
              <span className="font-bold text-2xl tracking-tight text-[#E72E77]">WedMeGood</span>
            </a>
            <a href="#" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 transform hover:-translate-y-1">
              <div className="flex items-center">
                <span className="font-bold text-2xl tracking-tight text-[#E43144]">Wedding</span>
                <span className="font-bold text-2xl tracking-tight text-gray-800">Wire</span>
              </div>
            </a>
            <a href="#" className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 transform hover:-translate-y-1">
              <span className="font-bold text-2xl tracking-tight text-[#5DB6A5] italic">Zankyou</span>
            </a>
          </div>
        </div>

        {/* Delicate Bottom Divider */}
        <div className="mt-6 pt-8 border-t border-pink-100/60 flex flex-col md:flex-row justify-between items-center relative z-10 text-xs md:text-sm text-gray-400">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Jyoti Mehendi Artist. Handcrafted in Agra with ❤️
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
            <Link href="/privacy" className="text-gray-500 hover:text-[var(--color-primary)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-[var(--color-primary)] transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
