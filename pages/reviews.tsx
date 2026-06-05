import SEO from "@/components/SEO";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiStar, FiArrowLeft, FiEdit2, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { AnimatePresence } from "framer-motion";
import seedReviewsData from "@/data/reviews.json";

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(30);
  
  const { user, userData } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    area: "",
    rating: 5,
    comment: ""
  });

  useEffect(() => {
    async function fetchReviews() {
      try {
        const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const reviewSnap = await getDocs(qReviews);
        const fetchedReviews = reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fallback to seed reviews if no real reviews exist yet
        if (fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        } else {
          setReviews(seedReviewsData);
        }
      } catch (error) {
        console.error("Error fetching reviews", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

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
        title="Customer Reviews | Jyoti Mehendi Artist Agra"
        description="Read thousands of verified reviews from our happy clients in Agra. See why Jyoti Mehendi is the top-rated bridal mehndi artist."
      />

      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-8 flex justify-between items-center">
            <Link href="/" className="flex items-center text-gray-500 hover:text-[var(--color-primary)] font-bold transition-colors">
              <FiArrowLeft className="mr-2" /> Back to Home
            </Link>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--color-header)] mb-4">What Our Clients Say</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">Read thousands of reviews from our happy customers across Agra.</p>
            <div className="mt-6 flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex text-amber-400 text-2xl"><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /><FiStar fill="currentColor" /></div>
                <span className="font-bold text-gray-800 text-2xl">4.9/5</span>
                <span className="text-gray-400 text-lg">(2k+ reviews)</span>
              </div>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="flex items-center space-x-2 bg-pink-50 text-[var(--color-primary)] px-6 py-2 rounded-full font-bold hover:bg-pink-100 transition-colors border border-pink-200 shadow-sm"
              >
                <FiEdit2 /> <span>Write a Review</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-12">
              {/* Premium double-pulsing loading spinner and status */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative flex items-center justify-center">
                  {/* Outer decorative pulsing circle */}
                  <div className="absolute animate-ping inline-flex h-16 w-16 rounded-full bg-pink-100 opacity-75"></div>
                  {/* Main spinner */}
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)] relative z-10"></div>
                </div>
                <p className="mt-4 text-sm font-serif font-bold text-[var(--color-header)] tracking-wide animate-pulse">
                  Fetching Royal Reviews...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Loading customer stories & experiences
                </p>
              </div>

              {/* Skeleton cards grid - matches the actual layout (3 columns on desktop, responsive) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-8 rounded-3xl relative shadow-sm border border-gray-100 animate-pulse flex flex-col justify-between"
                    style={{ minHeight: "220px" }}
                  >
                    <div>
                      {/* Star rating skeleton */}
                      <div className="flex space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 bg-pink-50 rounded-full" />
                        ))}
                      </div>

                      {/* Comment text skeleton */}
                      <div className="space-y-2.5 mb-6">
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-11/12"></div>
                        <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                      </div>
                    </div>

                    {/* Profile layout skeleton */}
                    <div className="flex items-center space-x-4 mt-auto">
                      <div className="w-12 h-12 bg-pink-50/60 rounded-full flex-shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-100 rounded w-24"></div>
                        <div className="h-2.5 bg-gray-100 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {reviews.slice(0, visibleCount).map((t, i) => (
                  <motion.div 
                    key={t.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 30) * 0.05 }}
                    className="bg-white p-8 rounded-3xl relative shadow-sm hover:shadow-xl transition-shadow border border-gray-100"
                  >
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
                ))}
              </div>

              {visibleCount < reviews.length && (
                <div className="text-center pb-12">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 30)}
                    className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[var(--color-header)] transition-colors"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
    </>
  );
}
