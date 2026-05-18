import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiSearch, FiCheckCircle, FiClock, FiUser, FiTruck, FiCheck, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { FullScreenLoader } from "@/components/Loader";

export default function VerifyBooking() {
  const [bookingRef, setBookingRef] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingsList, setBookingsList] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBookingsList([]);

    try {
      const formattedRef = bookingRef.trim().toUpperCase();
      const formattedPhone = phone.trim();
      const q = query(
        collection(db, "bookings"), 
        where("bookingRef", "==", formattedRef),
        where("phone", "==", formattedPhone)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No booking found with this Tracking ID and Mobile Number. Please check and try again.");
      } else {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort to show newest first (assuming createdAt exists, otherwise just default order)
        results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setBookingsList(results);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching your booking. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (bookingId: string) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "completed",
        completedBy: "customer"
      });
      
      setBookingsList(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: "completed", completedBy: "customer" } : b
      ));
      alert("Thank you! Your booking has been marked as completed.");
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine current step index for the progress bar
  const getStepIndex = (status: string) => {
    if (status === "completed") return 4;
    if (status === "dispatched") return 3;
    if (status === "assigned") return 2;
    if (status === "pending") return 1;
    return 0; // cancelled or unknown
  };



  return (
    <>
      <Head>
        <title>Track Booking | Jyoti Mehendi</title>
      </Head>
      <Navbar />

      <div className="min-h-screen bg-[#FFF5F7] pt-24 pb-12 px-4">
        {loading && <FullScreenLoader />}
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 mb-3">Track Your Booking</h1>
            <p className="text-gray-600 text-sm">Enter your Tracking ID and registered WhatsApp number for security.</p>
          </div>

          {/* Search Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-pink-100 mb-8 border border-pink-50"
          >
            <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tracking ID</label>
                <input 
                  type="text" 
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  placeholder="e.g. JM-8F4A2"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all uppercase"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="flex items-end pt-2 md:pt-0">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-gradient-to-r from-[var(--color-primary)] to-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-pink-200 transition-all flex items-center justify-center disabled:opacity-70 h-[46px]"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <><FiSearch className="mr-2" /> Track</>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-start">
                <span className="mr-2 mt-0.5">⚠️</span> {error}
              </div>
            )}
          </motion.div>

          {/* Results Area */}
          {bookingsList.map((booking, index) => {
            const stepIndex = getStepIndex(booking.status);
            return (
              <motion.div 
                key={booking.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-pink-100 border border-pink-50 mb-8"
              >
                {/* Status Banner */}
                <div className={`p-6 text-white ${
                  booking.status === 'cancelled' ? 'bg-red-500' :
                  booking.status === 'completed' ? 'bg-green-500' :
                  booking.status === 'dispatched' ? 'bg-gradient-to-r from-pink-500 to-rose-500' :
                  'bg-gradient-to-r from-[var(--color-primary)] to-pink-600'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Current Status</p>
                      <h2 className="text-2xl font-black uppercase tracking-wider">
                        {booking.status}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Booking ID</p>
                      <p className="font-mono text-lg font-bold">{booking.bookingRef || booking.id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Live Tracking Timeline */}
                {booking.status !== 'cancelled' && (
                  <div className="p-8 border-b border-gray-100">
                    <div className="relative">
                      {/* Progress Bar Background */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                      
                      {/* Active Progress Bar */}
                      <div 
                        className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${((stepIndex - 1) / 3) * 100}%` }}
                      ></div>

                      <div className="relative flex justify-between">
                        {/* Step 1: Pending */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${stepIndex >= 1 ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-200 text-gray-400'}`}>
                            <FiClock />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wider ${stepIndex >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>Received</span>
                        </div>

                        {/* Step 2: Assigned */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${stepIndex >= 2 ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-200 text-gray-400'}`}>
                            <FiUser />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wider ${stepIndex >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>Assigned</span>
                        </div>

                        {/* Step 3: Dispatched */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${stepIndex >= 3 ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-200 text-gray-400'}`}>
                            {stepIndex === 3 && <div className="absolute inset-0 rounded-full border-2 border-pink-400 animate-ping"></div>}
                            <FiTruck />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wider ${stepIndex >= 3 ? 'text-pink-600' : 'text-gray-400'}`}>On The Way</span>
                        </div>

                        {/* Step 4: Completed */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${stepIndex >= 4 ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400'}`}>
                            <FiCheck />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wider ${stepIndex >= 4 ? 'text-green-600' : 'text-gray-400'}`}>Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking Details */}
                <div className="p-6 md:p-8 bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full mr-2"></span> Service Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service</p>
                      <p className="font-bold text-gray-900">{booking.serviceTitle}</p>
                      <p className="text-sm font-bold text-pink-600 mt-1">₹{booking.price}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                      <p className="font-bold text-gray-900">{booking.bookingDateString}</p>
                      <p className="text-sm font-bold text-gray-600 mt-1">{booking.timeSlot}</p>
                    </div>
                  </div>

                  {/* Customer Action Area */}
                  {(booking.status === "assigned" || booking.status === "dispatched") && (
                    <div className="mt-8 bg-pink-50 border border-pink-100 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-white text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-xl">
                        <FiCheckCircle />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Service Completed?</h4>
                      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        If the artist has finished applying your mehendi, please confirm by marking the service as completed.
                      </p>
                      <button 
                        onClick={() => markAsCompleted(booking.id)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center mx-auto disabled:opacity-70"
                      >
                        {loading ? "Updating..." : "Yes, Mark as Completed"}
                      </button>
                    </div>
                  )}

                  <div className="mt-8 text-center">
                    <Link href={`/booking-slip/${booking.id}`} className="inline-flex items-center text-sm font-bold text-[var(--color-primary)] hover:text-pink-700 transition-colors">
                      View Official Receipt <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>

              </motion.div>
            );
          })}

        </div>
      </div>
    </>
  );
}
