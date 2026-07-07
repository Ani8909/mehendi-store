import Link from "next/link";
import { useRouter } from "next/router";
import { FiUser, FiLogOut, FiSearch } from "react-icons/fi";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & passed header height
        setVisible(false);
      } else {
        // Scrolling up
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isLinkActive = (href: string) => {
    if (href === "/") return router.pathname === "/" || router.asPath === "/";
    return router.pathname.startsWith(href) || router.asPath.startsWith(href);
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Packages", href: "/packages" },
    { name: "Custom Package", href: "/custom-package" },
    { name: "Gallery", href: "/gallery" },
    { name: "Blog", href: "/blog" },
    { name: "Gift Cards", href: "/gift-cards" },
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
    <nav className={`bg-white/90 backdrop-blur-md fixed w-full z-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] top-0 transition-transform duration-300 border-b border-gray-100/80 ${
      visible ? "translate-y-0" : "-translate-y-full lg:translate-y-0"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 bg-white rounded-full p-0.5 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                <img src="/logo.png" alt="Jyoti Mehendi Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-wide flex items-baseline">
                <span className="text-[var(--color-header)]">Jyoti</span>
                <span className="text-[var(--color-primary)] ml-1 font-light text-[10px] sm:text-sm tracking-[0.2em] uppercase font-sans">
                  Mehendi
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu - Premium Minimalist Luxury */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`relative py-2 px-2.5 xl:px-3 text-[13px] xl:text-sm transition-colors whitespace-nowrap group flex items-center gap-1 ${
                    active ? "text-[var(--color-primary)] font-extrabold" : "text-gray-700 hover:text-[var(--color-primary)] font-semibold"
                  }`}
                >
                  {link.name === "Gift Cards" ? (
                    <span className="bg-gradient-to-r from-rose-500 via-pink-600 to-red-500 bg-clip-text text-transparent font-extrabold flex items-center gap-1">
                      <span>Gift Cards</span>
                      <span className="text-sm">💝</span>
                    </span>
                  ) : link.name === "Custom Package" ? (
                    <span className="bg-gradient-to-r from-[var(--color-primary)] to-pink-600 bg-clip-text text-transparent font-extrabold flex items-center gap-1">
                      <span>Custom</span>
                      <span className="text-xs">✨</span>
                    </span>
                  ) : (
                    <span>{link.name}</span>
                  )}

                  {/* Professional Animated Underline */}
                  <span 
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-[var(--color-primary)] via-pink-500 to-rose-400 rounded-full transition-all duration-300 ${
                      active ? "opacity-100 scale-x-100 shadow-[0_1px_6px_rgba(219,39,119,0.5)]" : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                    }`} 
                  />
                </Link>
              );
            })}
            <div className="flex items-center space-x-2 xl:space-x-3 ml-1 xl:ml-3 border-l border-gray-200 pl-2 xl:pl-4">
              <Link href="/verify" className="text-gray-500 hover:text-[var(--color-primary)] transition-colors p-2 flex items-center justify-center bg-gray-50 hover:bg-pink-50 rounded-full w-8 h-8 xl:w-9 xl:h-9 border border-gray-200/80 shadow-2xs shrink-0" title="Track Booking">
                <FiSearch size={16} />
              </Link>
              {!loading && user ? (
                <div className="flex items-center space-x-2.5 shrink-0">
                  <Link 
                    href={getDashboardHref()}
                    className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 text-white font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all ring-2 ring-pink-100"
                    title={`Dashboard (${displayName})`}
                  >
                    {displayName.charAt(0).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-all"
                    title="Sign Out"
                  >
                    <FiLogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="flex items-center space-x-1.5 text-gray-700 hover:text-[var(--color-primary)] font-semibold transition-colors text-sm shrink-0 whitespace-nowrap"
                >
                  <FiUser size={16} />
                  <span>Login</span>
                </Link>
              )}
              <Link 
                href="/booking"
                className="bg-gradient-to-r from-[var(--color-primary)] via-pink-700 to-[var(--color-header)] text-white px-4 xl:px-5 py-2 rounded-full font-bold text-xs tracking-wider uppercase hover:shadow-[0_8px_20px_rgba(219,39,119,0.35)] hover:-translate-y-0.5 transition-all duration-300 shadow-md shrink-0 whitespace-nowrap"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Mobile Top Bar Actions (No Hamburger - Pure Native App Feel!) */}
          <div className="flex items-center space-x-2 lg:hidden">
            {!loading && user ? (
              <Link 
                href={getDashboardHref()}
                className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-transform ring-2 ring-pink-100"
                title={`Dashboard (${displayName})`}
              >
                {displayName.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </Link>
            ) : (
              <Link 
                href="/login"
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[var(--color-primary)] font-extrabold text-xs shadow-2xs active:scale-95 transition-transform"
                title="Login / Account"
              >
                <FiUser size={13} />
                <span>Login</span>
              </Link>
            )}
            <Link 
              href="/verify" 
              className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200/80 text-gray-600 flex items-center justify-center active:scale-95 transition-transform" 
              title="Track Booking"
            >
              <FiSearch size={15} />
            </Link>
            <Link 
              href="/booking"
              className="bg-gradient-to-r from-[var(--color-primary)] to-pink-700 text-white px-3.5 py-1.5 rounded-full font-extrabold text-[11px] uppercase tracking-wider shadow-sm active:scale-95 transition-transform whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

