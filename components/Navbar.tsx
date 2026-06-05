import Link from "next/link";
import { FiMenu, FiX, FiUser, FiLogOut, FiSearch } from "react-icons/fi";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userData, loading, signOut } = useAuth();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Packages", href: "/packages" },
    { name: "Gallery", href: "/gallery" },
    { name: "Blog", href: "/blog" },
  ];

  // Determine the correct dashboard link for the logged in user role
  const getDashboardHref = () => {
    if (!userData) return "/dashboard";
    if (userData.role === "admin") return "/admin";
    if (userData.role === "partner") return "/partner";
    return "/dashboard";
  };

  const displayName = userData?.name || user?.email?.split("@")[0] || user?.phoneNumber || "My Profile";

  return (
    <nav className="bg-white/80 backdrop-blur-md fixed w-full z-50 shadow-sm top-0 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 bg-white rounded-full p-0.5 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                <img src="/logo.png" alt="Jyoti Mehendi Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide flex items-baseline">
                <span className="text-[var(--color-header)]">Jyoti</span>
                <span className="text-[var(--color-primary)] ml-1.5 font-light text-xs sm:text-sm tracking-[0.2em] uppercase font-sans">
                  Mehendi
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-[var(--color-foreground)] hover:text-[var(--color-primary)] font-semibold transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center space-x-4 ml-4 border-l border-gray-200 pl-6">
              <Link href="/verify" className="text-gray-500 hover:text-[var(--color-primary)] transition-colors p-1 flex items-center justify-center bg-gray-50 rounded-full w-9 h-9 border border-gray-200" title="Track Booking">
                <FiSearch size={18} />
              </Link>
              {!loading && user ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    href={getDashboardHref()}
                    className="flex items-center space-x-2 text-[var(--color-primary)] font-semibold hover:text-[var(--color-header)] transition-colors"
                  >
                    <FiUser size={18} />
                    <span className="max-w-[120px] truncate" title={displayName}>{displayName}</span>
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Sign Out"
                  >
                    <FiLogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="flex items-center space-x-2 text-gray-600 hover:text-[var(--color-primary)] font-medium transition-colors"
                >
                  <FiUser size={18} />
                  <span>Login</span>
                </Link>
              )}
              <Link 
                href="/booking"
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-header)] text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg hover:shadow-[var(--color-primary)]/30 hover:-translate-y-0.5 transition-all shadow-md"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-[var(--color-foreground)] hover:text-[var(--color-primary)] focus:outline-none"
            >
              {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-background)]"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-2">
              <Link
                href="/verify"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[var(--color-primary)] hover:bg-[var(--color-background)] flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <FiSearch size={18} /> Track Booking
              </Link>
              {!loading && user ? (
                <>
                  <Link
                    href={getDashboardHref()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-[var(--color-primary)] hover:bg-pink-50"
                    onClick={() => setIsOpen(false)}
                  >
                    👤 {displayName} (Dashboard)
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[var(--color-primary)] hover:bg-[var(--color-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  Login / Profile
                </Link>
              )}
              <Link
                href="/booking"
                className="block text-center px-3 py-3 rounded-full text-base font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-header)] transition-colors shadow-md mx-2"
                onClick={() => setIsOpen(false)}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
