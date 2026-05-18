import SEO from "@/components/SEO";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiClock, FiCreditCard, FiMapPin, FiCheck, FiTruck, FiAward, FiHeart, FiStar, FiShoppingBag, FiArrowRight, FiEdit2, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import seedReviewsData from "@/data/reviews.json";

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
  const [heroSlides, setHeroSlides] = useState<any[]>(PREMIUM_SLIDES);
  const [expressZones, setExpressZones] = useState<any[]>([]);
  const [eventPackages, setEventPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

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
          setHeroSlides(fetchedSlides);
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

        // Fetch Real Reviews
        const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
        const reviewSnap = await getDocs(qReviews);
        const fetchedReviews = reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Merge fetched and seed reviews
        setReviews([...fetchedReviews, ...seedReviews]);

      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides]);

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
        title="Jyoti Mehendi Artist Agra | Best Bridal & Arabic Henna Designs"
        description="Looking for the best Mehndi artist in Agra? Book Jyoti Mehendi for stunning Bridal, Arabic, and custom henna designs. Affordable packages & home service available."
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

      {/* Animated Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-black">
        <AnimatePresence>
          {heroSlides.length > 0 ? (
            <motion.div
              key={heroSlides[currentSlide].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Desktop Image */}
              <img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="hidden md:block w-full h-full object-cover animate-ken-burns"
              />
              {/* Mobile Image */}
              <img
                src={heroSlides[currentSlide].mobileImage || heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="block md:hidden w-full h-full object-cover animate-ken-burns"
              />
              
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/20 via-transparent to-[var(--color-header)]/60 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-header)]/90 via-black/30 to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center text-center p-4 sm:p-6">
                <div className="max-w-3xl flex flex-col items-center transform -translate-y-4 md:translate-y-0">
                  {/* Premium gold branding tag */}
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[9px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-amber-400 mb-3 md:mb-4 bg-black/55 backdrop-blur-md px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full border border-amber-500/20 shadow-lg flex items-center space-x-2"
                  >
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-amber-500"></span>
                    </span>
                    <span>👑 AGRA'S PREMIER MEHNDI BOUTIQUE</span>
                  </motion.span>

                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl sm:text-4xl md:text-6xl font-serif font-bold text-white mb-3 md:mb-5 drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] leading-tight tracking-wide"
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xs sm:text-sm md:text-lg text-white/95 mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md leading-relaxed bg-black/45 backdrop-blur-[4px] py-2 px-3.5 sm:py-3.5 sm:px-6 rounded-xl sm:rounded-2xl border border-white/10"
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Link href="/booking" className="bg-[var(--color-primary)] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-sm sm:text-lg hover:bg-[var(--color-header)] transition-all shadow-xl hover:scale-105 active:scale-95 border border-white/15 hover:border-pink-200 inline-block">
                      Book Your Slot Now
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-[var(--color-primary)] animate-pulse"></div>
          )}
        </AnimatePresence>

        {/* Slider Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 transition-all rounded-full ${currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            ></button>
          ))}
        </div>
      </section>

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

      {/* Featured Services */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-header)] font-serif mb-4">Our Featured Designs</h2>
            <p className="text-gray-600">Choose from our most loved mehndi patterns</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                key={service.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-64 overflow-hidden bg-pink-50">
                  <img 
                    src={service.image || getDefaultImage(service.title)} 
                    onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
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
              );
            }) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded-full w-full"></div>
                </div>
              ))
            )}
          </div>
          
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
              <div className="lg:w-1/2">
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
              </div>

              <div className="lg:w-1/2 relative mt-8 lg:mt-0">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Why Choose Us */}
      <section className="py-24 bg-white px-4 relative overflow-hidden">
        <div className="absolute -left-40 top-20 w-96 h-96 bg-amber-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="absolute -right-40 bottom-20 w-96 h-96 bg-pink-100 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-header)] font-serif mb-4">Why Agra Chooses Us</h2>
            <p className="text-gray-600">Delivering perfection in the City of Love</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { icon: <FiHeart className="text-pink-500" />, title: "Organic Henna", desc: "Chemical-free, skin-friendly, and deep dark stain guaranteed." },
              { icon: <FiAward className="text-amber-500" />, title: "10+ Years Exp.", desc: "Expert artists with a decade of experience in intricate bridal art." },
              { icon: <FiCheckCircle className="text-green-500" />, title: "Punctual", desc: "We value your time. Artists arrive exactly on schedule." },
              { icon: <FiStar className="text-blue-500" />, title: "Customized", desc: "Bring any design from Pinterest, and we will recreate it flawlessly." },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 bg-white/40 backdrop-blur-md border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:border-pink-100 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:bg-gradient-to-br group-hover:from-pink-50 group-hover:to-amber-50 group-hover:shadow-inner transition-all duration-500 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-header)] mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: How It Works */}
      <section className="py-24 bg-gradient-to-b from-white to-pink-50/20 px-4 relative overflow-hidden">
        {/* Soft Decorative Blurred Accents */}
        <div className="absolute right-10 top-1/4 w-80 h-80 bg-pink-100/35 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-10 bottom-1/4 w-72 h-72 bg-amber-100/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4 text-[var(--color-header)]">Your Royal Experience</h2>
            <p className="text-gray-500">Simple steps to get your perfect mehndi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-200/40 to-transparent -translate-y-1/2 z-0"></div>
            
            {[
              { step: "01", title: "Select Service", desc: "Pick your design from our gallery or event packages." },
              { step: "02", title: "Choose Slot", desc: "Select a date and time that works best for you." },
              { step: "03", title: "Enjoy Art", desc: "Our expert artist reaches you and works their magic!" },
            ].map((s, i) => (
              <div key={i} className="relative z-10 bg-white/60 backdrop-blur-md border border-pink-100/40 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:bg-white/90 transition-all duration-500 text-center hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-md shadow-pink-500/20">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 font-serif">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Royal Wedding & Event Packages */}
      <section id="packages" className="py-32 bg-pink-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Mughal Inspired Background Accents */}
        <div className="absolute -right-40 top-0 w-96 h-96 bg-amber-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -left-40 bottom-0 w-96 h-96 bg-pink-300 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold text-[var(--color-header)] font-serif mb-6 leading-tight drop-shadow-sm">
              Royal <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500">Agra Wedding</span> <br/> Contracts
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              Agra ki har shadi ko Taj Mahal jaisi yaadgar aur khubsurat banane ke liye hamare sabse premium bridal contracts. 
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {eventPackages.length > 0 && !loading ? eventPackages.map((pkg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                key={pkg.id} 
                className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-pink-900/5 border border-white/50 flex flex-col overflow-hidden group hover:shadow-pink-900/10 transition-all duration-500"
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
            )) : (
              [1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-[40px] shadow-2xl border border-pink-100 flex flex-col overflow-hidden h-[500px]">
                  <div className="h-32 bg-amber-50 rounded-t-[40px]"></div>
                  <div className="p-10 space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="space-y-4 pt-6">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

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
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-header)] font-serif mb-4">Real Customer <br/> <span className="text-[var(--color-primary)]">Love Stories</span></h2>
              <p className="text-gray-500 mb-6 md:mb-0">See what our clients in Agra say about us</p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-end space-y-4">
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
            </div>
          </div>

          {/* Horizontal scrollable container for reviews */}
          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory gap-6 hide-scrollbar">
            {reviews.length > 0 ? reviews.map((t, i) => (
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
              <div className="w-full text-center py-12 text-gray-400">Loading reviews...</div>
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
