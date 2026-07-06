import SEO from "@/components/SEO";
import { SkeletonGallery } from "@/components/Loader";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiX, FiZoomIn, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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

  const handleNext = () => {
    if (!selectedImage || filteredImages.length === 0) return;
    const currentIndex = filteredImages.findIndex(img => img.imageURL === selectedImage);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[nextIndex].imageURL);
  };

  const handlePrev = () => {
    if (!selectedImage || filteredImages.length === 0) return;
    const currentIndex = filteredImages.findIndex(img => img.imageURL === selectedImage);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setSelectedImage(filteredImages[prevIndex].imageURL);
  };

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

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md inline-block mb-3">
              Our Masterpieces
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-serif text-white tracking-tight leading-tight">
              Design <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-rose-400">Gallery</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-200 font-medium max-w-2xl mx-auto">
              Explore our handcrafted henna designs, ranging from intricate traditional bridal patterns to sleek, contemporary minimalist aesthetics.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-12">
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 pt-2 scrollbar-none py-2 px-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-gradient-to-r from-[var(--color-primary)] to-pink-600 text-white shadow-md shadow-pink-500/30 scale-105"
                    : "bg-transparent text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {loading ? (
            <SkeletonGallery />
          ) : (
            <motion.div 
              layout 
              className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
            >
              <AnimatePresence>
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
        </div>
      </div>

      {/* Lightbox Modal with Touch Swipe Gestures */}
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
              className="absolute top-6 right-6 sm:top-10 sm:right-10 text-white hover:text-[var(--color-primary)] transition-all duration-300 p-2 bg-white/10 rounded-full border border-white/20 z-20"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <FiX size={32} />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(e, info) => {
                if (info.offset.x < -60 || info.velocity.x < -400) {
                  handleNext();
                } else if (info.offset.x > 60 || info.velocity.x > 400) {
                  handlePrev();
                } else if (info.offset.y > 100 || info.velocity.y > 400) {
                  setSelectedImage(null);
                }
              }}
              className="relative max-w-5xl w-full flex items-center justify-center touch-pan-y touch-pan-x cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-2 sm:-left-12 z-10 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all active:scale-90 shadow-lg"
                title="Previous (or swipe right)"
              >
                <FiChevronLeft size={28} />
              </button>

              <img 
                src={selectedImage} 
                alt="Enlarged Mehndi Design" 
                className="w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border-2 border-white/10 select-none pointer-events-none"
              />

              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-2 sm:-right-12 z-10 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all active:scale-90 shadow-lg"
                title="Next (or swipe left)"
              >
                <FiChevronRight size={28} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
