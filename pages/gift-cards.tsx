import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { FiGift, FiCopy, FiCheckCircle, FiArrowRight, FiMail, FiPhone, FiUser, FiStar, FiHeart } from "react-icons/fi";
import GiftCardVisual from "@/components/GiftCardVisual";

export default function GiftCards() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [showInstaModal, setShowInstaModal] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  // Form states
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);

  // Load Razorpay script dynamically on mount
  useEffect(() => {
    setMounted(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
    setFormError("");
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const num = Number(val);
    if (val && num < 500) {
      setFormError("Minimum Gift Card value is ₹500.");
    } else {
      setFormError("");
    }
  };

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!senderName || !senderEmail || !receiverName || !receiverPhone) {
      setFormError("Please fill out all required fields.");
      return;
    }

    if (finalAmount < 500) {
      setFormError("Minimum Gift Card value is ₹500.");
      return;
    }

    setLoading(true);
    try {
      const bRef = "GC-ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Initiate Razorpay checkout order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          receipt: bRef,
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to initialize payment gateway");
      }

      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Jyoti Mehendi Artist",
        description: `Premium Gift Card for ${receiverName}`,
        image: "https://jyotimehendi.in/logo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          setLoading(true);
          try {
            // Generate unique gift card code: GC-XXXX-XXXX
            const block1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const block2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const giftCardCode = `GC-${block1}-${block2}`;

            const giftCardData = {
              code: giftCardCode,
              amount: finalAmount,
              balance: finalAmount,
              senderName,
              senderEmail,
              receiverName,
              receiverEmail,
              receiverPhone,
              message: message || "A gift for a special day!",
              paymentId: response.razorpay_payment_id,
              paymentStatus: "paid",
              isActive: true,
              createdAt: serverTimestamp(),
              usedAt: null
            };

            await addDoc(collection(db, "gift_cards"), giftCardData);

            setSuccessData({
              code: giftCardCode,
              amount: finalAmount,
              receiverName,
              message: giftCardData.message
            });
            setLoading(false);
          } catch (err: any) {
            console.error("Firestore gift card creation error:", err);
            alert("Payment successful, but failed to register the Gift Card. Please contact support with Payment ID: " + response.razorpay_payment_id);
            setLoading(false);
          }
        },
        prefill: {
          name: senderName,
          email: senderEmail,
          contact: receiverPhone,
        },
        theme: {
          color: "#db2777"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Error creating gift card order:", err);
      setFormError(err.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <>
      <SEO 
        title="Purchase Premium Mehndi Gift Cards | Jyoti Mehendi Agra"
        description="Gift your loved ones a premium Mehndi session in Agra. Create custom valued gift cards (min ₹500) and send directly via WhatsApp."
      />
      <Navbar />

      <main className="bg-[var(--color-background)] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-[var(--color-header)] font-serif mb-4 flex items-center justify-center gap-3">
              <FiHeart className="text-rose-600 fill-rose-500/20 animate-bounce" />
              Love & Bridal Mehndi Gift Cards
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">
              Surprise your friends and family with Agra's best mehndi experiences. Create, customize, and gift instant vouchers online.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!successData ? (
              <motion.div 
                key="purchase-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Visual Previewer (Left side) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <h3 className="text-xs font-black uppercase text-pink-700 tracking-widest mb-4">Live Gift Card Preview</h3>
                  
                  <GiftCardVisual
                    receiverName={receiverName}
                    senderName={senderName}
                    message={message}
                    amount={finalAmount}
                  />

                  <ul className="mt-8 space-y-2 text-xs text-gray-500 font-medium">
                    <li className="flex items-center gap-2">✓ Can be used to book any service or package.</li>
                    <li className="flex items-center gap-2">✓ Multiple bookings allowed until balance reaches zero.</li>
                    <li className="flex items-center gap-2">✓ Strictly non-refundable and valid for 1 full year.</li>
                  </ul>
                </div>

                {/* Form (Right side) */}
                <form onSubmit={handlePurchase} className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] shadow-xl border border-pink-50 space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 font-serif border-b border-pink-50 pb-4">Customize Your Gift Voucher</h3>

                  {formError && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
                      ⚠️ {formError}
                    </div>
                  )}

                  {/* Sender inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sender Name *</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text"
                          required
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sender Email *</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="email"
                          required
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiver inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient Name *</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text"
                          required
                          value={receiverName}
                          onChange={(e) => setReceiverName(e.target.value)}
                          placeholder="Recipient Name"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="email"
                          value={receiverEmail}
                          onChange={(e) => setReceiverEmail(e.target.value)}
                          placeholder="recipent.email@gmail.com"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient Phone *</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="tel"
                          required
                          value={receiverPhone}
                          onChange={(e) => setReceiverPhone(e.target.value)}
                          placeholder="Recipient Phone"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Value options */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gift Voucher Value *</label>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[500, 1000, 2000, 5000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAmountSelect(val)}
                          className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                            amount === val && !customAmount
                              ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-600/20"
                              : "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                      <input 
                        type="number"
                        min="500"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter custom amount (Minimum ₹500)"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Greeting Message</label>
                    <textarea 
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a sweet greeting message (e.g. Wishing you a beautiful Mehendi session loaded with rich dark stain!)"
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                    />
                  </div>

                  {/* Submission */}
                  <button
                    type="submit"
                    disabled={loading || !!formError}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-pink-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Processing Order..." : `Purchase Voucher for ₹${finalAmount}`}
                    <FiArrowRight />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-pink-50 overflow-hidden text-center"
              >
                {/* Header background banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <FiCheckCircle size={36} />
                  </div>
                  <h2 className="text-2xl font-bold font-serif">Gift Voucher Purchased Successfully!</h2>
                  <p className="text-emerald-100 text-xs mt-1">Order receipt will be sent to your email.</p>
                </div>

                <div className="p-8 space-y-6">
                  {/* Visual Previewer summary */}
                  <div className="w-80 mx-auto">
                    <GiftCardVisual
                      receiverName={successData.receiverName}
                      senderName={successData.senderName || senderName}
                      message={successData.message}
                      amount={successData.amount}
                      interactive={true}
                    />
                  </div>

                  {/* Generated Code section */}
                  <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100 max-w-sm mx-auto">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-pink-700 mb-1">Unique Gift Voucher Code</p>
                    <p className="font-mono font-black text-2xl text-gray-800 tracking-wider select-all mb-4">
                      {successData.code}
                    </p>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      {copied ? (
                        <>
                          <FiCheckCircle className="text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <FiCopy /> Copy Voucher Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                    <a
                      href={`https://wa.me/91${receiverPhone}?text=${encodeURIComponent(
                        `Hey ${successData.receiverName}! 🎁 I have gifted you a Jyoti Mehendi Gift Voucher worth ₹${successData.amount}!\n\nUse Code: *${successData.code}*\nMessage: "${successData.message}"\n\nBook your mehndi artist in Agra here: https://jyotimehendi.in/booking`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl font-bold text-sm shadow-md shadow-green-500/20 transition-all w-full sm:w-auto"
                    >
                      <FaWhatsapp size={18} />
                      Send on WhatsApp
                    </a>
                    
                    <button
                      onClick={() => setShowInstaModal(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-90 text-white rounded-2xl font-bold text-sm shadow-md shadow-pink-500/20 transition-all w-full sm:w-auto"
                    >
                      <FaInstagram size={18} />
                      Instagram Story
                    </button>

                    <button
                      onClick={() => {
                        setSuccessData(null);
                        setSenderName("");
                        setSenderEmail("");
                        setReceiverName("");
                        setReceiverEmail("");
                        setReceiverPhone("");
                        setMessage("");
                        setAmount(1000);
                        setCustomAmount("");
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all w-full sm:w-auto"
                    >
                      Purchase Another Card
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Instagram Story Sharing Modal */}
      <AnimatePresence>
        {showInstaModal && successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="flex flex-col items-center max-w-md w-full relative space-y-6">
              {/* Close helper icon on desktop outside the 9:16 card */}
              <button
                onClick={() => {
                  setShowInstaModal(false);
                  setCopiedTags(false);
                }}
                className="absolute -top-12 right-2 text-pink-700 hover:text-pink-900 bg-pink-100/80 hover:bg-pink-200/80 p-2.5 rounded-full transition-all focus:outline-none border border-pink-200/40"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 9:16 Mobile Aspect Ratio Instagram Story Template */}
              <div 
                id="insta-story-template"
                className="w-full max-w-[340px] aspect-[9/16] bg-gradient-to-b from-[#fff5f8] via-[#ffd6e7] to-[#ffe5f0] rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(219,39,119,0.15)] relative flex flex-col justify-between overflow-hidden border border-pink-200/50 select-none"
              >
                {/* Visual Glow spots in background */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-rose-300/10 rounded-full blur-3xl pointer-events-none" />

                {/* Animated soft rising bubbles/sparkles inside story template */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-pink-400/30 pointer-events-none"
                    style={{
                      left: `${15 + i * 10}%`,
                      bottom: `${10 + Math.random() * 20}%`,
                      width: 8 + (i % 3) * 4,
                      height: 8 + (i % 3) * 4,
                    }}
                    animate={{
                      y: [0, -400],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 8 + i * 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 0.5,
                    }}
                  >
                    <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                      <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
                    </svg>
                  </motion.div>
                ))}

                {/* Header Section */}
                <div className="text-center mt-4 space-y-1.5 z-10">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-pink-600 via-rose-500 to-pink-700 bg-clip-text text-transparent animate-pulse flex items-center justify-center gap-1">
                    <FiStar className="text-pink-500 animate-pulse text-[8px]" />
                    Spoiled with Love
                    <FiStar className="text-pink-500 animate-pulse text-[8px]" />
                  </span>
                  <h2 className="font-serif font-black text-xl text-pink-950 leading-tight">
                    Blessed by {senderName || successData.senderName || "Someone Special"} 💖
                  </h2>
                  <p className="text-[8px] text-pink-700/60 uppercase tracking-widest font-semibold">exclusive mehendi voucher</p>
                </div>

                {/* Center Section: Redesigned Gift Card visual but slightly smaller & titled */}
                <div className="my-auto py-2 z-10 flex flex-col items-center">
                  <div className="w-[95%] transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                    <GiftCardVisual
                      receiverName={successData.receiverName}
                      senderName={senderName || successData.senderName}
                      message={successData.message}
                      amount={successData.amount}
                      interactive={true}
                    />
                  </div>
                  {/* Glassmorphic decorative subtitle overlay */}
                  <div className="mt-6 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl py-2 px-3 text-center max-w-[240px] shadow-[0_4px_12px_rgba(219,39,119,0.03)]">
                    <p className="text-[9px] text-pink-950/90 italic font-medium leading-relaxed">
                      "{successData.message || "A special Mehndi session is waiting for you!"}"
                    </p>
                    <div className="h-px bg-gradient-to-r from-transparent via-pink-300/20 to-transparent my-1.5" />
                    <p className="text-[8px] uppercase tracking-widest text-pink-700 font-bold">
                      📍 Jyoti Mehendi • Agra
                    </p>
                  </div>
                </div>

                {/* Bottom Story Callout */}
                <div className="text-center mb-4 space-y-1.5 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-600 to-rose-500 rounded-full text-[9px] font-bold text-white tracking-widest uppercase border border-pink-300/20 animate-bounce">
                    📸 Screenshot & Share
                  </div>
                  <p className="text-[8px] text-pink-800/80 font-medium">
                    Add this to your Instagram Story and tag <span className="text-pink-600 font-bold">@JyotiMehendi</span>!
                  </p>
                </div>
              </div>

              {/* Outside Controls (Not Screenshotted) */}
              <div className="w-full max-w-[340px] flex flex-col gap-3">
                <button
                  onClick={() => {
                    const tagText = `@JyotiMehendi @${(senderName || "Sender").replace(/\s+/g, "_")} @${successData.receiverName.replace(/\s+/g, "_")} #MehndiLove`;
                    navigator.clipboard.writeText(tagText);
                    setCopiedTags(true);
                    setTimeout(() => setCopiedTags(false), 2500);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-90 text-white rounded-2xl font-bold text-xs shadow-md transition-all"
                >
                  {copiedTags ? (
                    <>
                      <FiCheckCircle className="text-emerald-300" /> Copied Instagram Tags!
                    </>
                  ) : (
                    <>
                      <FiCopy /> Copy Instagram Tag Text
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowInstaModal(false);
                    setCopiedTags(false);
                  }}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-xs transition-all"
                >
                  Close & Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
