import SEO from "@/components/SEO";
import { FadeUp, StaggerContainer, StaggerItem, CountUp, SlideInLeft, SlideInRight, ScalePop, ScrollProgressBar, ParallaxImage } from "@/components/ScrollAnimations";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { FiCheckCircle, FiClock, FiCreditCard, FiMapPin, FiCheck, FiTruck, FiAward, FiHeart, FiStar, FiShoppingBag, FiArrowRight, FiEdit2, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, addDoc, serverTimestamp, orderBy, where, onSnapshot, doc } from "firebase/firestore";
import { SkeletonCard, SkeletonReview } from "@/components/Loader";
import { db } from "@/lib/firebase";
import CountdownTimer from "@/components/CountdownTimer";
import { useAuth } from "@/lib/authContext";
import seedReviewsData from "@/data/reviews.json";
import { slugify } from "@/lib/slugify";

export default function Home() {
  const PREMIUM_SLIDES = [
    { 
      id: "slide1", 
      image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355099/hero_slides/sjpfw91fxfwoggnnorlx.jpg", 
      title: "Royal Bridal Mehndi Artistry", 
      subtitle: "Agra's premier 'mehndi wali' boutique. Handcrafting pristine, chemical-free organic henna and intricate heritage patterns since 2014." 
    },
    { 
      id: "slide2", 
      image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355101/hero_slides/kl1qf6eo81oeazosxamq.jpg", 
      title: "Sophisticated Arabic & Floral Couture", 
      subtitle: "Bold, flowing outlines blended with delicate contemporary textures. Tailored mehndi services for the modern bride and absolute perfection." 
    },
    { 
      id: "slide3", 
      image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355102/hero_slides/di1flpverp0dru1ndhmh.jpg", 
      title: "Intricate Indo-Arabic Fusion", 
      subtitle: "Timeless Mughal symmetry meets modern aesthetics. Handcrafted with premium organic stain to radiate trust and royal elegance on your auspicious day." 
    },
  ];

  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>(PREMIUM_SLIDES);
  const [expressZones, setExpressZones] = useState<any[]>([]);
  const [eventPackages, setEventPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashOffer, setFlashOffer] = useState<any>(null);
  
  const router = useRouter();
  const [quickService, setQuickService] = useState("Bridal Special");
  const [quickDate, setQuickDate] = useState("");
  const [todayBookings, setTodayBookings] = useState(8);

  useEffect(() => {
    if (db) {
      const unsub = onSnapshot(doc(db, "bot_settings", "greeting"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.todayBookings !== undefined) {
            setTodayBookings(Number(data.todayBookings));
          }
        }
      });
      return unsub;
    }
  }, []);

  const handleQuickCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDate) return;
    router.push(`/booking?service=${encodeURIComponent(quickService)}&date=${encodeURIComponent(quickDate)}`);
  };

  // Review Modal State
  const { user, userData } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    area: "",
    rating: 5,
    comment: ""
  });

  const seedReviews = seedReviewsData.slice(0, 15); // Show top 15 seed reviews on homepage

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Services
        const qServices = query(collection(db, "services"), limit(3));
        const servicesSnap = await getDocs(qServices);
        setFeaturedServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Hero Slides
        const qHero = query(collection(db, "hero_slides"));
        const heroSnap = await getDocs(qHero);
        if (!heroSnap.empty) {
          const premiumSlidesCopy = {
            "Exquisite Bridal Mehndi": {
              title: "Royal Bridal Mehndi Artistry",
              subtitle: "Agra's premier 'mehndi wali' boutique. Handcrafting pristine, chemical-free organic henna and intricate heritage patterns since 2014."
            },
            "Elegant Arabic Patterns": {
              title: "Sophisticated Arabic & Floral Couture",
              subtitle: "Bold, flowing outlines blended with delicate contemporary textures. Tailored mehndi services for the modern bride and absolute perfection."
            },
            "Fusion Artistry": {
              title: "Intricate Indo-Arabic Fusion",
              subtitle: "Timeless Mughal symmetry meets modern aesthetics. Handcrafted with premium organic stain to radiate trust and royal elegance on your auspicious day."
            }
          };

          const fetchedSlides = heroSnap.docs.map(doc => {
            const data = doc.data();
            const premiumCopy = premiumSlidesCopy[data.title as keyof typeof premiumSlidesCopy];
            return {
              id: doc.id,
              image: data.image,
              mobileImage: data.mobileImage || data.image,
              title: premiumCopy ? premiumCopy.title : data.title,
              subtitle: premiumCopy ? premiumCopy.subtitle : data.subtitle
            };
          });
          // Deduplicate by title to prevent redundant database items showing up
          const uniqueSlides = fetchedSlides.filter((value, index, self) =>
            self.findIndex(s => s.title === value.title) === index
          );
          setHeroSlides(uniqueSlides.slice(0, 3));
        } else {
          setHeroSlides(PREMIUM_SLIDES);
        }

        // Fetch Express Zones
        const qExpress = query(collection(db, "express_zones"));
        const expressSnap = await getDocs(qExpress);
        setExpressZones(expressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Event Packages
        const qPackages = query(collection(db, "event_packages"), limit(2));
        const packageSnap = await getDocs(qPackages);
        setEventPackages(packageSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Trending Services
        const qTrendingServ = query(collection(db, "services"), where("isTrending", "==", true), limit(6));
        const trendingServSnap = await getDocs(qTrendingServ);
        const trendingServData = trendingServSnap.docs.map(doc => ({ id: doc.id, type: "service", ...doc.data() }));

        // Fetch Trending Packages
        const qTrendingPkg = query(collection(db, "event_packages"), where("isTrending", "==", true), limit(6));
        const trendingPkgSnap = await getDocs(qTrendingPkg);
        const trendingPkgData = trendingPkgSnap.docs.map(doc => ({ id: doc.id, type: "package", ...doc.data() }));

        setTrendingItems([...trendingServData, ...trendingPkgData]);

        // Fetch Real Reviews
        const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
        const reviewSnap = await getDocs(qReviews);
        const fetchedReviews = reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fallback to seed reviews if no real reviews exist yet
        if (fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        } else {
          setReviews(seedReviews);
        }

        // Fetch Flash Offers
        const qCoupons = query(collection(db, "coupons"), where("isActive", "==", true), where("isFlashOffer", "==", true));
        const couponsSnap = await getDocs(qCoupons);
        const validFlashOffers = couponsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => c.expiresAt && new Date(c.expiresAt).getTime() > Date.now());
        
        if (validFlashOffers.length > 0) {
          validFlashOffers.sort((a: any, b: any) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
          setFlashOffer(validFlashOffers[0]);
        }

      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides, isPaused]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const reviewData = {
        name: user ? userData?.name : newReview.name,
        area: newReview.area,
        rating: newReview.rating,
        text: newReview.comment,
        role: "Verified Client",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "reviews"), reviewData);
      
      // Update local state instantly to show the new review
      setReviews([{ id: docRef.id, ...reviewData }, ...reviews]);
      setShowReviewModal(false);
      setNewReview({ name: "", area: "", rating: 5, comment: "" });
      alert("Thank you for your review!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <SEO 
        title="Best Bridal Mehndi Artist in Agra | Jyoti Mehndi Artist"
        description="Looking for the best Mehndi artist in Agra? Jyoti Mehendi offers top-rated Bridal, Arabic, and custom henna designs with express 20-min home service in Agra."
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Jyoti Mehendi Artist",
          "image": "https://jyotimehendi.in/logo.png",
          "description": "Best Mehndi artist in Agra. Book professional Mehndi artists for Bridal, Arabic, and Party designs.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Agra",
            "addressRegion": "Uttar Pradesh",
            "addressCountry": "IN"
          },
          "url": "https://jyotimehendi.in",
          "sameAs": [
            "https://www.instagram.com/mehndi_artist__jyoti?igsh=M200NHNncnZjOWQz",
            "https://www.facebook.com/share/1AwpsjFKnh/",
            "https://pin.it/2ZoiasFlN",
            "https://youtube.com/@jyotimehndiartist-m9g?si=a_nUhTHsi0zv-4nX"
          ],
          "priceRange": "₹500 - ₹5100",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              "opens": "09:00",
              "closes": "21:00"
            }
          ]
        })}
      />

      {/* Premium Split Hero Section */}
      <section 
        className="relative min-h-[500px] md:h-[75vh] w-full overflow-hidden bg-[#0c0504] flex flex-col md:grid md:grid-cols-12 cursor-default group border-b border-pink-950/20"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* LEFT COLUMN: Premium Editorial Brand Content Panel */}
        <div className="col-span-5 flex flex-col justify-between p-6 sm:p-10 md:p-14 bg-gradient-to-b from-[#1c040d] via-[#0d0107] to-[#1c040d] relative z-20 order-2 md:order-1 flex-grow gap-6">
          {/* Subtle Arabesque Background Pattern in left panel */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.025] pointer-events-none"></div>
          
          {/* TOP GROUP: Badges + Sliding Title/Subtitle — grows freely, never clipped */}
          <div className="relative max-w-md mx-auto md:mx-0 space-y-4 text-left pt-4 md:pt-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 bg-pink-950/25 px-4 py-1.5 rounded-full border border-pink-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-pink-200">
                  Agra's Premium Henna Artist
                </span>
              </div>

              <div className="inline-flex items-center space-x-1 bg-pink-950/30 px-3 py-1 rounded-full border border-pink-500/20">
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-pink-300">
                  {todayBookings} booked today
                </span>
              </div>
            </div>

            {/* Slider Title — no height constraint, no overflow-hidden, text is always fully visible */}
            <AnimatePresence mode="wait">
              {heroSlides.length > 0 && (
                <motion.div
                  key={`text-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-2 w-full"
                >
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-50 leading-[1.25] tracking-wide">
                    {heroSlides[currentSlide]?.title || "Royal Bridal Mehndi"}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-light">
                    {heroSlides[currentSlide]?.subtitle || "Intricate heritage patterns crafted with 100% organic henna."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BOTTOM GROUP: Quick Availability Form — always pinned to bottom of left panel */}
          <div className="relative max-w-md mx-auto md:mx-0 w-full pb-2 md:pb-0">
            <form onSubmit={handleQuickCheck} className="p-4 bg-[#18030b]/60 backdrop-blur-md rounded-2xl border border-pink-950/40 space-y-3 shadow-inner">
              <p className="text-[9px] font-bold text-pink-300 uppercase tracking-widest flex items-center gap-1">
                ⚡ Quick Check Availability
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-pink-500 uppercase tracking-wider mb-1">
                    Design Theme
                  </label>
                  <select 
                    value={quickService}
                    onChange={(e) => setQuickService(e.target.value)}
                    className="w-full bg-[#120208] border border-pink-950/40 rounded-xl px-2.5 py-1.5 text-[10px] text-pink-100 outline-none focus:border-pink-500 transition-colors"
                  >
                    <option value="Bridal Special">Bridal Special</option>
                    <option value="Arabic Designs">Arabic / Floral</option>
                    <option value="Guest & Party">Guest & Party</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-pink-500 uppercase tracking-wider mb-1">
                    Select Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-[#120208] border border-pink-950/40 rounded-xl px-2.5 py-1.5 text-[10px] text-pink-100 outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="submit"
                  className="flex-grow flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shadow-[0_4px_15px_rgba(219,39,119,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Check Availability <FiArrowRight size={10} />
                </button>

                <div className="flex gap-2 flex-shrink-0">
                  <a 
                    href="https://wa.me/917906297942?text=Hi%20Jyoti%20Mehendi!%20I%20would%20like%20to%20book%20a%20slot." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2.5 rounded-full bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 transition-all duration-300 hover:scale-105"
                    title="WhatsApp Enquiry"
                  >
                    <FaWhatsapp size={14} />
                  </a>
                  <a 
                    href="tel:+917906297942"
                    className="flex items-center justify-center p-2.5 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 transition-all duration-300 hover:scale-105"
                    title="Call Us"
                  >
                    <FaPhone size={12} style={{ transform: "scaleX(-1)" }} />
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>


        {/* RIGHT COLUMN: Cinematic Image Slideshow */}
        <div className="col-span-7 h-[40vh] md:h-full relative overflow-hidden order-1 md:order-2 bg-stone-950">
          {/* Subtle vignette over entire image panel */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d0107] via-transparent to-black/10 hidden md:block"></div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden"></div>

          {/* Golden Sparkles Particles */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-t from-amber-300 to-yellow-500 rounded-full opacity-35 blur-[0.5px]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -150, 0],
                  x: [0, Math.random() * 30 - 15, 0],
                  opacity: [0.1, 0.6, 0.1],
                  scale: [0.6, 1.2, 0.6],
                }}
                transition={{
                  duration: 8 + Math.random() * 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {heroSlides.length > 0 && (
              <motion.div
                key={heroSlides[currentSlide].id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {/* Responsive Image with Picture Tag */}
                <picture className="absolute inset-0 w-full h-full">
                  <source media="(max-width: 767px)" srcSet={heroSlides[currentSlide].mobileImage || heroSlides[currentSlide].image} />
                  <img
                    src={heroSlides[currentSlide].image}
                    alt={`Beautiful mehndi design by Jyoti Mehndi Artist Agra - ${heroSlides[currentSlide].title}`}
                    className="w-full h-full object-cover"
                  />
                </picture>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slider Navigation Controls inside image panel */}
          {heroSlides.length > 1 && (
            <>
              {/* Glassmorphic Slide Preview Tabs */}
              <div className="absolute bottom-6 left-6 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 shadow-lg z-20">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 ${
                      currentSlide === idx 
                        ? "text-pink-400 bg-pink-900/30 border border-pink-500/20" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {slide.title.includes("Bridal") 
                      ? "Bridal" 
                      : slide.title.includes("Arabic") 
                      ? "Arabic" 
                      : "Fusion"}
                  </button>
                ))}
              </div>

              {/* Arrow navigation buttons */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  className="bg-black/40 hover:bg-pink-600 border border-white/10 text-white p-2.5 rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                  aria-label="Previous Slide"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                  className="bg-black/40 hover:bg-pink-600 border border-white/10 text-white p-2.5 rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                  aria-label="Next Slide"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Agra Branding Strip */}
      <div className="bg-gradient-to-r from-pink-700 via-[var(--color-header)] to-amber-600 text-white py-3 overflow-hidden whitespace-nowrap shadow-xl relative border-y-4 border-amber-500/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-30 mix-blend-overlay"></div>
        <div className="flex animate-marquee-slow space-x-12 text-xs font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-md">
          <span>🌟 AGRA'S FAVORITE MEHNDI ARTIST 🌟</span>
          <span>📍 SANJAY PLACE • KAMLA NAGAR • DAYALBAGH • TAJGANJ • SHASTRIPURAM ❤️</span>
          <span>✨ SIKANDRA • KHANDARI • SHAHGANJ • FATEHABAD ROAD • LOHAMANDI ✨</span>
          <span>👑 CRAFTING ROYALTY IN THE CITY OF LOVE 👑</span>
        </div>
      </div>

      {/* Trending Section */}
      {trendingItems.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-pink-50/50 via-white to-pink-50/20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-pink-100/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-pink-100/80 border border-pink-200 px-4 py-1.5 rounded-full text-pink-700 text-xs font-bold uppercase tracking-wider mb-4 animate-bounce">
                <span>🔥 HOT & TRENDING NOW</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-header)] font-serif mb-4 leading-tight">
                Trending Henna Styles & Packages
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore the most popular designs and packages booking right now across Agra. Selected by our premium clients.
              </p>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingItems.map((item, idx) => {
                const isPackage = item.type === "package";
                const linkHref = isPackage 
                  ? `/packages/${slugify(item.name)}` 
                  : `/services/${slugify(item.title)}`;
                
                const getDefaultImage = (title: string) => {
                  const t = title.toLowerCase();
                  if (t.includes('bridal')) return 'https://images.unsplash.com/photo-1595856401035-77ce547ab09c?q=80&w=600&auto=format&fit=crop';
                  if (t.includes('arabic')) return 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=600&auto=format&fit=crop';
                  if (t.includes('party')) return 'https://images.unsplash.com/photo-1620050868884-bb5cd5e5233c?q=80&w=600&auto=format&fit=crop';
                  if (t.includes('indo')) return 'https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=600&auto=format&fit=crop';
                  return 'https://images.unsplash.com/photo-1590610940562-63b782b79401?q=80&w=600&auto=format&fit=crop';
                };

                const title = isPackage ? item.name : item.title;
                const price = item.price;
                const desc = item.description || item.desc || "";
                const image = isPackage 
                  ? "/images/services/bridal.png" 
                  : (item.image || getDefaultImage(title));

                return (
                  <StaggerItem key={item.id}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden border-2 border-pink-100/50 shadow-[0_15px_40px_rgba(219,39,119,0.03)] hover:shadow-[0_25px_50px_rgba(219,39,119,0.12)] hover:border-pink-300 transition-all duration-500 flex flex-col group relative h-full"
                  >
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md ${
                        isPackage 
                          ? 'bg-amber-500/90 text-white animate-pulse' 
                          : 'bg-pink-600/90 text-white animate-pulse'
                      }`}>
                        {isPackage ? '🎁 Event Package' : '✨ Service Design'}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative h-64 overflow-hidden bg-pink-50">
                      <img 
                        src={image} 
                        onError={(e) => { e.currentTarget.src = getDefaultImage(title); }}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <p className="text-white text-xs font-medium italic">"{desc}"</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors font-serif leading-tight line-clamp-1">
                            {title}
                          </h3>
                          <span className="text-xl font-black text-pink-600 shrink-0">
                            ₹{price}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                          {desc}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-pink-50">
                        <Link 
                          href={linkHref}
                          className="py-3 rounded-xl font-bold text-center text-xs border border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors"
                        >
                          View Info
                        </Link>
                        <Link 
                          href={`/booking?${isPackage ? 'package' : 'service'}=${encodeURIComponent(title)}&price=${price}`}
                          className="py-3 rounded-xl font-bold text-center text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-rose-600 hover:to-pink-500 transition-colors shadow-md hover:shadow-pink-200/50"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-header)] font-serif mb-4">Our Featured Designs</h2>
            <p className="text-gray-600">Choose from our most loved mehndi patterns</p>
          </FadeUp>
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredServices.length > 0 && !loading ? featuredServices.map((service, index) => {
              const getDefaultImage = (title: string) => {
                const t = title.toLowerCase();
                if (t.includes('bridal')) return 'https://images.unsplash.com/photo-1595856401035-77ce547ab09c?q=80&w=600&auto=format&fit=crop';
                if (t.includes('arabic')) return 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=600&auto=format&fit=crop';
                if (t.includes('party')) return 'https://images.unsplash.com/photo-1620050868884-bb5cd5e5233c?q=80&w=600&auto=format&fit=crop';
                if (t.includes('indo')) return 'https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=600&auto=format&fit=crop';
                return 'https://images.unsplash.com/photo-1590610940562-63b782b79401?q=80&w=600&auto=format&fit=crop';
              };
              return (
              <StaggerItem key={service.id}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-64 overflow-hidden bg-pink-50">
                  <img 
                    src={service.image || getDefaultImage(service.title)} 
                    onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                    alt={`${service.title} - Best mehndi artist in agra`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-[var(--color-primary)]">
                    ₹{service.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--color-header)] mb-2 font-serif">{service.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                  <Link href="/booking" className="block w-full text-center py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-full font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                    Book Service
                  </Link>
                </div>
              </motion.div>
              </StaggerItem>
              );
            }) : (
              [1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))
            )}
          </StaggerContainer>
          
          <div className="mt-16 text-center">
            <Link href="/services" className="inline-flex items-center space-x-2 text-[var(--color-primary)] font-bold hover:underline">
              <span>View All Designs</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW: Express Delivery / 20-Min Reach Section */}
      <section className="py-20 bg-gradient-to-b from-white to-pink-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-pink-50/60 via-white to-pink-50/20 rounded-[3rem] p-8 md:p-16 text-gray-700 relative overflow-hidden shadow-xl border border-pink-100/50">
            {/* Background Accents */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
              <SlideInLeft className="lg:w-1/2">
                <div className="inline-flex items-center space-x-2 bg-pink-50 border border-pink-100 px-4 py-2 rounded-full text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-6 shadow-sm">
                  <FiTruck /> <span>Super Fast Service</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight text-[var(--color-header)]">
                  Express Reach In <span className="text-[var(--color-primary)]">20 Minutes</span>
                </h2>
                <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed">
                  Emergency mehndi plan? No worries! In these Agra areas, we reach your doorstep within 20 minutes of booking.
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
                  {Array.from(new Set(expressZones.map(z => z.name.trim().toLowerCase())))
                    .slice(0, 9)
                    .map((zoneName, idx) => {
                      const formattedName = zoneName.split(' ')
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                      return (
                        <div key={idx} className="flex items-center space-x-2 bg-white border border-pink-100/60 p-3 rounded-xl hover:border-pink-300 hover:bg-pink-50/30 transition-all duration-300 shadow-sm">
                          <FiMapPin className="text-[var(--color-primary)] flex-shrink-0" size={13} />
                          <span className="text-xs md:text-sm font-semibold tracking-wide text-gray-700">{formattedName}</span>
                        </div>
                      );
                    })
                  }
                </div>

                <Link href="/express-booking" className="inline-flex items-center space-x-3 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-bold shadow-md hover:bg-[var(--color-header)] transition-all hover:scale-105">
                  <FiClock /> <span>Book Express Service</span>
                </Link>
              </SlideInLeft>

              <SlideInRight className="lg:w-1/2 relative mt-8 lg:mt-0">
                <div className="grid grid-cols-2 gap-6 relative">
                  {/* Glowing backdrop accent */}
                  <div className="absolute inset-0 bg-pink-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                  
                  <div className="overflow-hidden rounded-3xl shadow-xl border-4 border-white rotate-[-3deg] hover:rotate-0 hover:scale-[1.03] transition-all duration-500">
                    <img 
                      src="/images/services/bombay.png" 
                      className="w-full h-48 md:h-64 object-cover" 
                      alt="Fast Mehndi Service in Agra" 
                    />
                  </div>
                  
                  <div className="overflow-hidden rounded-3xl shadow-xl border-4 border-white translate-y-6 rotate-[3deg] hover:rotate-0 hover:scale-[1.03] transition-all duration-500">
                    <img 
                      src="/images/services/jewelry.png" 
                      className="w-full h-48 md:h-64 object-cover" 
                      alt="Doorstep Mehndi Service Agra" 
                    />
                  </div>
                </div>
              </SlideInRight>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Why Choose Us */}
      <section className="py-24 bg-white px-4 relative overflow-hidden">
        <div className="absolute -left-40 top-20 w-96 h-96 bg-amber-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="absolute -right-40 bottom-20 w-96 h-96 bg-pink-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-header)] font-serif mb-4">Why Agra Chooses Us</h2>
            <p className="text-gray-600">Delivering perfection in the City of Love</p>
          </FadeUp>

          {/* Live Stats Counter Row */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: 2000, suffix: "+", label: "Happy Brides" },
              { value: 10, suffix: "+ Yrs", label: "Experience" },
              { value: 4, suffix: ".9★", label: "Avg Rating" },
              { value: 20, suffix: " Min", label: "Express Reach" },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 mb-1">
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { icon: <FiHeart className="text-pink-500" />, title: "Organic Henna", desc: "Chemical-free, skin-friendly, and deep dark stain guaranteed." },
              { icon: <FiAward className="text-amber-500" />, title: "10+ Years Exp.", desc: "Expert artists with a decade of experience in intricate bridal art." },
              { icon: <FiCheckCircle className="text-green-500" />, title: "Punctual", desc: "We value your time. Artists arrive exactly on schedule." },
              { icon: <FiStar className="text-blue-500" />, title: "Customized", desc: "Bring any design from Pinterest, and we will recreate it flawlessly." },
            ].map((item, i) => (
              <StaggerItem key={i}>
              <motion.div 
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="group p-8 bg-white/40 backdrop-blur-md border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:border-pink-100 transition-all duration-500"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-gradient-to-br group-hover:from-pink-50 group-hover:to-amber-50 group-hover:shadow-inner transition-all duration-500 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-header)] mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Localities SEO Block */}
          <div className="mt-16 text-center max-w-4xl mx-auto">
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              <strong>Serving all major localities in Agra:</strong> We provide professional Mehndi artist services at your doorstep across Sanjay Place, Tajganj, Kamla Nagar, Dayalbagh, Sikandra, Khandari, Sadar Bazar, Shahganj, and all over Agra. Experience the finest Arabic and Bridal mehndi artistry right at your home.
            </p>
          </div>
        </div>
      </section>

      {/* NEW: How It Works */}
      <section className="py-24 bg-gradient-to-b from-white to-pink-50/20 px-4 relative overflow-hidden">
        {/* Soft Decorative Blurred Accents */}
        <div className="absolute right-10 top-1/4 w-80 h-80 bg-pink-100/35 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-10 bottom-1/4 w-72 h-72 bg-amber-100/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4 text-[var(--color-header)]">Your Royal Experience</h2>
            <p className="text-gray-500">Simple steps to get your perfect mehndi</p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-200/40 to-transparent -translate-y-1/2 z-0"></div>
            {[
              { step: "01", title: "Select Service", desc: "Pick your design from our gallery or event packages." },
              { step: "02", title: "Choose Slot", desc: "Select a date and time that works best for you." },
              { step: "03", title: "Enjoy Art", desc: "Our expert artist reaches you and works their magic!" },
            ].map((s, i) => (
              <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10 bg-white/60 backdrop-blur-md border border-pink-100/40 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:bg-white/90 transition-all duration-500 text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-md shadow-pink-500/20">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 font-serif">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>


      {/* Royal Wedding & Event Packages */}
      <section id="packages" className="py-32 bg-pink-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Mughal Inspired Background Accents */}
        <div className="absolute -right-40 top-0 w-96 h-96 bg-amber-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -left-40 bottom-0 w-96 h-96 bg-pink-300 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeUp className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold text-[var(--color-header)] font-serif mb-6 leading-tight drop-shadow-sm">
              Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500">Agra Wedding</span> <br/> Contracts
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              Agra ki har shadi ko Taj Mahal jaisi yaadgar aur khubsurat banane ke liye hamare sabse premium bridal contracts. 
            </p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {eventPackages.length > 0 && !loading ? eventPackages.map((pkg, i) => (
              <StaggerItem key={pkg.id}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-pink-900/5 border border-white/50 flex flex-col overflow-hidden group hover:shadow-pink-900/10 transition-all duration-500 h-full"
              >
                <div className="p-10 pb-8 flex flex-col bg-gradient-to-b from-amber-50/50 to-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-bl-full"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <h3 className="text-3xl font-bold text-[var(--color-header)] font-serif leading-tight pr-4">{pkg.name}</h3>
                    <div className="text-right flex-shrink-0">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-amber-600 font-bold text-3xl">₹{pkg.price}</span>
                      <p className="text-[10px] text-amber-500 uppercase font-bold tracking-[0.2em] mt-1">Starting At</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed italic border-l-2 border-amber-300 pl-4 mb-2 relative z-10">
                    "{pkg.description}"
                  </p>
                </div>

                <div className="p-10 pt-4 flex-1 flex flex-col bg-white">
                  <div className="space-y-4 mb-8 flex-1">
                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">Royal Inclusions:</p>
                    {pkg.features?.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 text-sm text-gray-700">
                        <div className="w-5 h-5 bg-gradient-to-br from-pink-100 to-amber-100 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-white">
                          <FiCheck size={10} strokeWidth={4} />
                        </div>
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    href={`/booking?package=${encodeURIComponent(pkg.name)}&price=${pkg.price}`} 
                    className="w-full bg-gradient-to-r from-[var(--color-primary)] to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:from-pink-600 hover:to-pink-700 transition-all text-center flex justify-center items-center group-hover:scale-[1.02]"
                  >
                    Reserve This Package
                  </Link>
                </div>
              </motion.div>
              </StaggerItem>
            )) : (
              [1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))
            )}
          </StaggerContainer>

          <div className="mt-16 text-center">
            <Link href="/services" className="inline-flex items-center space-x-2 bg-white text-[var(--color-primary)] px-8 py-4 rounded-full font-bold border-2 border-pink-100 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm">
              <span>Explore All Packages</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW: Testimonials Section */}
      <section className="py-24 bg-white px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <SlideInLeft className="md:w-1/2">
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-header)] font-serif mb-4">Real Customer <br/> <span className="text-[var(--color-primary)]">Love Stories</span></h2>
              <p className="text-gray-500 mb-6 md:mb-0">See what our clients in Agra say about us</p>
            </SlideInLeft>
            <SlideInRight className="mt-6 md:mt-0 flex flex-col items-end space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex text-amber-400"><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /></div>
                <span className="font-bold text-gray-800 text-lg">4.9/5</span>
                <span className="text-gray-400">(2k+ reviews)</span>
              </div>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="flex items-center space-x-2 bg-pink-50 text-[var(--color-primary)] px-6 py-2 rounded-full font-bold hover:bg-pink-100 transition-colors border border-pink-200"
              >
                <FiEdit2 /> <span>Write a Review</span>
              </button>
            </SlideInRight>
          </div>

          {/* Horizontal scrollable container for reviews */}
          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory gap-6 hide-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="break-inside-avoid mb-6"><SkeletonReview /></div>)
            ) : reviews.length > 0 ? reviews.map((t, i) => (
              <motion.div 
                key={t.id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 p-8 rounded-[2.5rem] relative hover:bg-white hover:shadow-xl transition-all duration-300 group min-w-[320px] md:min-w-[400px] snap-center shrink-0 border border-gray-100"
              >
                <div className="text-[var(--color-primary)] text-4xl font-serif absolute -top-4 left-8 group-hover:scale-125 transition-transform">“</div>
                <div className="flex text-amber-400 mb-4 text-sm">
                  {[...Array(5)].map((_, idx) => (
                    <FiStar key={idx} fill={idx < (t.rating || 5) ? "currentColor" : "none"} className={idx < (t.rating || 5) ? "" : "text-gray-300"} />
                  ))}
                </div>
                <p className="text-gray-600 mb-8 italic leading-relaxed text-sm">"{t.text || t.comment}"</p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">
                    {t.name ? t.name[0].toUpperCase() : "C"}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{t.name || "Happy Customer"}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.role || "Verified Client"} {t.area && `• ${t.area}`}</p>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="w-full text-center py-12 text-gray-400">No reviews yet.</div>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/reviews" className="inline-flex items-center space-x-2 text-[var(--color-primary)] font-bold hover:underline bg-pink-50 px-8 py-3 rounded-full border border-pink-100 transition-colors hover:bg-pink-100">
              <span>See All 2,000+ Reviews</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto">
          <ScalePop>
          <div className="py-24 bg-gradient-to-br from-pink-500/10 via-[var(--color-primary)]/5 to-amber-500/10 border border-pink-100 rounded-[4rem] text-center relative overflow-hidden shadow-sm">
            {/* Soft Background Accent Blurs */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-pink-100/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 px-4">
              <h2 className="text-5xl font-serif font-bold mb-6 text-[var(--color-header)]">Ready to look beautiful?</h2>
              <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">Agra's most trusted artists are just a click away. Book your slot now!</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link href="/booking" className="inline-flex items-center space-x-2 bg-[var(--color-primary)] text-white font-bold text-lg px-10 py-5 rounded-full shadow-md hover:bg-[var(--color-header)] transition-all hover:scale-105 active:scale-95">
                  <FiShoppingBag /> <span>Book Appointment</span>
                </Link>
                <Link href="/gallery" className="inline-flex items-center space-x-2 bg-white border-2 border-pink-100 text-[var(--color-primary)] font-bold text-lg px-10 py-5 rounded-full hover:border-[var(--color-primary)] hover:bg-pink-50/30 transition-all hover:scale-105 active:scale-95">
                  <span>View Gallery</span>
                </Link>
              </div>
            </div>
          </div>
          </ScalePop>
        </div>
      </section>

      {/* Review Submission Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <FiX size={24} />
              </button>
              
              <h3 className="text-2xl font-serif font-bold text-[var(--color-header)] mb-2">Share Your Experience</h3>
              <p className="text-gray-500 text-sm mb-6">Your feedback helps us grow and serve Agra better.</p>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {!user && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newReview.name}
                      onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                      placeholder="e.g. Anjali"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area in Agra (Optional)</label>
                  <input 
                    type="text" 
                    value={newReview.area}
                    onChange={(e) => setNewReview({...newReview, area: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                    placeholder="e.g. Dayalbagh"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({...newReview, rating: star})}
                        className="text-3xl focus:outline-none transition-transform hover:scale-110"
                      >
                        <FiStar fill={star <= newReview.rating ? "#FBBF24" : "none"} className={star <= newReview.rating ? "text-amber-400" : "text-gray-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea 
                    required 
                    rows={4}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                    placeholder="Tell us what you loved..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={submittingReview}
                  className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl shadow-md hover:bg-[var(--color-header)] transition-colors disabled:opacity-70 flex justify-center items-center space-x-2 mt-4"
                >
                  {submittingReview ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Posting...</span>
                    </>
                  ) : "Post Review"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
