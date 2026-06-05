import { compressImage } from "@/lib/imageUtils";
import Head from "next/head";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { FiCheck, FiUploadCloud, FiMapPin, FiClock, FiSmartphone, FiUser, FiPackage, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";

const EXPRESS_ZONES = [
  "Sanjay Place",
  "Kamla Nagar",
  "Dayalbagh",
  "Tajganj",
  "Shastriapuram",
  "Sikandra",
  "Khandari",
  "Shahganj",
  "Fatehabad Road",
  "Lohamandi"
];

const EXPRESS_PACKAGES = [
  { id: "exp-basic", title: "Basic Fast Hands", price: 499, duration: "15 Mins", desc: "Elegant front and back patterns perfect for rapid setups.", icon: "🌸" },
  { id: "exp-arabic", title: "Arabic Quick Design", price: 799, duration: "20 Mins", desc: "Fluid, floral, and contemporary thick Arabic styles.", icon: "✨" },
  { id: "exp-party", title: "Party Special Quick", price: 1199, duration: "30 Mins", desc: "Slightly more intricate traditional quick strokes for celebrations.", icon: "👑" },
];

export default function ExpressBooking() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [stepError, setStepError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      expressZone: "",
      packageId: "exp-basic",
      name: userData?.name || "",
      phone: userData?.phone || user?.phoneNumber || "",
      address: userData?.address || "",
      additionalNotes: ""
    }
  });

  const selectedZone = watch("expressZone");
  const selectedPackageId = watch("packageId");
  const selectedPackage = EXPRESS_PACKAGES.find(p => p.id === selectedPackageId) || EXPRESS_PACKAGES[0];

  useEffect(() => {
    if (router.isReady && router.query.area) {
      const areaParam = router.query.area as string;
      const matchedZone = EXPRESS_ZONES.find(z => z.toLowerCase() === areaParam.toLowerCase());
      if (matchedZone) {
        setValue("expressZone", matchedZone);
      }
    }
  }, [router.isReady, router.query, setValue]);

  // Handle Image Upload (Cloudinary Base64 Endpoint)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload an image smaller than 5MB.");
      return;
    }
    
    setUploadingImage(true);
    try {
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
          alert("Image upload failed");
        }
        setUploadingImage(false);
      };
    } catch (error) {
      console.error("Upload error", error);
      setUploadingImage(false);
      alert("Error uploading design reference");
    }
  };

  const onSubmit = async (data: any) => {
    setStepError("");
    if (!data.expressZone) {
      setStepError("Please select your Agra coverage area.");
      return;
    }
    
    setLoading(true);
    try {
      const todayString = new Date().toLocaleDateString("en-IN", {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });

      const bRef = "JM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const bookingData = {
        bookingRef: bRef,
        customerId: user?.uid || "guest",
        customerName: data.name,
        phone: data.phone,
        address: `${data.address}, ${data.expressZone}, Agra`,
        expressZone: data.expressZone,
        serviceId: selectedPackage.id,
        serviceTitle: `Express: ${selectedPackage.title}`,
        price: selectedPackage.price,
        isPackage: false,
        bookingType: "express",
        additionalNotes: data.additionalNotes || "",
        inspirationPhoto: imageURL,
        bookingDateString: todayString,
        bookingDate: new Date(),
        timeSlot: "Immediate Arrival (20 Mins)",
        status: "dispatched",
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

      setBookingSuccess(true);
      setTimeout(() => {
        router.push(`/booking-slip/${docRef.id}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setStepError("Express booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Instant 20-Min Express Booking | Jyoti Mehendi</title>
      </Head>

      <div className="bg-gradient-to-b from-[#FFF5F7] to-[#FCFAFA] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center space-x-2 bg-pink-50 border border-pink-100 px-4 py-2 rounded-full text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <FiClock className="animate-spin text-sm" /> <span>Agra Doorstep Dispatch</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-[var(--color-header)] leading-tight">
              Express Mehendi Booking
            </h1>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm">
              Emergency design plans? No worries! Choose your area, pick a fast pack, and we reach in 20 minutes!
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-pink-50/50 relative overflow-hidden">
            {/* Top Pink Line Decorative */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pink-400 via-[var(--color-primary)] to-amber-500"></div>

            {bookingSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner animate-bounce">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-header)] font-serif">Express Dispatch Triggered!</h2>
                <p className="text-gray-500">Redirecting you to your Live Dispatch & Tracking slip...</p>
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mt-6"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* STEP 1: SELECT AREA */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-header)] font-serif mb-4 flex items-center">
                    <FiMapPin className="mr-2 text-[var(--color-primary)]" /> 1. Select Your Agra Zone
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EXPRESS_ZONES.map(zone => {
                      const isSelected = selectedZone === zone;
                      return (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => setValue("expressZone", zone)}
                          className={`p-3 rounded-xl border text-center font-semibold text-xs md:text-sm transition-all shadow-sm ${
                            isSelected 
                              ? "border-[var(--color-primary)] bg-pink-50/50 text-[var(--color-primary)] scale-[1.02] shadow-pink-500/10" 
                              : "border-gray-200 hover:border-pink-200 text-gray-600 bg-white"
                          }`}
                        >
                          {zone}
                        </button>
                      );
                    })}
                  </div>
                  {errors.expressZone && <p className="text-red-500 text-xs mt-1">Please select an express delivery area</p>}
                </div>

                {/* STEP 2: SELECT EXPRESS QUICK PACKAGE */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-header)] font-serif mb-4 flex items-center">
                    <FiPackage className="mr-2 text-[var(--color-primary)]" /> 2. Pick a Fast-Track Package
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {EXPRESS_PACKAGES.map(pkg => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setValue("packageId", pkg.id)}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected 
                              ? "border-[var(--color-primary)] bg-pink-50/40 shadow-md scale-[1.02]" 
                              : "border-gray-100 bg-white hover:border-pink-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl">{pkg.icon}</span>
                              <span className="text-xs font-bold text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full">{pkg.duration}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm">{pkg.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">{pkg.desc}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-base font-bold text-[var(--color-primary)]">₹{pkg.price}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'}`}>
                              {isSelected && <FiCheck className="text-white" size={10} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: DETAILS */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-header)] font-serif mb-4 flex items-center">
                    <FiUser className="mr-2 text-[var(--color-primary)]" /> 3. Dispatch Delivery Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">WhatsApp Contact Number</label>
                      <div className="relative">
                        <FiSmartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="tel"
                          placeholder="10-digit number (e.g. 9876543210)"
                          {...register("phone", {
                            required: "WhatsApp number is required",
                            pattern: { value: /^[6-9][0-9]{9}$/, message: "Enter a valid 10-digit Indian number" }
                          })}
                          onInput={(e: any) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          }}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all shadow-sm`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Your Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text"
                          placeholder="e.g. Anjali Sharma"
                          {...register("name", {
                            required: "Name is required",
                            minLength: { value: 3, message: "Name must be at least 3 characters" }
                          })}
                          className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all shadow-sm`}
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">House Address & Landmark (Agra)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Flat 302, Royal Residency, Near Landmark, Sanjay Place"
                      {...register("address", {
                        required: "Complete house address is required",
                        minLength: { value: 12, message: "Please include descriptive markers or landmarks" }
                      })}
                      className={`w-full p-4 bg-gray-50/50 border ${errors.address ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all shadow-sm`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}
                  </div>
                </div>

                {/* Optional uploads / notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Design Inspiration (Optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-pink-50/10 transition-all relative">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {uploadingImage ? (
                        <div className="text-[var(--color-primary)] text-xs font-bold animate-pulse">Uploading...</div>
                      ) : imageURL ? (
                        <img src={imageURL} alt="Design preview" className="h-16 mx-auto rounded-lg object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
                          <FiUploadCloud size={20} className="text-[var(--color-primary)]" />
                          <span className="text-[11px] font-semibold">Upload Photo Reference</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Special Request (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please bring organic chemical-free henna cones only."
                      {...register("additionalNotes")}
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-gray-50/50 shadow-sm"
                    />
                  </div>
                </div>

                {/* Step Error Panel */}
                {stepError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center shadow-sm">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">{stepError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[var(--color-primary)] to-pink-600 text-white font-bold rounded-full shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing Instant Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Dispatch Artist (Pay Offline)</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
