import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { FiCalendar, FiClock, FiMapPin, FiStar, FiLogOut, FiCheckCircle, FiXCircle, FiPhone, FiGift, FiCopy } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { FullScreenLoader } from "@/components/Loader";

export default function Dashboard() {
  const { user, userData, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    // 1. Live Bookings Subscription
    const q = query(collection(db, "bookings"), where("customerId", "==", user.uid));
    const unsubBookings = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date (descending)
      data.sort((a: any, b: any) => {
        if (!a.bookingDate || !b.bookingDate) return 0;
        return b.bookingDate.seconds - a.bookingDate.seconds;
      });
      setBookings(data);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard bookings sync error:", err);
      setLoading(false);
    });

    // 2. Live Partners Subscription
    const unsubPartners = onSnapshot(collection(db, "partners"), (snapshot) => {
      setPartners(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Dashboard partners sync error:", err);
    });

    return () => {
      unsubBookings();
      unsubPartners();
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: "cancelled" });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal || !user) return;
    try {
      const activeBooking = bookings.find(b => b.id === reviewModal);
      const partnerId = activeBooking?.partnerId || null;
      
      const reviewData: any = {
        bookingId: reviewModal,
        customerId: user.uid,
        customerName: userData?.name || "Customer",
        rating,
        comment,
        createdAt: serverTimestamp(),
      };

      if (partnerId) {
        reviewData.partnerId = partnerId;
        
        // Fetch current partner rating and completed jobs to calculate average
        const partnerRef = doc(db, "partners", partnerId);
        const partnerSnap = await getDoc(partnerRef);
        
        if (partnerSnap.exists()) {
          const pData = partnerSnap.data();
          const currentRating = pData.rating || 5.0;
          const completedJobs = pData.completedJobs || 0;
          
          // New average rating calculation
          const newAvgRating = ((currentRating * completedJobs) + rating) / (completedJobs + 1);
          
          await updateDoc(partnerRef, {
            rating: Number(newAvgRating.toFixed(2))
          });
        }
      }

      await addDoc(collection(db, "reviews"), reviewData);
      
      // Mark booking itself as reviewed
      await updateDoc(doc(db, "bookings", reviewModal), { isReviewed: true });
      
      // Update local state
      setBookings(bookings.map(b => b.id === reviewModal ? { ...b, isReviewed: true } : b));
      
      alert("Thank you for your rating! Your review has been submitted successfully.");
      setReviewModal(null);
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    }
  };

  if (authLoading || loading) {
    return <FullScreenLoader />;
  }

  if (!user) return null;

  const upcomingBookings = bookings.filter(b => b.status === "pending" || b.status === "assigned" || b.status === "in-progress");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <>
      <Head>
        <title>My Dashboard | Jyoti Mehendi Artist</title>
      </Head>

      <div className="bg-[var(--color-background)] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-center mb-8 border border-pink-50">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full flex items-center justify-center text-white text-2xl font-serif font-bold shadow-md">
                {userData?.name?.charAt(0) || user.phoneNumber?.charAt(3) || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-header)] font-serif">Welcome, {userData?.name || "Customer"}!</h1>
                <p className="text-gray-500">{user.phoneNumber || user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors bg-gray-50 px-4 py-2 rounded-full"
            >
              <FiLogOut />
              <span>Sign Out</span>
            </button>
          </div>

          {router.query.bookingSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-8 flex items-center space-x-3 border border-green-100">
              <FiCheckCircle size={24} />
              <div>
                <h4 className="font-bold">Booking Successful!</h4>
                <p className="text-sm">Your appointment has been confirmed. We'll send you an update when a partner is assigned.</p>
              </div>
            </div>
          )}

          {/* Wallet & Referral Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div>
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <FiGift className="text-pink-400" />
                  <span className="text-sm font-bold uppercase tracking-wider">My Wallet</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">₹{userData?.walletBalance || 0}</div>
                <p className="text-xs text-gray-400">Available Balance</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-300">₹{userData?.pendingWalletBalance || 0}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Pending Unlock</div>
                </div>
                <a href="/booking" className="text-xs font-bold bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-full transition-colors">Use Now</a>
              </div>
            </div>

            {/* Refer & Earn Banner */}
            <div className="md:col-span-2 bg-gradient-to-r from-pink-50 to-pink-100 rounded-3xl p-6 shadow-sm border border-pink-200 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-3 py-1 bg-pink-200 text-pink-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">Refer & Earn ₹100</div>
                <h3 className="text-xl font-bold text-gray-800 font-serif mb-2">Invite Friends & Get Rewarded!</h3>
                <p className="text-sm text-gray-600 mb-4">Unki pehli booking complete hone par aapko milenge ₹100 seedha aapke wallet mein, aur unhe ₹50 ka instant discount!</p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 w-full sm:w-auto">
                    <span className="text-gray-500 text-xs mr-2 uppercase">Your Code:</span>
                    <span className="font-mono font-bold text-gray-800 tracking-wider">{userData?.referralCode || "N/A"}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(userData?.referralCode || "");
                        alert("Referral code copied!");
                      }} 
                      className="ml-3 text-gray-400 hover:text-pink-500 transition-colors"
                      title="Copy Code"
                    >
                      <FiCopy />
                    </button>
                  </div>
                  
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Hey! Book the best Mehndi artist from Jyoti Mehendi & get ₹50 OFF on your first booking using my code: *${userData?.referralCode || ""}*\n\nBook here: https://jyotimhendi.in/login?ref=${userData?.referralCode || ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white px-5 py-2.5 rounded-xl font-bold text-sm w-full sm:w-auto transition-colors shadow-sm"
                  >
                    <FaWhatsapp size={18} />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Lists */}
          <div className="space-y-12">
            
            {/* Upcoming */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-header)] mb-6 flex items-center"><FiClock className="mr-2"/> Upcoming Appointments</h2>
              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-100 border-dashed">
                  No upcoming appointments. <a href="/booking" className="text-[var(--color-primary)] font-semibold hover:underline">Book one now!</a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map(booking => {
                    const assignedPartner = partners.find(p => p.id === booking.partnerId);
                    return (
                      <div key={booking.id} className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black text-white rounded-bl-xl tracking-wider ${
                          booking.status === 'pending' ? 'bg-orange-400' :
                          booking.status === 'assigned' ? 'bg-blue-500' :
                          booking.status === 'dispatched' ? 'bg-pink-500 animate-pulse' :
                          booking.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {booking.status.toUpperCase()}
                        </div>
                        
                        <h3 className="text-xl font-bold text-[var(--color-header)] font-serif mb-4 pt-2">{booking.serviceTitle}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                          <p className="flex items-center"><FiCalendar className="mr-2 text-[var(--color-primary)]"/> {booking.bookingDateString}</p>
                          <p className="flex items-center"><FiClock className="mr-2 text-[var(--color-primary)]"/> {booking.timeSlot}</p>
                          <p className="flex items-center"><FiMapPin className="mr-2 text-[var(--color-primary)] shrink-0"/> <span className="line-clamp-1">{booking.address}</span></p>
                        </div>
                        
                        {/* Live Milestone Tracker */}
                        <div className="mt-4 mb-6 pt-4 border-t border-gray-100">
                          <p className="text-[10px] font-black uppercase text-pink-500 tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                            Live Booking Tracker
                          </p>
                          
                          <div className="relative flex justify-between items-center w-full px-2">
                            {/* Connection line behind steps */}
                            <div className="absolute left-4 right-4 top-[14px] h-[2px] bg-gray-100 z-0"></div>
                            <div 
                              className="absolute left-4 top-[14px] h-[2px] bg-gradient-to-r from-pink-500 to-pink-400 z-0 transition-all duration-500" 
                              style={{
                                width: booking.status === 'pending' ? '0%' : 
                                       booking.status === 'assigned' ? '50%' : 
                                       booking.status === 'dispatched' ? '100%' : '100%'
                              }}
                            ></div>
                            
                            {/* Step 1: Booked */}
                            <div className="flex flex-col items-center z-10">
                              <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                                ✓
                              </div>
                              <span className="text-[8px] font-extrabold text-gray-500 mt-1 uppercase tracking-wider">Booked</span>
                            </div>

                            {/* Step 2: Assigned */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all duration-300 ${
                                booking.status !== 'pending' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {booking.status !== 'pending' ? '✓' : '2'}
                              </div>
                              <span className="text-[8px] font-extrabold text-gray-500 mt-1 uppercase tracking-wider">Assigned</span>
                            </div>

                            {/* Step 3: En Route */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all duration-300 ${
                                booking.status === 'dispatched' || booking.status === 'completed' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {booking.status === 'dispatched' || booking.status === 'completed' ? '✓' : '3'}
                              </div>
                              <span className="text-[8px] font-extrabold text-gray-500 mt-1 uppercase tracking-wider">En Route</span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Artist Details Card */}
                        {assignedPartner && (
                          <div className="bg-pink-50/40 border border-pink-100/50 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white">
                                {assignedPartner.name?.charAt(0) || "A"}
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Assigned Artist</p>
                                <h4 className="text-sm font-bold text-gray-800 font-serif">{assignedPartner.name}</h4>
                                <span className="text-[9px] text-amber-500 font-bold">⭐ {assignedPartner.rating?.toFixed(1) || "5.0"} Rating</span>
                              </div>
                            </div>
                            {assignedPartner.phone && (
                              <a 
                                href={`tel:${assignedPartner.phone}`} 
                                className="bg-green-50 hover:bg-green-100 text-green-600 font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm border border-green-100/40"
                              >
                                📞 Call Artist
                              </a>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                          <span className="font-bold text-[var(--color-primary)]">₹{booking.price}</span>
                          {booking.status === "pending" && (
                            <button onClick={() => handleCancelBooking(booking.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors font-bold uppercase tracking-wider text-[10px]">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Past */}
            <section>
              <h2 className="text-xl font-bold text-[var(--color-header)] mb-6 flex items-center"><FiCheckCircle className="mr-2"/> Past Appointments</h2>
              {pastBookings.length === 0 ? (
                <div className="text-gray-400 text-sm italic">No past appointments.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="bg-white rounded-2xl p-6 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-700 font-serif">{booking.serviceTitle}</h3>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{booking.bookingDateString}</p>
                      
                      {booking.status === "completed" && (
                        booking.isReviewed ? (
                          <div className="text-center text-xs font-bold text-green-600 bg-green-50/50 py-2.5 rounded-xl border border-green-200/30 flex items-center justify-center gap-1">
                            ⭐ Rating Submitted
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReviewModal(booking.id)}
                            className="w-full py-2 bg-gray-50 text-[var(--color-primary)] border border-pink-100 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                          >
                            Leave a Review
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setReviewModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><FiXCircle size={24}/></button>
            <h2 className="text-2xl font-bold font-serif text-[var(--color-header)] mb-6 text-center">Rate your experience</h2>
            
            <form onSubmit={submitReview}>
              <div className="flex justify-center space-x-2 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                    <FiStar size={36} className={`${rating >= star ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <textarea
                required
                className="w-full border border-gray-200 rounded-xl p-4 mb-6 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
                rows={4}
                placeholder="Share details of your experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              ></textarea>
              <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-full hover:bg-[var(--color-header)] transition-colors">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
