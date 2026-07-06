import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUploadCloud, FiCalendar, FiMapPin, FiUsers, FiInfo, FiArrowLeft, 
  FiCheck, FiTrash2, FiTag, FiClock, FiDollarSign, FiHeart, FiStar, FiShield, FiAward 
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import SEO from "@/components/SEO";

// Option Interfaces for Live Calculator
interface OptionItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  timeHours: number;
  icon?: string;
}

export default function CustomPackage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  // Form & Selection States
  const [eventType, setEventType] = useState("Bridal Wedding");
  const [handCoverage, setHandCoverage] = useState("elbow");
  const [footCoverage, setFootCoverage] = useState("mid-calf");
  const [hennaType, setHennaType] = useState("organic-rajasthani");
  const [artistTier, setArtistTier] = useState("master-jyoti");
  const [selectedMotifs, setSelectedMotifs] = useState<string[]>(["bride-groom"]);
  const [guestCount, setGuestCount] = useState("6-15");
  
  // Contact & Logistics
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("11:00 AM");
  const [eventAddress, setEventAddress] = useState("");
  const [details, setDetails] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setPhone(userData.phone || "");
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [userData, user]);

  // Pricing & Time Database
  const handOptions: Record<string, OptionItem> = {
    "wrist": { id: "wrist", name: "Wrist Length (Basic Elegant)", desc: "Delicate patterns up to wrist on both hands", price: 1500, timeHours: 1.5 },
    "mid-forearm": { id: "mid-forearm", name: "Mid-Forearm (Classic Traditional)", desc: "Rich intricate design halfway up the forearm", price: 2500, timeHours: 2.5 },
    "elbow": { id: "elbow", name: "Elbow Length (Royal Bridal)", desc: "Full dense bridal mehndi up to the elbows", price: 3800, timeHours: 4.0 },
    "above-elbow": { id: "above-elbow", name: "Above Elbow / Full Arm (Maharani)", desc: "Extravagant full arm coverage with heavy detailing", price: 5200, timeHours: 5.5 },
  };

  const footOptions: Record<string, OptionItem> = {
    "none": { id: "none", name: "No Foot Mehndi", desc: "Hand mehndi only", price: 0, timeHours: 0 },
    "ankles": { id: "ankles", name: "Ankle Length (Sweet & Simple)", desc: "Beautiful mandalas and borders around ankles", price: 800, timeHours: 1.0 },
    "mid-calf": { id: "mid-calf", name: "Mid-Calf Length (Traditional Bridal)", desc: "Heavy bridal design halfway up lower leg", price: 1800, timeHours: 2.0 },
    "knee": { id: "knee", name: "Knee Length (Royal Rajwada)", desc: "Intricate full leg bridal artwork up to knees", price: 3000, timeHours: 3.5 },
  };

  const hennaTypes: Record<string, OptionItem> = {
    "organic-rajasthani": { id: "organic-rajasthani", name: "100% Organic Rajasthani Dark Stain", desc: "Chemical-free triple sifted herbal henna with guaranteed deep maroon stain", price: 0, timeHours: 0 },
    "khafif-modern": { id: "khafif-modern", name: "Modern Khafif / Arabic Precision", desc: "Bold outlines with intricate shaded filling and negative space aesthetics", price: 300, timeHours: 0 },
    "jagua-fusion": { id: "jagua-fusion", name: "Jagua Herbal Black/Blue Fusion", desc: "Natural fruit-based gel giving a rich tattoo-like dark blue/black finish", price: 800, timeHours: 0 },
  };

  const artistTiers: Record<string, OptionItem> = {
    "master-jyoti": { id: "master-jyoti", name: "Master Artist Jyoti (Founder • 15+ Yrs)", desc: "Personal bridal styling by Agra's most celebrated celebrity mehndi artist", price: 2000, timeHours: 0 },
    "senior-team": { id: "senior-team", name: "Senior Bridal Specialist Team", desc: "Highly skilled lead artists trained under Jyoti Mehendi royal academy", price: 500, timeHours: 0 },
    "associate": { id: "associate", name: "Associate Pro Mehndi Artists", desc: "Expert artists perfect for sangeet parties, festivals, and budget events", price: 0, timeHours: 0 },
  };

  const motifOptions: OptionItem[] = [
    { id: "bride-groom", name: "Bride & Groom Portraits", desc: "Realistic facial figures or traditional bride-groom silhouettes", price: 800, timeHours: 1.0 },
    { id: "doli-baraat", name: "Doli & Baraat Procession", desc: "Royal palanquin, groom on elephant, and musical celebration scenes", price: 1000, timeHours: 1.0 },
    { id: "peacock-lotus", name: "Rajwada Peacock & Lotus Mandalas", desc: "Intricate royal Mughal motifs with shaded lotus blooms", price: 500, timeHours: 0.5 },
    { id: "love-timeline", name: "Custom Love Story & Hidden Names", desc: "Weave your proposal date, hashtags, skyline, or hobby icons into henna", price: 1200, timeHours: 1.0 },
  ];

  const guestPackages: Record<string, { label: string; price: number; desc: string }> = {
    "0": { label: "Only Bride (No Guests)", price: 0, desc: "Focus strictly on bridal Mehndi" },
    "1-5": { label: "1 to 5 Family Members", price: 1500, desc: "Includes both hands simple Arabic/Mandala design for 5 guests" },
    "6-15": { label: "6 to 15 Guests (Most Popular)", price: 3800, desc: "Dedicated associate artist for bridesmaids & family members" },
    "16-30": { label: "16 to 30 Guests (Sangeet Night)", price: 7000, desc: "Two expert artists for fast, beautiful party mehndi" },
    "30+": { label: "30+ Guests / Grand Wedding", price: 11000, desc: "Full artist team for unlimited guest mehndi entertainment" },
  };

  const handleMotifToggle = (motifId: string) => {
    if (selectedMotifs.includes(motifId)) {
      setSelectedMotifs(selectedMotifs.filter(m => m !== motifId));
    } else {
      setSelectedMotifs([...selectedMotifs, motifId]);
    }
  };

  // Real-time Live Price & Time Calculator
  const liveEstimate = useMemo(() => {
    const hand = handOptions[handCoverage]?.price || 0;
    const foot = footOptions[footCoverage]?.price || 0;
    const henna = hennaTypes[hennaType]?.price || 0;
    const tier = artistTiers[artistTier]?.price || 0;
    const guests = guestPackages[guestCount]?.price || 0;
    
    let motifsPrice = 0;
    let motifsTime = 0;
    selectedMotifs.forEach(mId => {
      const found = motifOptions.find(m => m.id === mId);
      if (found) {
        motifsPrice += found.price;
        motifsTime += found.timeHours;
      }
    });

    const totalMin = hand + foot + henna + tier + guests + motifsPrice;
    const totalMax = Math.round(totalMin * 1.15); // 15% custom variation range
    
    const baseTime = (handOptions[handCoverage]?.timeHours || 0) + (footOptions[footCoverage]?.timeHours || 0);
    const totalTime = Math.max(1, Math.round((baseTime + motifsTime) * 10) / 10);

    return {
      min: totalMin,
      max: totalMax,
      time: totalTime
    };
  }, [handCoverage, footCoverage, hennaType, artistTier, guestCount, selectedMotifs]);

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
      alert("Error uploading image");
    }
  };

  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !eventDate || !eventAddress) {
      alert("Please fill all required contact & venue details (Name, Phone, Date, Address).");
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        customerId: user ? user.uid : "guest",
        customerName: name,
        customerPhone: phone,
        customerEmail: email || "Not Provided",
        eventType,
        handCoverage: handOptions[handCoverage]?.name || handCoverage,
        footCoverage: footOptions[footCoverage]?.name || footCoverage,
        hennaType: hennaTypes[hennaType]?.name || hennaType,
        artistTier: artistTiers[artistTier]?.name || artistTier,
        selectedMotifs: selectedMotifs.map(id => motifOptions.find(m => m.id === id)?.name || id),
        guestsCount: guestPackages[guestCount]?.label || guestCount,
        eventDate,
        eventTime,
        eventAddress,
        details,
        inspirationPhoto: imageURL || null,
        estimatedPriceRange: `₹${liveEstimate.min.toLocaleString()} - ₹${liveEstimate.max.toLocaleString()}`,
        estimatedDurationHours: liveEstimate.time,
        status: "pending",
        quotedPrice: null,
        depositAmount: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "custom_package_requests"), requestData);

      // Trigger email notification
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CUSTOM_PACKAGE_REQUEST",
            data: {
              customerName: name,
              customerPhone: phone,
              customerEmail: email,
              eventType,
              eventDate,
              estimatedPrice: `₹${liveEstimate.min.toLocaleString()} - ₹${liveEstimate.max.toLocaleString()}`,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to send email notification:", err);
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error creating custom package request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!name || !phone) {
      alert("Please enter Your Name and WhatsApp Number in Step 4 before sending to WhatsApp!");
      setCurrentStep(4);
      return;
    }

    const motifNames = selectedMotifs.map(id => motifOptions.find(m => m.id === id)?.name).join(", ") || "None";
    const text = `*🌟 NEW CUSTOM MEHNDI PACKAGE INQUIRY 🌟*\n\n` +
      `*👤 Client Name:* ${name}\n` +
      `*📱 WhatsApp:* ${phone}\n` +
      `*🎉 Event Type:* ${eventType}\n` +
      `*📅 Date & Time:* ${eventDate || "To be decided"} at ${eventTime}\n` +
      `*📍 Venue:* ${eventAddress || "Agra"}\n\n` +
      `*👑 PACKAGE SPECIFICATIONS:*\n` +
      `• *Hand Coverage:* ${handOptions[handCoverage]?.name}\n` +
      `• *Foot Coverage:* ${footOptions[footCoverage]?.name}\n` +
      `• *Henna Quality:* ${hennaTypes[hennaType]?.name}\n` +
      `• *Artist Preference:* ${artistTiers[artistTier]?.name}\n` +
      `• *Special Motifs:* ${motifNames}\n` +
      `• *Guest Mehndi:* ${guestPackages[guestCount]?.label}\n\n` +
      `*💰 Live Estimated Value:* ₹${liveEstimate.min.toLocaleString()} – ₹${liveEstimate.max.toLocaleString()}\n` +
      `*⏱️ Estimated Time:* ~${liveEstimate.time} Hours\n\n` +
      `*📝 Notes:* ${details || "None"}\n\n` +
      `_Please review my specifications and confirm artist availability!_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/919999999999?text=${encoded}`, "_blank");
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100/80 min-h-screen py-20 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-[32px] p-8 md:p-12 shadow-2xl border border-pink-200 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400" />
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-md">
            <FiCheck />
          </div>
          <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            ✨ Quotation Requested
          </span>
          <h1 className="text-3xl font-black font-serif text-[#4d1f2e] mt-3 mb-4">Your Custom Package is Submitted!</h1>
          <p className="text-[#7a4857] text-sm md:text-base mb-6 leading-relaxed">
            Thank you, <strong className="text-[#5c1c3f]">{name}</strong>! Master Artist Jyoti and our senior styling team have received your exact specifications (Estimated Range: <strong>₹{liveEstimate.min.toLocaleString()} – ₹{liveEstimate.max.toLocaleString()}</strong>). We will review availability and WhatsApp you an official royal quotation within 2 hours.
          </p>
          
          <div className="bg-pink-50/80 rounded-2xl p-4 border border-pink-200/60 mb-8 text-left text-xs text-[#5c1c3f] space-y-1.5">
            <div className="flex justify-between"><span>Hand & Foot Style:</span> <strong className="text-right">{handOptions[handCoverage]?.name.split(" (")[0]} + {footOptions[footCoverage]?.name.split(" (")[0]}</strong></div>
            <div className="flex justify-between"><span>Guest Coverage:</span> <strong className="text-right">{guestPackages[guestCount]?.label}</strong></div>
            <div className="flex justify-between"><span>Selected Artist:</span> <strong className="text-right">{artistTiers[artistTier]?.name.split(" (")[0]}</strong></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleWhatsAppOrder}
              className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-green-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaWhatsapp className="text-lg" /> Get Instant Reply on WhatsApp
            </button>
            <Link 
              href="/packages"
              className="px-6 py-3.5 border-2 border-pink-300 text-[#5c1c3f] hover:bg-pink-50 rounded-2xl font-bold transition-all text-sm flex items-center justify-center"
            >
              Explore Ready Packages
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Royal Custom Mehndi Package Studio | Jyoti Mehendi Agra"
        description="Design your custom bridal mehndi package with live price estimator. Choose hand length, motifs, organic henna quality, and guest artists online."
      />

      <div className="bg-gradient-to-br from-pink-50/70 via-white to-rose-50/60 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-[#5c1c3f]">
        <div className="max-w-6xl mx-auto">
          
          {/* Top Navigation & Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Link 
                href="/packages"
                className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors gap-1.5 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200/60 w-fit"
              >
                <FiArrowLeft size={14} /> Back to Packages
              </Link>
              <h1 className="text-3xl md:text-5xl font-black font-serif text-[#4d1f2e] mt-3 flex items-center gap-3">
                <span>Royal Custom Studio</span>
                <span className="text-xs font-sans font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Pro Builder
                </span>
              </h1>
              <p className="text-[#7a4857] text-sm mt-1">
                Customize every detail of your bridal & guest mehndi. Get instant price estimates and priority booking.
              </p>
            </div>

            {/* Step Progress Pills */}
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-pink-200/80 shadow-sm overflow-x-auto">
              {[
                { step: 1, label: "1. Coverage" },
                { step: 2, label: "2. Style & Motifs" },
                { step: 3, label: "3. Guests & Artist" },
                { step: 4, label: "4. Venue & Submit" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentStep === s.step 
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md" 
                      : currentStep > s.step 
                      ? "bg-pink-100 text-rose-800 font-semibold" 
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span>{currentStep > s.step ? "✓" : s.step}</span>
                  <span className="hidden sm:inline">{s.label.split(". ")[1]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Interactive Wizard Form (8 Columns on Desktop) */}
            <div className="lg:col-span-8 bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl border border-pink-100/80 relative">
              
              <form onSubmit={handleOfficialSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: BRIDAL COVERAGE (HANDS & FEET) */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-pink-100 pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-serif">Step 1 of 4</span>
                        <h2 className="text-2xl font-black font-serif text-[#4d1f2e] mt-1">Select Bridal Mehndi Coverage</h2>
                        <p className="text-xs text-[#7a4857] mt-0.5">Choose how far you want the intricate henna patterns on your arms and feet.</p>
                      </div>

                      {/* Event Occasion Type */}
                      <div>
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2.5">Occasion / Event Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {["Bridal Wedding", "Sangeet & Mehndi Night", "Engagement / Roka", "Karwa Chauth / Teej", "Godh Bharai / Baby Shower", "Destination Wedding"].map((ev) => (
                            <button
                              type="button"
                              key={ev}
                              onClick={() => setEventType(ev)}
                              className={`p-3 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                                eventType === ev 
                                  ? "border-rose-500 bg-rose-50/80 text-rose-900 shadow-sm" 
                                  : "border-pink-100 hover:border-pink-300 text-gray-600 bg-white"
                              }`}
                            >
                              <span>{ev}</span>
                              {eventType === ev && <FiCheck className="text-rose-600 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hand Mehndi Coverage */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3 flex items-center justify-between">
                          <span>Hand & Arm Coverage (Both Hands Front & Back)</span>
                          <span className="text-rose-600 font-serif">Estimated Time: ~{handOptions[handCoverage]?.timeHours} hrs</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {Object.entries(handOptions).map(([key, item]) => (
                            <div
                              key={key}
                              onClick={() => setHandCoverage(key)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                handCoverage === key 
                                  ? "border-rose-500 bg-gradient-to-br from-rose-50/90 to-pink-50 text-[#4d1f2e] shadow-md ring-2 ring-rose-300/30" 
                                  : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white/70"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between font-bold text-sm mb-1 font-serif text-[#4d1f2e]">
                                  <span>{item.name.split(" (")[0]}</span>
                                  <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-sans">+₹{item.price.toLocaleString()}</span>
                                </div>
                                <div className="text-[11px] text-[#7a4857]/80 leading-relaxed">{item.desc}</div>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600 pt-2 border-t border-pink-100/60">
                                <span>{item.name.includes("(") ? item.name.split("(")[1].replace(")", "") : "Standard"}</span>
                                <span>{handCoverage === key ? "✓ Selected" : "Select"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Foot & Leg Coverage */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3">
                          Foot & Leg Coverage
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {Object.entries(footOptions).map(([key, item]) => (
                            <div
                              key={key}
                              onClick={() => setFootCoverage(key)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                footCoverage === key 
                                  ? "border-rose-500 bg-gradient-to-br from-rose-50/90 to-pink-50 text-[#4d1f2e] shadow-md" 
                                  : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white/70"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between font-bold text-sm mb-1 font-serif text-[#4d1f2e]">
                                  <span>{item.name.split(" (")[0]}</span>
                                  <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-sans">{item.price === 0 ? "Free / None" : `+₹${item.price.toLocaleString()}`}</span>
                                </div>
                                <div className="text-[11px] text-[#7a4857]/80 leading-relaxed">{item.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step Next Button */}
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-[#802254] text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2"
                        >
                          <span>Next: Style & Motifs</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: HENNA QUALITY & ROYAL MOTIFS */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-pink-100 pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-serif">Step 2 of 4</span>
                        <h2 className="text-2xl font-black font-serif text-[#4d1f2e] mt-1">Henna Quality & Royal Motifs</h2>
                        <p className="text-xs text-[#7a4857] mt-0.5">Customize the henna stain paste quality and special storytelling elements.</p>
                      </div>

                      {/* Henna Paste Type */}
                      <div>
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FiStar className="text-amber-500 fill-amber-500" />
                          <span>Henna Paste Quality & Stain Guarantee</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(hennaTypes).map(([key, item]) => (
                            <div
                              key={key}
                              onClick={() => setHennaType(key)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                                hennaType === key 
                                  ? "border-rose-500 bg-rose-50/80 text-[#4d1f2e] shadow-sm" 
                                  : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${hennaType === key ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300"}`}>
                                  {hennaType === key && <FiCheck size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-[#4d1f2e]">{item.name}</div>
                                  <div className="text-xs text-[#7a4857]/80">{item.desc}</div>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-3 py-1 rounded-full whitespace-nowrap">
                                {item.price === 0 ? "Included Free" : `+₹${item.price}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Royal Figurines & Motifs */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><FiAward className="text-amber-500" /> Special Bridal Figurines & Motifs (Select multiple)</span>
                          <span className="text-xs font-normal text-rose-600">Tailored artwork</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {motifOptions.map((m) => {
                            const isSelected = selectedMotifs.includes(m.id);
                            return (
                              <div
                                key={m.id}
                                onClick={() => handleMotifToggle(m.id)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                  isSelected 
                                    ? "border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50/80 text-[#4d1f2e] shadow-sm" 
                                    : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white/70"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-rose-500 border-rose-500 text-white" : "border-gray-300 bg-white"}`}>
                                      {isSelected && <FiCheck size={13} strokeWidth={3} />}
                                    </div>
                                    <span className="font-bold text-sm text-[#4d1f2e] font-serif">{m.name}</span>
                                  </div>
                                  <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md whitespace-nowrap">+₹{m.price}</span>
                                </div>
                                <div className="text-[11px] text-[#7a4857]/80 leading-relaxed mt-2 pl-7">{m.desc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step Navigation Buttons */}
                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="px-6 py-4 border border-pink-200 text-[#7a4857] hover:bg-pink-50 font-bold text-sm rounded-2xl transition-all"
                        >
                          ⬅ Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-[#802254] text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2"
                        >
                          <span>Next: Guests & Artist</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: GUEST COUNT & ARTIST TIER */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-pink-100 pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-serif">Step 3 of 4</span>
                        <h2 className="text-2xl font-black font-serif text-[#4d1f2e] mt-1">Guests & Artist Expertise</h2>
                        <p className="text-xs text-[#7a4857] mt-0.5">Include mehndi for your bridesmaids, family members, and select artist seniority.</p>
                      </div>

                      {/* Guest Mehndi Packages */}
                      <div>
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FiUsers className="text-rose-600 text-base" />
                          <span>Family & Guest Mehndi Coverage (Sisters, Bridesmaids, Mothers)</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {Object.entries(guestPackages).map(([key, item]) => (
                            <div
                              key={key}
                              onClick={() => setGuestCount(key)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                guestCount === key 
                                  ? "border-rose-500 bg-rose-50/90 text-[#4d1f2e] shadow-md ring-2 ring-rose-200" 
                                  : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between font-bold text-sm mb-1 font-serif text-[#4d1f2e]">
                                  <span>{item.label}</span>
                                  <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-sans">
                                    {item.price === 0 ? "No Extra" : `+₹${item.price.toLocaleString()}`}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#7a4857]/80 leading-relaxed">{item.desc}</div>
                              </div>
                              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-rose-600 pt-2 border-t border-pink-100/60">
                                {guestCount === key ? "✓ Selected for Event" : "Click to Select"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Artist Tier Preference */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FiAward className="text-purple-600" />
                          <span>Artist Tier & Styling Authority</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(artistTiers).map(([key, item]) => (
                            <div
                              key={key}
                              onClick={() => setArtistTier(key)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                                artistTier === key 
                                  ? "border-purple-500 bg-purple-50/60 text-[#4d1f2e] shadow-sm" 
                                  : "border-pink-100 hover:border-pink-200 text-gray-600 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${artistTier === key ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300"}`}>
                                  {artistTier === key && <FiCheck size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-[#4d1f2e] flex items-center gap-1.5">
                                    <span>{item.name}</span>
                                    {key === "master-jyoti" && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold">Recommended</span>}
                                  </div>
                                  <div className="text-xs text-[#7a4857]/80">{item.desc}</div>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full whitespace-nowrap">
                                {item.price === 0 ? "Standard Rate" : `+₹${item.price}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step Navigation Buttons */}
                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-6 py-4 border border-pink-200 text-[#7a4857] hover:bg-pink-50 font-bold text-sm rounded-2xl transition-all"
                        >
                          ⬅ Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-[#802254] text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2"
                        >
                          <span>Next: Venue & Submit</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: CONTACT, VENUE & INSTANT SUBMISSION */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-pink-100 pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-serif">Step 4 of 4</span>
                        <h2 className="text-2xl font-black font-serif text-[#4d1f2e] mt-1">Venue Details & Quotation</h2>
                        <p className="text-xs text-[#7a4857] mt-0.5">Enter your contact info to receive the official quotation or WhatsApp us directly!</p>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Your Full Name *</label>
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                            placeholder="e.g. Sneha Sharma"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">WhatsApp Number *</label>
                          <input 
                            type="tel" 
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                            placeholder="10-digit WhatsApp number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Email Address (Optional)</label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                            placeholder="For PDF quote copy"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Event Date *</label>
                          <input 
                            type="date" 
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Preferred Time</label>
                          <select
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                          >
                            <option value="09:00 AM">09:00 AM (Morning)</option>
                            <option value="11:00 AM">11:00 AM (Late Morning)</option>
                            <option value="02:00 PM">02:00 PM (Afternoon)</option>
                            <option value="04:00 PM">04:00 PM (Evening)</option>
                            <option value="07:00 PM">07:00 PM (Night Sangeet)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Event Venue / Address in Agra *</label>
                        <input 
                          type="text" 
                          required
                          value={eventAddress}
                          onChange={(e) => setEventAddress(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium"
                          placeholder="e.g. Hotel Jaypee Palace, Fatehabad Road, Agra"
                        />
                      </div>

                      {/* Notes & Photo Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Special Requirements / Notes</label>
                          <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white font-medium text-xs"
                            placeholder="Tell us about special requests, groom name hiding, or dress color matching..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#7a4857] uppercase tracking-wider mb-2">Reference / Inspiration Design</label>
                          <div className="border-2 border-dashed border-pink-300 rounded-2xl p-4 text-center hover:border-rose-400 transition-colors relative bg-pink-50/30 flex flex-col items-center justify-center h-[92px]">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            {uploadingImage ? (
                              <div className="text-rose-600 font-bold text-xs">Uploading photo...</div>
                            ) : imageURL ? (
                              <div className="relative inline-block">
                                <span className="text-xs text-green-700 font-bold">✓ Reference Photo Uploaded</span>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setImageURL(""); }}
                                  className="ml-2 text-xs text-red-600 underline font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <FiUploadCloud size={20} className="text-rose-500 mb-1" />
                                <span className="text-xs font-bold text-gray-600">Click to upload reference photo</span>
                                <span className="text-[10px] text-gray-400">Optional (PNG/JPG max 5MB)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dual CTA Action Buttons */}
                      <div className="pt-6 border-t border-pink-100 flex flex-col sm:flex-row gap-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-[#802254] hover:from-rose-500 hover:to-pink-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FiCheck className="text-lg" />
                          <span>{submitting ? "Submitting..." : "Submit Official Request"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleWhatsAppOrder}
                          className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-green-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <FaWhatsapp className="text-xl" />
                          <span>Send Directly to WhatsApp</span>
                        </button>
                      </div>

                      <div className="flex justify-start pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="px-6 py-2.5 border border-pink-200 text-[#7a4857] hover:bg-pink-50 font-bold text-xs rounded-xl transition-all"
                        >
                          ⬅ Back to Guests
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </form>
            </div>

            {/* Sidebar: Real-Time Live Price & Time Calculator (4 Columns on Desktop) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Live Quotation Summary Card */}
              <div className="bg-gradient-to-br from-[#4d1f2e] via-[#5c1c3f] to-[#34091a] text-white p-6 sm:p-7 rounded-[2.5rem] shadow-2xl border border-rose-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-rose-800/60 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-bounce">👑</span>
                    <h3 className="text-lg font-black font-serif tracking-wide text-rose-200">Live Estimate</h3>
                  </div>
                  <span className="bg-rose-500/30 border border-rose-400/40 text-rose-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Real-Time
                  </span>
                </div>

                {/* Price Display */}
                <div className="mb-6 text-center bg-black/30 p-4 rounded-2xl border border-white/10">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-rose-300 font-serif font-bold block mb-1">
                    Estimated Investment Range
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-200">
                    ₹{liveEstimate.min.toLocaleString()} – ₹{liveEstimate.max.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-1 flex items-center justify-center gap-1">
                    <FiClock className="text-amber-400" />
                    <span>Estimated Session Time: <strong>~{liveEstimate.time} Hours</strong></span>
                  </div>
                </div>

                {/* Selected Specifications Checklist */}
                <div className="space-y-2.5 text-xs text-rose-100/90 mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1 border-b border-rose-900/50 pb-1">
                    Your Package Summary:
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-300">Event Occasion:</span>
                    <strong className="text-right text-white font-serif">{eventType}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-300">Hand & Foot:</span>
                    <strong className="text-right text-white font-serif">{handOptions[handCoverage]?.name.split(" (")[0]} + {footOptions[footCoverage]?.name.split(" (")[0]}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-300">Henna Stain:</span>
                    <strong className="text-right text-white font-serif">{hennaTypes[hennaType]?.name.split(" ")[0]} {hennaTypes[hennaType]?.name.split(" ")[1]}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-300">Guest Mehndi:</span>
                    <strong className="text-right text-white font-serif">{guestPackages[guestCount]?.label.split(" (")[0]}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-300">Artist Tier:</span>
                    <strong className="text-right text-amber-300 font-serif">{artistTiers[artistTier]?.name.split(" (")[0]}</strong>
                  </div>
                </div>

                {/* Guarantee Banner */}
                <div className="bg-white/10 rounded-xl p-3 text-[11px] text-stone-200 flex items-center gap-2.5 border border-white/10">
                  <FiShield className="text-amber-400 text-xl flex-shrink-0" />
                  <span>100% Dark Stain Guarantee • No Chemical Irritation • Professional On-Time Agra Doorstep Service</span>
                </div>
              </div>

              {/* Need Help Card */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-pink-200/80 shadow-md text-center">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-3 text-xl shadow-inner">
                  💬
                </div>
                <h4 className="font-bold text-[#4d1f2e] text-base font-serif mb-1">Confused about Styling?</h4>
                <p className="text-xs text-[#7a4857] mb-4 leading-relaxed">
                  Connect with Master Artist Jyoti directly on WhatsApp for personal bridal consultancy and mehndi design advice.
                </p>
                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="text-base" /> Chat with Artist Jyoti
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}
