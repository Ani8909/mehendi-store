import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, addDoc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { 
  FiMapPin, FiPhone, FiCheck, FiX, FiUploadCloud, FiLogOut, FiNavigation, 
  FiMessageCircle, FiBox, FiTrendingUp, FiCheckCircle, FiBell, FiList, FiClock, FiAlertCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FullScreenLoader } from "@/components/Loader";

// Native Web Audio chime generator (No network or asset dependencies, works anywhere!)
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Low-High sweet notification chime
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, audioCtx.currentTime, 0.15); // C5
    playTone(783.99, audioCtx.currentTime + 0.12, 0.3); // G5
  } catch (e) {
    console.log("AudioContext blocked or not supported", e);
  }
};

export default function PartnerDashboard() {
  const { user, userData, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"jobs" | "kit" | "earnings">("jobs");
  
  // Realtime Data
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Upload Photo State
  const [uploadModal, setUploadModal] = useState<string | null>(null); // bookingId
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [category, setCategory] = useState("Completed Work");

  // Supply inventory refill state
  const [refillModal, setRefillModal] = useState(false);
  const [refillItem, setRefillItem] = useState("Organic Henna Cones (10 Pcs)");
  const [refillQty, setRefillQty] = useState(1);
  const [refillNotes, setRefillNotes] = useState("");
  const [refillSuccess, setRefillSuccess] = useState("");

  // Supply Inventory checklist
  const [inventory, setInventory] = useState([
    { id: "cones", name: "Bridal Henna Cones (Organic)", qty: 8, target: 12, unit: "Pcs", status: "Good" },
    { id: "oil", name: "Eucalyptus Premium Oil", qty: 1, target: 2, unit: "Bottle", status: "Running Low" },
    { id: "sealant", name: "Lemon-Sugar Sealant Spray", qty: 1, target: 1, unit: "Bottle", status: "Good" },
    { id: "glitter", name: "Premium Glitters & Stones", qty: 3, target: 5, unit: "Box", status: "Good" },
    { id: "aftercare", name: "Mehndi Aftercare Cards", qty: 5, target: 25, unit: "Leaflets", status: "Critical" },
  ]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== "partner")) {
      router.push("/login");
    }
  }, [user, userData, authLoading, router]);

  // Real-time synchronization of bookings, notifications and partner metrics
  useEffect(() => {
    if (!user || userData?.role !== "partner") return;

    setLoading(true);

    // 1. Sync Partner Profile
    const profileRef = doc(db, "partners", user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setPartnerProfile({ id: snap.id, ...snap.data() });
      } else {
        // Fallback for demo / unlinked partners
        setPartnerProfile({
          id: user.uid,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "Not specified",
          area: "Agra Center",
          isAvailable: true,
          earnings: 0,
          completedJobs: 0,
          rating: 5.0
        });
      }
    });

    // 2. Sync Bookings in Real-time
    const bookingsQuery = query(collection(db, "bookings"), where("partnerId", "==", user.uid));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      // Sort by creation time (newest first) or date
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      // Notification Logic: Detect new bookings assigned!
      if (!isFirstLoad.current && data.length > bookings.length) {
        const newlyAdded = data.find(newB => !bookings.some(oldB => oldB.id === newB.id));
        if (newlyAdded && newlyAdded.status === "assigned") {
          // Play a native tone and show toast
          playNotificationSound();
          setToastMessage(`🆕 Naya Kaam! ${newlyAdded.customerName} - ${newlyAdded.serviceTitle}`);
          
          // Add to local notification logs
          const newNotif = {
            id: Date.now().toString(),
            title: "Naya Kaam assigned!",
            body: `${newlyAdded.customerName} at ${newlyAdded.address}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: true
          };
          setNotifications(prev => [newNotif, ...prev]);

          // Clear toast after 6 seconds
          setTimeout(() => setToastMessage(null), 6000);
        }
      }

      setBookings(data);
      isFirstLoad.current = false;
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeBookings();
    };
  }, [user, userData]);

  // Update Booking Status Flow
  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const docRef = doc(db, "bookings", bookingId);
      await updateDoc(docRef, { status });
      
      // Add notification log
      const newNotif = {
        id: Date.now().toString(),
        title: `Work Status Updated`,
        body: `Status for job marked as ${status.toUpperCase()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      if (status === "completed") {
        // Trigger photo upload modal
        setUploadModal(bookingId);
        
        // Dynamically increment completed jobs & earnings in partner profile
        const activeJob = bookings.find(b => b.id === bookingId);
        const jobPrice = activeJob?.price || 0;
        
        if (partnerProfile) {
          const newCompleted = (partnerProfile.completedJobs || 0) + 1;
          const newEarnings = (partnerProfile.earnings || 0) + jobPrice;
          
          await updateDoc(doc(db, "partners", user!.uid), {
            completedJobs: newCompleted,
            earnings: newEarnings
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // Availability toggle
  const toggleAvailability = async () => {
    if (!partnerProfile) return;
    const current = !!partnerProfile.isAvailable;
    try {
      await updateDoc(doc(db, "partners", user!.uid), {
        isAvailable: !current
      });
    } catch (e) {
      console.error("Failed to toggle availability", e);
    }
  };

  // Submit supply refill request to Admin
  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefillSuccess("");
    try {
      await addDoc(collection(db, "refill_requests"), {
        partnerId: user!.uid,
        partnerName: partnerProfile?.name || userData.name,
        item: refillItem,
        qty: Number(refillQty) || 1,
        notes: refillNotes,
        status: "pending",
        createdAt: serverTimestamp()
      });

      setRefillSuccess("🎉 Refill request submitted successfully to Admin!");
      setRefillNotes("");
      setRefillQty(1);

      // Add to notification history
      const newNotif = {
        id: Date.now().toString(),
        title: "Supply Refill Request Sent",
        body: `Requested ${refillQty}x ${refillItem}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      setTimeout(() => {
        setRefillModal(false);
        setRefillSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Refill error:", err);
      alert("Failed to submit refill request");
    }
  };

  // Portfolio Cloudinary Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please choose an image under 5MB.");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });

        const result = await response.json();
        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Image upload failed");
        }
      } catch (err) {
        console.error(err);
        alert("Upload error");
      } finally {
        setUploadingImage(false);
      }
    };
  };

  const submitGalleryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageURL) return alert("Please select an image first");

    try {
      await addDoc(collection(db, "designs_gallery"), {
        imageURL,
        category,
        uploadedBy: user?.uid,
        artistName: partnerProfile?.name || userData.name,
        uploadedAt: serverTimestamp()
      });

      alert("🎉 Gorgeous design uploaded to main portfolio!");
      setUploadModal(null);
      setImageURL("");
    } catch (err) {
      console.error(err);
      alert("Failed to link image to portfolio");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading || loading) return <FullScreenLoader />;
  if (!user || userData?.role !== "partner") return null;

  return (
    <>
      <Head>
        <title>Artist Hub | Jyoti Mehendi</title>
      </Head>

      <div className="bg-gradient-to-b from-pink-50/10 to-gray-50 min-h-screen pb-16 pt-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Real-time In-App Notification Toast */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-24 left-4 right-4 z-50 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-2xl p-4 shadow-xl border border-pink-400 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-pink-100">Task Assigned!</h4>
                    <p className="text-sm font-bold mt-0.5 leading-snug">{toastMessage}</p>
                  </div>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><FiX/></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Premium Card (Artist Profile & Quick Stats) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100/30 rounded-bl-[4rem] pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-pink-100 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  OFFICIAL PARTNER
                </span>
                <h1 className="text-2xl font-black text-gray-800 mt-2 font-serif">{partnerProfile?.name || userData.name}</h1>
                <p className="text-xs text-gray-400 font-semibold flex items-center mt-1">
                  <FiMapPin className="mr-1 text-[var(--color-primary)]" /> Operational Area: {partnerProfile?.area || "Agra"}
                </p>
              </div>
              <div className="flex space-x-2">
                {/* Notification Bell */}
                <button 
                  onClick={() => setShowNotifPanel(!showNotifPanel)}
                  className="bg-gray-100 hover:bg-pink-50 text-gray-600 hover:text-[var(--color-primary)] p-2.5 rounded-full relative transition-colors"
                >
                  <FiBell size={18}/>
                  {notifications.some(n => n.unread) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>
                <button onClick={handleSignOut} className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 p-2.5 rounded-full transition-colors">
                  <FiLogOut size={18}/>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 mt-4 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jobs Done</p>
                <p className="text-lg font-black text-gray-800 mt-0.5">{partnerProfile?.completedJobs || 0}</p>
              </div>
              <div className="border-x border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Earnings</p>
                <p className="text-lg font-black text-green-600 mt-0.5">₹{partnerProfile?.earnings || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">My Rating</p>
                <p className="text-lg font-black text-amber-500 mt-0.5">⭐ {partnerProfile?.rating?.toFixed(1) || "5.0"}</p>
              </div>
            </div>

            {/* Live Availability Switch */}
            <div className="flex items-center justify-between bg-pink-50/30 p-3 rounded-2xl mt-4 border border-pink-100/20">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${partnerProfile?.isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
                <span className="text-xs font-black uppercase text-gray-600 tracking-wide">
                  {partnerProfile?.isAvailable ? "Active & Accepting Bookings" : "Offline / Unavailable"}
                </span>
              </div>
              <button 
                onClick={toggleAvailability}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${partnerProfile?.isAvailable ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}
              >
                <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md"></motion.div>
              </button>
            </div>
          </div>

          {/* Real-time Notification Panel */}
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-2"><FiBell className="text-pink-500"/> Activity Feed</h3>
                  <button 
                    onClick={() => {
                      setNotifications(notifications.map(n => ({ ...n, unread: false })));
                      setShowNotifPanel(false);
                    }} 
                    className="text-xs font-bold text-pink-600 hover:underline"
                  >
                    Clear Badges
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 italic py-4">No recent activities</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-start text-xs border border-gray-100/50">
                        <div>
                          <p className="font-bold text-gray-700">{n.title}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">{n.body}</p>
                        </div>
                        <span className="text-[9px] font-semibold text-gray-400">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="flex bg-white rounded-2xl shadow-sm p-1.5 border border-pink-100/10">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === "jobs" ? "bg-[var(--color-primary)] text-white" : "text-gray-500 hover:text-pink-600"}`}
            >
              <FiList/> <span>My Jobs ({bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").length})</span>
            </button>
            <button
              onClick={() => setActiveTab("kit")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === "kit" ? "bg-[var(--color-primary)] text-white" : "text-gray-500 hover:text-pink-600"}`}
            >
              <FiBox/> <span>Supply Kit</span>
            </button>
            <button
              onClick={() => setActiveTab("earnings")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === "earnings" ? "bg-[var(--color-primary)] text-white" : "text-gray-500 hover:text-pink-600"}`}
            >
              <FiTrendingUp/> <span>Earning Log</span>
            </button>
          </div>

          {/* Tabs Content */}
          <div className="space-y-4">
            
            {/* 1. JOBS TAB */}
            {activeTab === "jobs" && (
              <div className="space-y-4">
                {bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200 border-dashed shadow-sm">
                    <p className="text-3xl">☕</p>
                    <p className="text-sm font-bold mt-2">No active bookings assigned today!</p>
                    <p className="text-xs text-gray-400 mt-1">Enjoy your tea or update your supplies tab.</p>
                  </div>
                ) : (
                  bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").map(booking => (
                    <div key={booking.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 flex flex-col">
                      {/* Top status banner */}
                      <div className={`px-5 py-3 text-white text-xs font-black uppercase tracking-widest flex justify-between items-center ${
                        booking.status === "assigned" ? "bg-blue-600" : "bg-gradient-to-r from-pink-500 to-rose-500"
                      }`}>
                        <span>🗓️ {booking.bookingDateString} | {booking.timeSlot}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black">{booking.status}</span>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-pink-50 text-pink-600 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                              {booking.serviceTitle}
                            </span>
                            <h3 className="text-lg font-black text-gray-800 mt-2 font-serif">Customer: {booking.customerName}</h3>
                          </div>
                          <p className="text-lg font-black text-[var(--color-primary)]">₹{booking.price}</p>
                        </div>

                        {/* Customer Details Display & Direct Actions */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 space-y-3 text-xs border border-gray-100">
                          {/* Address & Navigation */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start text-gray-600 leading-normal flex-1">
                              <FiMapPin className="text-[var(--color-primary)] mr-2 shrink-0 mt-0.5 text-sm"/>
                              <span>{booking.address}</span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-white border border-gray-200 text-blue-600 font-extrabold hover:bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 uppercase tracking-wider text-[10px]"
                            >
                              <FiNavigation size={12}/> Route
                            </a>
                          </div>

                          {/* Contact Actions */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-2">
                            <div className="flex items-center text-gray-700 font-bold">
                              <FiPhone className="text-green-500 mr-2"/>
                              <span>{booking.phone}</span>
                            </div>
                            <div className="flex gap-2">
                              {/* Direct Whatsapp button */}
                              <a
                                href={`https://wa.me/91${booking.phone}?text=Hello%20${encodeURIComponent(booking.customerName)}%2C%20I%20am%20your%20Mehndi%20Artist%20from%20Jyoti%20Mehendi.%20I%20am%20on%20my%20way!`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-green-50 hover:bg-green-100 text-green-600 p-2.5 rounded-xl border border-green-200 flex items-center justify-center"
                              >
                                <FiMessageCircle size={14}/>
                              </a>
                              {/* Direct call button */}
                              <a
                                href={`tel:${booking.phone}`}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl border border-blue-200 flex items-center justify-center"
                              >
                                <FiPhone size={14}/>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Workflow Buttons */}
                        <div className="flex gap-2 pt-2">
                          {booking.status === "assigned" && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "in-progress")}
                              className="w-full bg-[var(--color-primary)] hover:bg-pink-700 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-100 flex items-center justify-center gap-2"
                            >
                              <FiClock/> Start Journey (En Route)
                            </button>
                          )}
                          {booking.status === "in-progress" && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              className="w-full bg-green-500 hover:bg-green-600 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                            >
                              <FiCheckCircle/> Work Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. SUPPLY KIT TAB */}
            {activeTab === "kit" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">My Mehndi Kit Supply</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Track and refill your organic mehndi products</p>
                  </div>
                  <button 
                    onClick={() => setRefillModal(true)}
                    className="bg-[var(--color-primary)] hover:bg-pink-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-pink-100"
                  >
                    Request Refill
                  </button>
                </div>

                {/* Supplies Checklist */}
                <div className="space-y-4">
                  {inventory.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div>
                        <p className="font-extrabold text-xs text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Target: {item.target} {item.unit}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          item.status === 'Good' ? 'bg-green-100 text-green-700' :
                          item.status === 'Running Low' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                        
                        {/* Custom Counter adjustment */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                          <button 
                            onClick={() => {
                              const updated = inventory.map(i => {
                                if (i.id === item.id) {
                                  const val = Math.max(0, i.qty - 1);
                                  const status = val <= 2 ? "Critical" : val <= 4 ? "Running Low" : "Good";
                                  return { ...i, qty: val, status };
                                }
                                return i;
                              });
                              setInventory(updated);
                            }}
                            className="px-2 py-0.5 text-gray-400 hover:text-black font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-gray-700">{item.qty}</span>
                          <button 
                            onClick={() => {
                              const updated = inventory.map(i => {
                                if (i.id === item.id) {
                                  const val = Math.min(i.target * 2, i.qty + 1);
                                  const status = val <= 2 ? "Critical" : val <= 4 ? "Running Low" : "Good";
                                  return { ...i, qty: val, status };
                                }
                                return i;
                              });
                              setInventory(updated);
                            }}
                            className="px-2 py-0.5 text-gray-400 hover:text-black font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. EARNINGS LEDGER TAB */}
            {activeTab === "earnings" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Earning Log</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Detailed records of payments and completed mehndi contracts</p>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {bookings.filter(b => b.status === "completed").length === 0 ? (
                    <p className="text-center text-xs text-gray-400 italic py-8">Complete your first job to see earnings!</p>
                  ) : (
                    bookings.filter(b => b.status === "completed").map(b => (
                      <div key={b.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center text-xs border border-gray-100/50">
                        <div>
                          <p className="font-black text-gray-800 text-sm">{b.customerName}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-1">{b.serviceTitle} | {b.bookingDateString}</p>
                          <span className="inline-flex bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold mt-2 uppercase tracking-wide">
                            Payment Processed
                          </span>
                        </div>
                        <p className="text-base font-black text-green-600">+₹{b.price}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cloudinary Gallery Portfolio Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setUploadModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><FiX size={24}/></button>
            <h2 className="text-2xl font-bold font-serif text-[var(--color-header)] mb-2 text-center">Great Job! 🎉</h2>
            <p className="text-center text-gray-500 mb-6 text-xs leading-normal">Upload a picture of the completed design to feature it live in the gallery and show off your work!</p>
            
            <form onSubmit={submitGalleryUpload}>
              <div className="mb-4">
                <div className="border-2 border-dashed border-pink-200 rounded-2xl p-6 text-center hover:bg-pink-50/10 transition-colors relative h-48 flex items-center justify-center overflow-hidden">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {uploadingImage ? (
                    <div className="text-[var(--color-primary)] font-black uppercase text-xs tracking-wider animate-pulse flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span>Uploading design...</span>
                    </div>
                  ) : imageURL ? (
                    <img src={imageURL} alt="Uploaded preview" className="h-full rounded-xl object-cover w-full" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <FiUploadCloud size={40} className="mb-2 text-[var(--color-primary)] animate-bounce" />
                      <span className="text-xs font-bold text-gray-600">Select finished design photo</span>
                      <span className="text-[10px] text-gray-400 mt-1">Accepts PNG, JPG under 5MB</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Design Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)] text-sm font-bold text-gray-700 bg-white"
                >
                  <option value="Completed Work">Completed Work</option>
                  <option value="Bridal">Bridal</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Feet">Feet</option>
                  <option value="Party">Party</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={!imageURL} 
                className="w-full bg-[var(--color-primary)] hover:bg-pink-700 text-white font-extrabold py-3.5 rounded-xl transition-colors disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-pink-100"
              >
                Publish to Gallery Portfolio
              </button>
              <button type="button" onClick={() => setUploadModal(null)} className="w-full text-gray-400 font-bold text-xs mt-4 hover:underline text-center">
                Skip upload & Close
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supply Refill Request Modal */}
      {refillModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setRefillModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><FiX size={24}/></button>
            <h2 className="text-xl font-bold font-serif text-[var(--color-header)] mb-2">Request Stock Refill</h2>
            <p className="text-xs text-gray-500 mb-6">Ask the administrator to dispatch a fresh supply kit for your upcoming bookings.</p>
            
            {refillSuccess ? (
              <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center text-green-600 font-extrabold text-sm space-y-2">
                <FiCheckCircle size={40} className="mx-auto text-green-500 mb-2"/>
                <p>{refillSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRefillSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Product Item</label>
                  <select 
                    value={refillItem}
                    onChange={(e) => setRefillItem(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)] text-sm font-bold bg-white text-gray-700"
                  >
                    <option value="Organic Henna Cones (10 Pcs)">Organic Henna Cones (10 Pcs)</option>
                    <option value="Eucalyptus Premium Oil (1 Bottle)">Eucalyptus Premium Oil (1 Bottle)</option>
                    <option value="Sugar-Lemon Sealant Spray (1 Spray)">Sugar-Lemon Sealant Spray (1 Bottle)</option>
                    <option value="Premium Glitters & Stones Box">Premium Glitters & Stones Box</option>
                    <option value="Mehndi Aftercare Leaflets (25 Pcs)">Mehndi Aftercare Leaflets (25 Pcs)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Quantity</label>
                    <input 
                      type="number"
                      min={1}
                      max={10}
                      value={refillQty}
                      onChange={(e) => setRefillQty(Math.max(1, Number(e.target.value)))}
                      className="w-full p-3 border border-gray-200 rounded-xl text-center font-bold text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Additional Notes</label>
                    <input 
                      type="text"
                      value={refillNotes}
                      onChange={(e) => setRefillNotes(e.target.value)}
                      placeholder="e.g. Urgent, sangeet tomorrow"
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[var(--color-primary)] hover:bg-pink-700 text-white font-extrabold py-3.5 rounded-xl transition-colors uppercase tracking-widest text-xs shadow-lg shadow-pink-100"
                >
                  Send Refill Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
