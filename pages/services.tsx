import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

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
      <Head>
        <title>Our Services | Jyoti Mehendi Artist</title>
      </Head>

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
              className="text-5xl md:text-7xl font-bold text-white font-serif mb-6 drop-shadow-lg"
            >
              Exquisite Services
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-200 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
            >
              From intricate bridal masterpieces to modern party designs, we craft beauty for every moment.
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl p-4">
                  <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                  <div className="bg-gray-200 h-6 w-2/3 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 w-full rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 w-1/2 rounded mb-6"></div>
                  <div className="bg-gray-200 h-10 w-full rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
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
                  <div className="relative h-64 overflow-hidden bg-pink-50">
                    <img 
                      src={service.image || getDefaultImage(service.title)} 
                      onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                      alt={service.title} 
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
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-[var(--color-header)] font-serif leading-tight group-hover:text-[var(--color-primary)] transition-colors duration-300">
                        {service.title}
                      </h3>
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
                    <Link 
                      href={{ pathname: '/booking', query: { serviceId: service.id } }}
                      className="relative overflow-hidden group/btn block w-full text-center py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-2xl font-bold transition-all hover:shadow-[0_10px_20px_-10px_rgba(219,39,119,0.5)] active:scale-[0.98]"
                    >
                      <span className="relative z-10">Book This Experience</span>
                    </Link>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
