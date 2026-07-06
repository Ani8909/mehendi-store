import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import FloatingContact from "./FloatingContact";
import PageSwipeController from "./PageSwipeController";
import { useRouter } from "next/router";
import RecentActivityPopup from "./RecentActivityPopup";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const isAdminOrPartner = router.pathname.startsWith("/admin") || router.pathname.startsWith("/partner");

  return (
    <div className={`flex flex-col min-h-screen relative ${isAdminOrPartner ? "" : "pb-16 md:pb-0"}`}>
      {!isAdminOrPartner && <PageSwipeController />}
      <Navbar />
      <main className="flex-grow pt-16">
        {children}
      </main>
      {!isAdminOrPartner && <Footer />}
      {!isAdminOrPartner && <BottomNav />}
      {!isAdminOrPartner && <FloatingContact />}
    </div>
  );
}
