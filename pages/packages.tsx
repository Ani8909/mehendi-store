import SEO from "@/components/SEO";
import Link from "next/link";
import { SkeletonCard } from "@/components/Loader";
import { motion } from "framer-motion";
import { FiCheck, FiArrowLeft } from "react-icons/fi";
import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/slugify";


export default function Packages() {
  const [eventPackages, setEventPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const qPackages = query(collection(db, "event_packages"));
        const packageSnap = await getDocs(qPackages);
        setEventPackages(packageSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching packages", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  return (
    <>
      <SEO 
        title="Event & Bridal Mehndi Packages Agra | Jyoti Mehendi"
        description="Book affordable Mehndi event packages for weddings, sangeet, and parties in Agra. Group bookings and royal bridal contracts by Jyoti Mehendi."
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Bridal Mehndi Packages",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Jyoti Mehendi Artist"
          },
          "areaServed": {
            "@type": "City",
            "name": "Agra"
          }
        })}
      />

      <div className="bg-[var(--color-background)] min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[35vh] md:h-[40vh] flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src="/images/gallery/bridal_2.png" 
              alt="Packages Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          </motion.div>

          {/* Hero Section Content */}
          <div className="relative z-10 text-center px-4">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-pink-200 text-sm font-bold uppercase tracking-[0.3em] mb-4 block"
            >
              Exclusive Deals
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white font-serif mb-6 drop-shadow-lg"
            >
              Premium Packages
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-200 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
            >
              Choose from our expertly crafted packages. Perfect for royal weddings, bridal showers, and grand festivals in Agra.
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Trending Packages Section */}
              {eventPackages.some(pkg => pkg.isTrending) && (
                <div className="mb-20">
                  <div className="flex items-center space-x-3 mb-8">
                    <span className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      🔥 Trending Packages
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-800">Most Popular Packages</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {eventPackages.filter(pkg => pkg.isTrending).map((pkg, i) => {
                      const isPremium = pkg.price >= 8000;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          key={`trending-${pkg.id}`} 
                          className={`rounded-[2.5rem] overflow-hidden group transition-all duration-500 flex flex-col relative border-2 transform hover:-translate-y-2 hover:scale-[1.02] ${
                            isPremium 
                              ? "bg-gradient-to-br from-[#500724] via-[#310012] to-[#180008] border-pink-500/30 text-white shadow-[0_20px_50px_rgba(80,7,36,0.3)] hover:shadow-[0_30px_70px_rgba(219,39,119,0.35)] hover:border-pink-400" 
                              : "bg-gradient-to-br from-white to-[#fff8f9] border-pink-100/80 text-gray-800 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:border-pink-300 hover:shadow-[0_30px_60px_rgba(219,39,119,0.12)]"
                          }`}
                        >
                          <div className="absolute top-5 left-5 z-10">
                            <span className="bg-pink-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest shadow-md animate-pulse">
                              🔥 POPULAR CHOICE
                            </span>
                          </div>
                          
                          {/* Header Details */}
                          <div className={`p-8 pb-6 border-b relative pt-14 ${isPremium ? 'border-pink-900/30' : 'border-pink-50'}`}>
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-2 ${
                              isPremium ? 'text-pink-300' : 'text-[var(--color-primary)]'
                            }`}>
                              {isPremium ? 'Royal Wedding Special' : 'Elegant Celebration'}
                            </span>
                            <Link href={`/packages/${slugify(pkg.name)}`}>
                              <h3 className={`text-2xl font-bold font-serif transition-colors duration-300 ${
                                isPremium ? 'text-white group-hover:text-pink-300' : 'text-gray-800 group-hover:text-[var(--color-primary)]'
                              }`}>
                                {pkg.name}
                              </h3>
                            </Link>
                            <p className={`text-xs mt-2 leading-relaxed min-h-[40px] italic ${
                              isPremium ? 'text-pink-100/70' : 'text-gray-400'
                            }`}>
                              "{pkg.description}"
                            </p>
                            
                            <div className="mt-6 flex items-baseline">
                              <span className={`text-4xl font-extrabold tracking-tight ${isPremium ? 'text-pink-300' : 'text-gray-900'}`}>
                                ₹{pkg.price}
                              </span>
                              <span className={`text-xs ml-2 font-medium ${isPremium ? 'text-pink-100/50' : 'text-gray-400'}`}>
                                / Complete Event
                              </span>
                            </div>
                          </div>

                          {/* Features list */}
                          <div className="p-8 flex-grow flex flex-col justify-between">
                            <div className="space-y-4 mb-8">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                isPremium ? 'text-pink-200/70' : 'text-gray-400'
                              }`}>
                                What's Included
                              </p>
                              {pkg.features?.map((feat: string, idx: number) => (
                                <div key={idx} className="flex items-start space-x-3 text-sm">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                                    isPremium 
                                      ? 'bg-pink-500/20 text-pink-300 group-hover:bg-pink-500 group-hover:text-white' 
                                      : 'bg-pink-50 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white'
                                  }`}>
                                    <FiCheck size={11} strokeWidth={4} />
                                  </div>
                                  <span className={`font-medium leading-tight ${
                                    isPremium ? 'text-pink-50/90' : 'text-gray-600'
                                  }`}>{feat}</span>
                                </div>
                              ))}
                            </div>

                            {/* CTA Button Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                              <Link 
                                href={`/booking?package=${encodeURIComponent(pkg.name)}&price=${pkg.price}`} 
                                className={`py-3.5 rounded-2xl font-bold text-center text-xs shadow-md transition-all duration-300 transform active:scale-95 block ${
                                  isPremium
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-rose-600 hover:to-pink-500 hover:shadow-[0_10px_25px_rgba(219,39,119,0.4)]'
                                    : 'bg-gradient-to-r from-[var(--color-primary)] to-pink-700 text-white hover:from-pink-700 hover:to-[var(--color-primary)] hover:shadow-[0_10px_25px_rgba(219,39,119,0.3)]'
                                }`}
                              >
                                Book Now
                              </Link>
                              <Link 
                                href={`/packages/${slugify(pkg.name)}`}
                                className={`py-3.5 rounded-2xl font-bold text-center text-xs border transition-all duration-300 block ${
                                  isPremium
                                    ? 'border-pink-500/40 text-pink-300 hover:bg-pink-500/20'
                                    : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                                }`}
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Packages Section */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-800 mb-8">All Packages</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {eventPackages.length > 0 ? eventPackages.map((pkg, i) => {
                const isPremium = pkg.price >= 8000;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    key={pkg.id} 
                    className={`rounded-[2.5rem] overflow-hidden group transition-all duration-500 flex flex-col relative border-2 transform hover:-translate-y-2 hover:scale-[1.02] ${
                      isPremium 
                        ? "bg-gradient-to-br from-[#500724] via-[#310012] to-[#180008] border-pink-500/30 text-white shadow-[0_20px_50px_rgba(80,7,36,0.3)] hover:shadow-[0_30px_70px_rgba(219,39,119,0.35)] hover:border-pink-400" 
                        : "bg-gradient-to-br from-white to-[#fff8f9] border-pink-100/80 text-gray-800 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:border-pink-300 hover:shadow-[0_30px_60px_rgba(219,39,119,0.12)]"
                    }`}
                  >
                    {isPremium && (
                      <div className="absolute top-5 right-5 bg-gradient-to-r from-pink-500 via-pink-600 to-rose-700 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-pink-400/30 animate-pulse">
                        ⭐ Royal Choice
                      </div>
                    )}
                    
                    {/* Header Details */}
                    <div className={`p-8 pb-6 border-b relative ${isPremium ? 'border-pink-900/30' : 'border-pink-50'}`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-2 ${
                        isPremium ? 'text-pink-300' : 'text-[var(--color-primary)]'
                      }`}>
                        {isPremium ? 'Royal Wedding Special' : 'Elegant Celebration'}
                      </span>
                      <Link href={`/packages/${slugify(pkg.name)}`}>
                        <h3 className={`text-2xl font-bold font-serif transition-colors duration-300 ${
                          isPremium ? 'text-white group-hover:text-pink-300' : 'text-gray-800 group-hover:text-[var(--color-primary)]'
                        }`}>
                          {pkg.name}
                        </h3>
                      </Link>
                      <p className={`text-xs mt-2 leading-relaxed min-h-[40px] italic ${
                        isPremium ? 'text-pink-100/70' : 'text-gray-400'
                      }`}>
                        "{pkg.description}"
                      </p>
                      
                      <div className="mt-6 flex items-baseline">
                        <span className={`text-4xl font-extrabold tracking-tight ${isPremium ? 'text-pink-300' : 'text-gray-900'}`}>
                          ₹{pkg.price}
                        </span>
                        <span className={`text-xs ml-2 font-medium ${isPremium ? 'text-pink-100/50' : 'text-gray-400'}`}>
                          / Complete Event
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div className="space-y-4 mb-8">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                          isPremium ? 'text-pink-200/70' : 'text-gray-400'
                        }`}>
                          What's Included
                        </p>
                        {pkg.features?.map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-3 text-sm">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                              isPremium 
                                ? 'bg-pink-500/20 text-pink-300 group-hover:bg-pink-500 group-hover:text-white' 
                                : 'bg-pink-50 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white'
                            }`}>
                              <FiCheck size={11} strokeWidth={4} />
                            </div>
                            <span className={`font-medium leading-tight ${
                              isPremium ? 'text-pink-50/90' : 'text-gray-600'
                            }`}>{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                        <Link 
                          href={`/booking?package=${encodeURIComponent(pkg.name)}&price=${pkg.price}`} 
                          className={`py-3.5 rounded-2xl font-bold text-center text-xs shadow-md transition-all duration-300 transform active:scale-95 block ${
                            isPremium
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-rose-600 hover:to-pink-500 hover:shadow-[0_10px_25px_rgba(219,39,119,0.4)]'
                              : 'bg-gradient-to-r from-[var(--color-primary)] to-pink-700 text-white hover:from-pink-700 hover:to-[var(--color-primary)] hover:shadow-[0_10px_25px_rgba(219,39,119,0.3)]'
                          }`}
                        >
                          Book Now
                        </Link>
                        <Link 
                          href={`/packages/${slugify(pkg.name)}`}
                          className={`py-3.5 rounded-2xl font-bold text-center text-xs border transition-all duration-300 block ${
                            isPremium
                              ? 'border-pink-500/40 text-pink-300 hover:bg-pink-500/20'
                              : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                          }`}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <p className="text-xl">No packages available at the moment. Please check back later!</p>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
