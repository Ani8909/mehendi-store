import Link from "next/link";
import { useRouter } from "next/router";
import { FiHome, FiImage, FiUser, FiCalendar } from "react-icons/fi";
import { GiFlowers } from "react-icons/gi";

export default function BottomNav() {
  const router = useRouter();

  const navItems = [
    { name: "Home", href: "/", icon: FiHome },
    { name: "Gallery", href: "/gallery", icon: FiImage },
    { name: "Book", href: "/booking", icon: GiFlowers, special: true },
    { name: "Services", href: "/services", icon: FiCalendar },
    { name: "Profile", href: "/dashboard", icon: FiUser },
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;

          if (item.special) {
            return (
              <Link key={item.name} href={item.href} className="relative -top-5 flex flex-col items-center">
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-4 rounded-full shadow-lg text-white ring-4 ring-white">
                  <Icon size={28} />
                </div>
                <span className="text-xs font-medium text-[var(--color-header)] mt-1">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center p-2">
              <Icon 
                size={24} 
                className={`mb-1 transition-colors ${isActive ? "text-[var(--color-primary)]" : "text-gray-400"}`} 
              />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-[var(--color-primary)]" : "text-gray-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
