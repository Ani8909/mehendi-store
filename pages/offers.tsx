import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { SkeletonCard } from "@/components/Loader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { FiTag, FiGift, FiScissors, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";
import Head from "next/head";

export default function Offers() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const q = query(collection(db, "coupons"), where("isActive", "==", true));
        const snap = await getDocs(q);
        setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to fetch coupons", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Special Offers & Mehndi Discount Coupons - Jyoti Mehendi Artist Agra",
    "description": "Exclusive discount coupons, promo codes, and loyalty rewards for bridal and party mehndi bookings in Agra. Get the best henna artist deals.",
    "mainEntity": {
      "@type": "OfferCatalog",
      "name": "Mehndi Booking Offers",
      "itemListElement": coupons.map((c, index) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Mehndi Art Service in Agra"
        },
        "priceCurrency": "INR",
        "description": c.discountType === 'flat' ? `Flat ₹${c.discountAmount} OFF using code ${c.code}` : `${c.discountAmount}% OFF using code ${c.code}`,
        "eligibleTransactionVolume": {
          "@type": "PriceSpecification",
          "price": c.minAmount || 0,
          "priceCurrency": "INR"
        }
      }))
    }
  };

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      </Head>
      <SEO 
        title="Best Mehndi Discount Coupons & Offers in Agra | Jyoti Mehendi"
        description="Looking for the best Mehndi artist in Agra? Get exclusive discount coupons, promo codes, and loyalty rewards for bridal and party henna bookings with Jyoti Mehendi."
      />

      <div className="bg-[var(--color-background)] min-h-screen pb-20">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[var(--color-header)] to-[var(--color-primary)] py-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
            <div className="absolute top-40 right-20 w-80 h-80 rounded-full bg-pink-300 blur-3xl"></div>
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full mb-6 font-bold tracking-widest text-sm uppercase"
            >
              <FiGift className="mr-2" size={18} /> Exclusive Deals in Agra
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black font-serif text-white mb-6 leading-tight drop-shadow-md"
            >
              Unlock Royal Savings on Agra's Best Mehndi
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-pink-100 text-lg max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Looking for the finest bridal designer in Agra? Because your special moments deserve to be celebrated without compromise. Use these active promo codes during checkout for instant discounts.
            </motion.p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
          
          {/* Default Loyalty Card (Always Available) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-1 border-2 border-amber-300 max-w-3xl mx-auto mb-16 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -z-0 opacity-50"></div>
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-[1.4rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between relative z-10">
              <div className="flex-1 text-center md:text-left mb-6 md:mb-0">
                <div className="inline-flex items-center bg-amber-200 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 shadow-sm">
                  <FiCheckCircle className="mr-1.5" /> Auto Applied
                </div>
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-2">Returning Customer?</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-md">
                  Welcome back! As a token of our appreciation, your next booking above <strong className="text-gray-900">₹5,000</strong> automatically receives a <strong className="text-[var(--color-primary)] font-black text-lg">Flat ₹100 Off</strong>.
                </p>
                <p className="text-xs text-gray-400 mt-3 italic">* We will automatically detect your past bookings via your registered phone number during checkout.</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg border-4 border-white mx-auto transform rotate-12">
                  <div>
                    <span className="block text-3xl font-black text-amber-950 leading-none">₹100</span>
                    <span className="block text-sm font-bold text-amber-800 uppercase tracking-widest mt-1">OFF</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 font-serif inline-block relative">
              Active Promo Codes
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[var(--color-primary)] rounded-full"></div>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <FiTag className="mx-auto text-5xl text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Active Coupons Currently</h3>
              <p className="text-gray-400 max-w-md mx-auto">Check back later for seasonal discounts and festive offers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {coupons.map((coupon, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  key={coupon.id} 
                  className="flex flex-col sm:flex-row bg-white rounded-2xl shadow-md overflow-hidden border border-pink-100 hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Left Side (Discount) */}
                  <div className="bg-gradient-to-br from-pink-500 to-[var(--color-primary)] text-white p-6 sm:w-2/5 flex flex-col justify-center items-center relative border-r-2 border-dashed border-white/50">
                    <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[var(--color-background)] rounded-full"></div>
                    <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[var(--color-background)] rounded-full"></div>
                    
                    <span className="text-5xl font-black tracking-tighter drop-shadow-sm">
                      {coupon.discountType === 'flat' ? `₹${coupon.discountAmount}` : `${coupon.discountAmount}%`}
                    </span>
                    <span className="text-lg font-bold uppercase tracking-widest mt-1 opacity-90">OFF</span>
                  </div>

                  {/* Right Side (Details) */}
                  <div className="p-6 sm:w-3/5 relative flex flex-col justify-center">
                    <FiScissors className="absolute -top-3 right-8 text-gray-300 transform rotate-180" size={24} />
                    
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Use Code</p>
                      <div className="inline-block bg-pink-50 border-2 border-pink-200 text-[var(--color-primary)] font-black text-xl px-4 py-2 rounded-xl border-dashed uppercase tracking-widest select-all">
                        {coupon.code}
                      </div>
                    </div>
                    
                    {coupon.minAmount > 0 ? (
                      <p className="text-gray-600 text-sm font-medium">
                        Applicable on all bookings above <strong className="text-gray-900">₹{coupon.minAmount}</strong>.
                      </p>
                    ) : (
                      <p className="text-gray-600 text-sm font-medium">
                        Applicable on <strong className="text-gray-900">all bookings</strong>! No minimum value required.
                      </p>
                    )}
                    
                    <div className="mt-5">
                      <Link 
                        href={`/booking?coupon=${coupon.code}`}
                        className="inline-block w-full text-center bg-gray-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-[var(--color-primary)] transition-colors shadow-sm"
                      >
                        Claim This Offer
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
