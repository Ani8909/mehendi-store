import Head from "next/head";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { FiCheck, FiUploadCloud, FiMapPin, FiCalendar, FiClock, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";

export default function Booking() {
  const router = useRouter();
  const { serviceId } = router.query;
  const { user, userData } = useAuth();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stepError, setStepError] = useState("");

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    defaultValues: {
      serviceId: "",
      packageName: "",
      packagePrice: "",
      bookingDate: "",
      timeSlot: "",
      name: userData?.name || "",
      phone: userData?.phone || user?.phoneNumber || "",
      address: userData?.address || "",
      additionalNotes: "",
    }
  });

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("bookingDate");
  const selectedService = services.find(s => s.id === selectedServiceId);
  const timeSlots = ["09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM", "06:00 PM - 08:00 PM"];

  const calculateProgress = () => {
    let progress = 0;
    if (watch("serviceId") || watch("packageName")) progress += 25;
    if (watch("bookingDate")) progress += 10;
    if (watch("timeSlot")) progress += 15;
    if (watch("name") && watch("name").length > 2) progress += 10;
    if (watch("phone") && watch("phone").length >= 10) progress += 10;
    if (watch("address") && watch("address").length > 5) progress += 15;
    if (step === 4) progress = 100;
    return Math.min(progress, 100);
  };
  const currentProgress = calculateProgress();

  useEffect(() => {
    async function fetchData() {
      try {
        const snapshot = await getDocs(collection(db, "services"));
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Handle URL parameters safely
        if (router.isReady) {
          if (router.query.serviceId) setValue("serviceId", router.query.serviceId as string);
          if (router.query.package) setValue("packageName", router.query.package as string);
          if (router.query.price) setValue("packagePrice", router.query.price as string);
          if (router.query.area) setValue("address", `${router.query.area}, Agra`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router.isReady, router.query, setValue]);

  // Fetch blocked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    async function fetchBlockedSlots() {
      const q = query(collection(db, "bookings"), where("bookingDateString", "==", selectedDate));
      const snapshot = await getDocs(q);
      const booked = snapshot.docs.map(doc => doc.data().timeSlot);
      setBlockedSlots(booked);
    }
    fetchBlockedSlots();
  }, [selectedDate]);

  // Handle Image Upload (Cloudinary)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload an image smaller than 5MB.");
      return;
    }
    
    setUploadingImage(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64data }),
        });

        const result = await response.json();
        if (result.url) {
          setImageURL(result.url);
        } else {
          alert("Upload failed");
        }
        setUploadingImage(false);
      };
    } catch (error) {
      console.error("Upload error", error);
      setUploadingImage(false);
      alert("Error uploading image");
    }
  };

  const onSubmit = async (data: any) => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // Final Step - Create Booking (Bypassing Razorpay for offline payments)
    setLoading(true);
    try {
      const bRef = "JM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const bookingData = {
        bookingRef: bRef,
        customerId: user?.uid || "guest",
        customerName: data.name,
        phone: data.phone,
        address: data.address,
        serviceId: data.serviceId || "package",
        serviceTitle: data.packageName || selectedService?.title,
        price: data.packagePrice || selectedService?.price,
        isPackage: !!data.packageName,
        additionalNotes: data.additionalNotes,
        inspirationPhoto: imageURL,
        bookingDateString: data.bookingDate,
        bookingDate: new Date(data.bookingDate),
        timeSlot: data.timeSlot,
        status: "pending",
        paymentStatus: "offline",
        paymentId: "offline_cash",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "bookings"), bookingData);
      
      // Send Email Notification
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "NEW_BOOKING", 
          data: {
            ...bookingData,
            email: user?.email || ""
          }
        })
      });

      router.push(`/booking-slip/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
      setLoading(false);
    }
  };

  const nextStep = async () => {
    setStepError(""); // Clear previous errors
    
    if (step === 1 && !selectedServiceId && !watch("packageName")) {
      setStepError("Please select a service or package to continue.");
      return;
    }
    if (step === 2 && (!selectedDate || !watch("timeSlot"))) {
      setStepError("Please select both a date and a time slot.");
      return;
    }
    if (step === 3) {
      const isValid = await trigger(["name", "phone", "address", "additionalNotes"]);
      if (!isValid) return;
    }
    setStep(step + 1);
  };

  const getDefaultImage = (title: string = "") => {
    const t = title.toLowerCase();
    if (t.includes('bridal')) return 'https://images.unsplash.com/photo-1595856401035-77ce547ab09c?q=80&w=600&auto=format&fit=crop';
    if (t.includes('arabic')) return 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=600&auto=format&fit=crop';
    if (t.includes('party')) return 'https://images.unsplash.com/photo-1620050868884-bb5cd5e5233c?q=80&w=600&auto=format&fit=crop';
    if (t.includes('indo')) return 'https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=600&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1590610940562-63b782b79401?q=80&w=600&auto=format&fit=crop';
  };

  return (
    <>
      <Head>
        <title>Book Appointment | Jyoti Mehendi Artist</title>
      </Head>

      <div className="bg-[var(--color-background)] min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Dynamic Progress Bar - Sticky at Top below Navbar */}
          <div className="sticky top-16 z-30 bg-[var(--color-background)]/95 backdrop-blur-md py-4 mb-8 border-b border-pink-100/40 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-b-2xl transition-all duration-300">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Progress</span>
                <span className="text-sm font-extrabold text-[var(--color-primary)]">{currentProgress}%</span>
              </div>
              <div className="overflow-hidden h-2.5 mb-2.5 text-xs flex rounded-full bg-pink-100 shadow-inner relative">
                <div 
                  style={{ width: `${currentProgress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-pink-400 via-[var(--color-primary)] to-[var(--color-header)] transition-all duration-700 ease-out rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                <span className={currentProgress >= 25 ? "text-[var(--color-primary)] transition-colors" : ""}>Service</span>
                <span className={currentProgress >= 50 ? "text-[var(--color-primary)] transition-colors" : ""}>Schedule</span>
                <span className={currentProgress >= 85 ? "text-[var(--color-primary)] transition-colors" : ""}>Details</span>
                <span className={currentProgress === 100 ? "text-[var(--color-primary)] transition-colors" : ""}>Review</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 relative overflow-hidden">
            <h1 className="text-3xl font-serif font-bold text-[var(--color-header)] mb-8">
              {step === 1 && "Select Service"}
              {step === 2 && "Choose Date & Time"}
              {step === 3 && "Your Details"}
              {step === 4 && "Review & Pay"}
            </h1>

            <form onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register("packageName")} />
              <input type="hidden" {...register("packagePrice")} />
              <AnimatePresence mode="wait">
                
                {/* STEP 1: Select Service or Show Package */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {watch("packageName") ? (
                      <div className="bg-pink-50 p-8 rounded-[40px] border-2 border-pink-200 text-center space-y-4">
                        <div className="text-5xl">👑</div>
                        <h2 className="text-2xl font-bold text-[var(--color-header)] font-serif">{watch("packageName")}</h2>
                        <p className="text-gray-600">Aapne hamara premium wedding package select kiya hai.</p>
                        <div className="text-3xl font-bold text-[var(--color-primary)]">₹{watch("packagePrice")}</div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setValue("packageName", "");
                            setValue("packagePrice", "");
                          }}
                          className="text-sm text-pink-400 underline"
                        >
                          Change to regular services
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                        {loading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-2xl w-full"></div>)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
                            {services.map(service => {
                               const isSelected = selectedServiceId === service.id;
                               return (
                                 <div 
                                    key={service.id}
                                    onClick={() => setValue("serviceId", service.id)}
                                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center space-x-4 ${isSelected ? 'border-[var(--color-primary)] bg-pink-50/50 shadow-md shadow-[var(--color-primary)]/10 scale-[1.02]' : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-sm'}`}
                                 >
                                    <img 
                                        src={service.image || getDefaultImage(service.title)} 
                                        onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                                        alt={service.title} 
                                        className="w-16 h-16 rounded-xl object-cover shadow-sm" 
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[var(--color-header)] text-sm">{service.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1 font-medium">₹{service.price} • {service.duration}</p>
                                    </div>
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'}`}>
                                        {isSelected && <FiCheck className="text-white" size={14} />}
                                    </div>
                                 </div>
                               );
                            })}
                          </div>
                        )}
                        </div>
                      
                      {/* Helpful Hint */}
                      {!loading && !watch("packageName") && (
                        <p className="mt-4 text-xs text-gray-400 text-center italic">
                          Choose from our signature designs or upload your own in Step 3.
                        </p>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: Choose Date & Time */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><FiCalendar className="mr-2 text-[var(--color-primary)]"/> Select Date</label>
                        <input 
                          type="date" 
                          {...register("bookingDate", { required: true })}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                      
                      {selectedDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><FiClock className="mr-2"/> Select Time Slot</label>
                          <div className="grid grid-cols-2 gap-3">
                            {timeSlots.map(slot => {
                              const isBlocked = blockedSlots.includes(slot);
                              const isSelected = watch("timeSlot") === slot;
                              return (
                                <div 
                                  key={slot}
                                  onClick={() => !isBlocked && setValue("timeSlot", slot)}
                                  className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                                    isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                    isSelected ? 'bg-[var(--color-primary)] text-white shadow-md cursor-pointer' : 
                                    'bg-white border border-gray-200 text-gray-600 hover:border-[var(--color-primary)] cursor-pointer'
                                  }`}
                                >
                                  {slot} {isBlocked && "(Booked)"}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Details & Upload */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Anjali Sharma" 
                          {...register("name", { 
                            required: "Full Name is required",
                            minLength: { value: 3, message: "Name must be at least 3 characters" },
                            maxLength: { value: 50, message: "Name must not exceed 50 characters" },
                            pattern: { value: /^[A-Za-z\s]+$/, message: "Please use only letters and spaces" }
                          })} 
                          className={`w-full p-4 bg-gray-50/50 border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-2 focus:border-transparent transition-all shadow-sm`} 
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
                        <input 
                          type="tel" 
                          placeholder="10-digit number (e.g. 9876543210)" 
                          {...register("phone", { 
                            required: "WhatsApp Number is required",
                            pattern: { value: /^[6-9][0-9]{9}$/, message: "Please enter a valid 10-digit Indian number" },
                            maxLength: { value: 10, message: "Cannot exceed 10 digits" }
                          })} 
                          onInput={(e: any) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          }}
                          className={`w-full p-4 bg-gray-50/50 border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-2 focus:border-transparent transition-all shadow-sm`} 
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><FiMapPin className="mr-1 text-[var(--color-primary)]"/> Complete Address (Agra Only)</label>
                        <textarea 
                          {...register("address", { 
                            required: "Complete Address is required",
                            minLength: { value: 15, message: "Please enter a detailed address (min 15 characters)" },
                            maxLength: { value: 200, message: "Address too long (max 200 chars)" }
                          })} 
                          rows={2} 
                          className={`w-full p-4 bg-gray-50/50 border ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-2 focus:border-transparent transition-all shadow-sm`} 
                          placeholder="e.g. House 45, Sanjay Place, Agra. (We only serve Agra)"></textarea>
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}
                        <p className="text-[10px] text-gray-400 mt-1 italic">* Abhi hum sirf poore Agra sheher mein hi apni services de rahe hain.</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Design Inspiration (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {uploadingImage ? (
                            <div className="text-[var(--color-primary)]">Uploading...</div>
                          ) : imageURL ? (
                            <img src={imageURL} alt="Uploaded preview" className="h-24 mx-auto rounded-lg object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-500">
                              <FiUploadCloud size={32} className="mb-2 text-[var(--color-primary)]" />
                              <span className="text-sm">Click or drag image here</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                        <textarea 
                          {...register("additionalNotes", {
                            maxLength: { value: 500, message: "Notes cannot exceed 500 characters" }
                          })} 
                          rows={2} 
                          className={`w-full p-3 border ${errors.additionalNotes ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-[var(--color-primary)] focus:border-transparent transition-all`} 
                          placeholder="Any specific requests?"></textarea>
                        {errors.additionalNotes && <p className="text-red-500 text-xs mt-1">{errors.additionalNotes.message as string}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Review & Pay */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-[var(--color-background)] rounded-xl p-6 mb-6">
                      <h3 className="font-bold text-lg text-[var(--color-header)] mb-4 border-b border-pink-200 pb-2">Booking Summary</h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service</span>
                          <span className="font-semibold text-gray-800">{watch("packageName") || selectedService?.title || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date & Time</span>
                          <span className="font-semibold text-gray-800">{watch("bookingDate") || "N/A"} | {watch("timeSlot") || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Address</span>
                          <span className="font-semibold text-gray-800 text-right w-1/2 line-clamp-1" title={watch("address")}>{watch("address") || "N/A"}</span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-pink-200 flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Total Amount</span>
                          <span className="text-2xl font-bold text-[var(--color-primary)]">₹{watch("packagePrice") || selectedService?.price || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-pink-50 text-[var(--color-primary)] border border-pink-100/50 text-sm p-4 rounded-2xl flex items-start space-x-3 mb-6 font-semibold">
                      <FiCheck className="mt-0.5 flex-shrink-0 text-xl" />
                      <p>Aapki booking instantly confirm ho jayegi! Payment online dene ki zaroorat nahi hai—aap artist ko service complete hone ke baad cash ya UPI (Offline) de sakte hain.</p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Step Error Display */}
              {stepError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {stepError}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-full hover:bg-gray-50">
                    Back
                  </button>
                ) : <div></div>}
                
                {step < 4 ? (
                  <button type="button" onClick={nextStep} className="px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-full shadow-md hover:bg-[var(--color-header)] hover:-translate-y-0.5 transition-all">
                    Continue
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-header)] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center space-x-2 min-w-[140px]">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </>
                    ) : (
                      `Confirm Booking (Pay Offline)`
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
