import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Playfair_Display, Poppins } from "next/font/google";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/lib/authContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PageTransitionLoader } from "@/components/Loader";
import { AnimatePresence } from "framer-motion";
import FlashOfferWidget from "@/components/FlashOfferWidget";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <AuthProvider>
      <main className={`${playfair.variable} ${poppins.variable} font-sans`}>
        <Layout>
          <FlashOfferWidget />
          <AnimatePresence mode="wait">
            {loading && <PageTransitionLoader />}
          </AnimatePresence>
          <Component {...pageProps} />
        </Layout>
      </main>
    </AuthProvider>
  );
}
