import SEO from "@/components/SEO";
import Link from "next/link";
import { SkeletonCard } from "@/components/Loader";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { slugify } from "@/lib/slugify";


export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const snapshot = await getDocs(collection(db, "services"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(data);
      } catch (error) {
        console.error("Error fetching services", error);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <>
      <SEO 
        title="Best Bridal Mehndi Designer in Agra | Arabic & Marwari Mehndi"
        description="Looking for professional mehndi services in Agra? Jyoti Mehendi Artist offers the best bridal, Arabic, Marwari, and engagement mehndi designs in Agra."
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Mehndi Design",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Jyoti Mehendi Artist",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Agra"
            }
          },
          "areaServed": {
            "@type": "City",
            "name": "Agra"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Mehndi Services in Agra",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Bridal Mehndi"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Arabic Mehndi"
                }
              }
            ]
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
              src="/images/services/bridal.png" 
              alt="Services Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          </motion.div>
          
          <div className="relative z-10 text-center px-4">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-pink-200 text-sm font-bold uppercase tracking-[0.3em] mb-4 block"
            >
              Our Offerings
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white font-serif mb-6 drop-shadow-lg"
            >
              Professional Mehndi Services in Agra
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-200 max-w-3xl mx-auto text-lg md:text-xl font-light leading-relaxed"
            >
              From intricate bridal masterpieces to modern Arabic and Marwari designs, we craft beauty for every moment. Whether it's an engagement, baby shower, or traditional wedding, book the top mehndi artist in Agra.
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Trending Section */}
              {services.some(s => s.isTrending && s.isActive) && (
                <div className="mb-20">
                  <div className="flex items-center space-x-3 mb-8">
                    <span className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      🔥 Trending Now
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-800">Agra's Most Requested Designs</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.filter(s => s.isTrending && s.isActive).map((service, index) => {
                      const getDefaultImage = (title: string) => {
                        const t = title.toLowerCase();
                        if (t.includes('bridal')) return '/images/services/bridal.png';
                        if (t.includes('arabic')) return '/images/services/arabic.png';
                        if (t.includes('portrait')) return '/images/services/portrait.png';
                        if (t.includes('mandala')) return '/images/services/mandala.png';
                        if (t.includes('fusion')) return '/images/services/fusion.png';
                        return '/images/services/minimalist.png';
                      };
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          key={`trending-${service.id}`} 
                          className="bg-white rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(219,39,119,0.06)] hover:shadow-[0_25px_55px_rgba(219,39,119,0.15)] hover:border-pink-300 transform hover:-translate-y-1.5 transition-all duration-500 group flex flex-col border-2 border-pink-200/80 relative"
                        >
                          <div className="absolute top-4 left-4 z-10">
                            <span className="bg-pink-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md animate-pulse">
                              🔥 POPULAR
                            </span>
                          </div>
                          
                          <Link href={`/services/${slugify(service.title)}`} className="relative h-64 overflow-hidden bg-pink-50 block">
                            <img 
                              src={service.image || getDefaultImage(service.title)} 
                              onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                              alt={`${service.title} - Mehndi Artist in Agra`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute top-4 right-4 bg-white/95 text-[var(--color-primary)] px-3 py-1 rounded-full font-bold shadow-md text-sm z-10">
                              ₹{service.price}
                            </div>
                          </Link>
                          <div className="p-8 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-3">
                              <Link href={`/services/${slugify(service.title)}`}>
                                <h3 className="text-2xl font-bold text-gray-800 font-serif leading-tight group-hover:text-pink-600 transition-colors duration-300">
                                  {service.title}
                                </h3>
                              </Link>
                            </div>
                            <div className="flex items-center text-xs text-gray-400 font-medium mb-4 space-x-4">
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {service.duration}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow line-clamp-2">
                              {service.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-4 border-t border-pink-50">
                              <Link 
                                href={{ pathname: '/booking', query: { serviceId: service.id } }}
                                className="text-center py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-pink-200/50"
                              >
                                Book Now
                              </Link>
                              <Link 
                                href={`/services/${slugify(service.title)}`}
                                className="text-center py-3 border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-2xl font-bold text-xs transition-all"
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Services Section */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-800 mb-8">All Mehndi Offerings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.filter(s => s.isActive).map((service, index) => {
                const getDefaultImage = (title: string) => {
                  const t = title.toLowerCase();
                  if (t.includes('bridal')) return '/images/services/bridal.png';
                  if (t.includes('arabic')) return '/images/services/arabic.png';
                  if (t.includes('portrait')) return '/images/services/portrait.png';
                  if (t.includes('mandala')) return '/images/services/mandala.png';
                  if (t.includes('fusion')) return '/images/services/fusion.png';
                  return '/images/services/minimalist.png';
                };
                return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  key={service.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] transition-all duration-500 group flex flex-col border border-pink-50"
                >
                  <Link href={`/services/${slugify(service.title)}`} className="relative h-64 overflow-hidden bg-pink-50 block">
                    <img 
                      src={service.image || getDefaultImage(service.title)} 
                      onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                      alt={`${service.title} - Mehndi Artist in Agra`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-[var(--color-primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        {service.category || 'Service'}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-[var(--color-primary)] text-white px-4 py-1.5 rounded-full font-bold shadow-lg">
                      ₹{service.price}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Link>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <Link href={`/services/${slugify(service.title)}`}>
                        <h3 className="text-2xl font-bold text-[var(--color-header)] font-serif leading-tight group-hover:text-[var(--color-primary)] transition-colors duration-300">
                          {service.title}
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 font-medium mb-4 space-x-4">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.duration}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                      <Link 
                        href={{ pathname: '/booking', query: { serviceId: service.id } }}
                        className="relative overflow-hidden group/btn text-center py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-2xl font-bold text-xs transition-all hover:shadow-[0_10px_20px_-10px_rgba(219,39,119,0.5)] active:scale-[0.98]"
                      >
                        <span className="relative z-10">Book Now</span>
                      </Link>
                      <Link 
                        href={`/services/${slugify(service.title)}`}
                        className="text-center py-3 border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-2xl font-bold text-xs transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
