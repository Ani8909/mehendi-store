import SEO from "@/components/SEO";
import { SkeletonGallery } from "@/components/Loader";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiX, FiZoomIn } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const categories = ["All", "Bridal", "Arabic", "Fusion", "Mandala", "Geometric", "Minimalist", "Guest", "Modern"];

  useEffect(() => {
    async function fetchGallery() {
      try {
        const q = query(collection(db, "designs_gallery"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually if we don't have indexes set up
        data.sort((a: any, b: any) => b.uploadedAt - a.uploadedAt);
        setImages(data);
      } catch (error) {
        console.error("Error fetching gallery", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const filteredImages = activeCategory === "All" 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <>
      <SEO 
        title="Latest Mehndi Design Gallery 2026 Agra | Jyoti Mehendi"
        description="Browse the best mehndi design gallery in Agra. See Jyoti Mehendi's portfolio of Bridal, Arabic, Mandala, and modern henna masterpieces."
      />

      <div className="bg-[var(--color-background)] min-h-screen">
        {/* Hero Section */}
        <div className="relative pt-20 pb-6 md:pt-28 md:pb-10 flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src="/images/gallery/bridal_3.png" 
              alt="Gallery Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
          </motion.div>
          
          <div className="relative z-10 text-center px-4">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-pink-200 text-sm font-bold uppercase tracking-[0.3em] mb-4 block"
            >
              Masterpieces
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white font-serif mb-6 drop-shadow-lg"
            >
              Artistic Portfolio
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-200 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
            >
              Explore our collection of authentic, hand-crafted Mehndi designs that bring timeless tradition to life.
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex overflow-x-auto md:flex-wrap md:justify-center gap-3 mb-16 pb-2 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 whitespace-nowrap px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 tracking-wide ${
                  activeCategory === category 
                    ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-[0_10px_20px_-5px_rgba(219,39,119,0.3)] md:scale-105" 
                    : "bg-white text-gray-500 hover:bg-pink-50 hover:text-[var(--color-primary)] shadow-sm"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Masonry Grid */}
          {loading ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              {[250, 320, 280, 400, 300, 350, 260, 380].map((h, i) => (
                <div key={i} className="break-inside-avoid shadow-sm" style={{ height: `${h}px` }}>
                  <SkeletonGallery className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredImages.map((img, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                    key={img.id} 
                    className="relative group break-inside-avoid overflow-hidden rounded-[2rem] cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 border-4 border-white"
                    onClick={() => setSelectedImage(img.imageURL)}
                  >
                    <img 
                      src={img.imageURL} 
                      alt={img.category} 
                      className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center p-6">
                      <div className="flex items-center space-x-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/30">
                          {img.category}
                        </span>
                        <div className="bg-white p-2 rounded-full text-[var(--color-primary)]">
                          <FiZoomIn size={18} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredImages.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="bg-white inline-block p-12 rounded-[3rem] shadow-sm">
                <FiZoomIn className="mx-auto text-4xl text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium italic">No designs found in this category yet.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-6 right-6 sm:top-10 sm:right-10 text-white hover:text-[var(--color-primary)] transition-all duration-300 p-2 bg-white/10 rounded-full border border-white/20"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <FiX size={32} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Enlarged" 
                className="w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border-2 border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
