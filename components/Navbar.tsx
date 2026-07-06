import Link from "next/link";
import { useRouter } from "next/router";
import { FiUser, FiLogOut, FiSearch } from "react-icons/fi";
import { useAuth } from "@/lib/authContext";

export default function Navbar() {
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();

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
    <nav className="bg-white/90 backdrop-blur-md fixed w-full z-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] top-0 transition-all border-b border-gray-100/80">
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
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-7">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              if (link.name === "Gift Cards") {
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 font-bold transition-all text-sm group whitespace-nowrap px-3 py-1.5 rounded-full ${
                      active
                        ? "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 font-extrabold border border-rose-300 ring-2 ring-rose-200 shadow-sm scale-105"
                        : "bg-gradient-to-r from-rose-500 via-pink-600 to-red-500 bg-clip-text text-transparent hover:scale-105"
                    }`}
                  >
                    <span>Gift Cards</span>
                    <span className="text-base group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-pulse">💝</span>
                  </Link>
                );
              }
              if (link.name === "Custom Package") {
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`inline-flex items-center gap-1 font-extrabold transition-all text-sm group whitespace-nowrap px-3 py-1.5 rounded-full ${
                      active
                        ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-900 border border-pink-300 ring-2 ring-pink-200 shadow-sm scale-105"
                        : "bg-gradient-to-r from-[var(--color-primary)] to-pink-600 bg-clip-text text-transparent hover:scale-105"
                    }`}
                  >
                    <span>Custom</span>
                    <span className="text-pink-500 text-sm animate-pulse">✨</span>
                  </Link>
                );
              }
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "text-[var(--color-primary)] font-extrabold bg-pink-50/90 shadow-2xs border border-pink-200/80 scale-105"
                      : "text-gray-700 hover:text-[var(--color-primary)] hover:bg-gray-50/80"
                  }`}
                >
                  {link.name}
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>}
                </Link>
              );
            })}
            <div className="flex items-center space-x-3 lg:space-x-4 ml-2 lg:ml-4 border-l border-gray-200 pl-3 lg:pl-5">
              <Link href="/verify" className="text-gray-500 hover:text-[var(--color-primary)] transition-colors p-2 flex items-center justify-center bg-gray-50 hover:bg-pink-50 rounded-full w-9 h-9 border border-gray-200/80 shadow-2xs shrink-0" title="Track Booking">
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
                className="bg-gradient-to-r from-[var(--color-primary)] via-pink-700 to-[var(--color-header)] text-white px-5 lg:px-6 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase hover:shadow-[0_8px_20px_rgba(219,39,119,0.35)] hover:-translate-y-0.5 transition-all duration-300 shadow-md shrink-0 whitespace-nowrap"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Mobile Top Bar Actions (No Hamburger - Pure Native App Feel!) */}
          <div className="flex items-center space-x-2.5 md:hidden">
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

