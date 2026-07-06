import { compressImage } from "@/lib/imageUtils";
import SEO from "@/components/SEO";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/lib/authContext";
import { slugify } from "@/lib/slugify";
import { FiCheck, FiUploadCloud, FiMapPin, FiCalendar, FiClock, FiChevronDown, FiCheckCircle } from "react-icons/fi";
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [applyWallet, setApplyWallet] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);
  const [referralError, setReferralError] = useState("");
  const [verifyingReferral, setVerifyingReferral] = useState(false);
  const [referralDiscountAmount, setReferralDiscountAmount] = useState(0);
  const [giftCardInput, setGiftCardInput] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<any | null>(null);
  const [verifyingGiftCard, setVerifyingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState("");
  const [isVIPPass, setIsVIPPass] = useState(false);
  const [onlinePayAmount, setOnlinePayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"upi_direct" | "razorpay">("razorpay");

  // Load Razorpay Script dynamically on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);


  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    defaultValues: {
      serviceId: "",
      packageName: "",
      packagePrice: "",
      bookingDate: "",
      timeSlot: "",
      name: userData?.name || "",
      phone: userData?.phone || user?.phoneNumber || "",
      email: userData?.email || user?.email || "",
      password: "",
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
          if (router.query.coupon) setCouponCode(router.query.coupon as string);
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

  const basePrice = Number(watch("packagePrice") || selectedService?.price || 0);
  let finalPrice = basePrice;
  let returningDiscount = 0;
  let couponDiscount = 0;

  if (isReturningCustomer && basePrice > 5000) {
    returningDiscount = 100;
    finalPrice -= returningDiscount;
  }
  
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      couponDiscount = appliedCoupon.discountAmount;
    } else if (appliedCoupon.discountType === 'percent') {
      couponDiscount = (basePrice * appliedCoupon.discountAmount) / 100;
    }
    finalPrice -= couponDiscount;
  }
  if (finalPrice < 0) finalPrice = 0;

  let giftCardDeduction = 0;
  if (appliedGiftCard && appliedGiftCard.balance > 0) {
    giftCardDeduction = Math.min(finalPrice, appliedGiftCard.balance);
    finalPrice -= giftCardDeduction;
  }

  let walletDeduction = 0;
  if (applyWallet && userData?.walletBalance > 0) {
    walletDeduction = Math.min(finalPrice, userData.walletBalance);
    finalPrice -= walletDeduction;
  }

  const minDeposit = isVIPPass ? Math.min(200, finalPrice) : Math.round(finalPrice * 0.05);

  useEffect(() => {
    const minDep = isVIPPass ? Math.min(200, finalPrice) : Math.round(finalPrice * 0.05);
    setOnlinePayAmount(prev => {
      if (isVIPPass) return minDep;
      if (prev < minDep) return minDep;
      if (prev > finalPrice) return finalPrice;
      return prev;
    });
  }, [finalPrice, isVIPPass]);


  const applyCoupon = async () => {
    if (!couponCode) return;
    setVerifyingCoupon(true);
    setCouponError("");
    try {
      const codeUpper = couponCode.toUpperCase().trim();
      const docRef = doc(db, "coupons", codeUpper);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.isActive) {
          setCouponError("This coupon is no longer active.");
          return;
        }
        if (data.isFlashOffer && data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
          setCouponError("This flash offer has expired.");
          return;
        }
        if (data.minAmount && basePrice < data.minAmount) {
          setCouponError(`Minimum booking of ₹${data.minAmount} required.`);
          return;
        }
        setAppliedCoupon(data);
        setCouponError("");
      } else {
        setCouponError("Invalid coupon code.");
      }
    } catch (e) {
      setCouponError("Error verifying coupon.");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const applyGiftCard = async () => {
    if (!giftCardInput) return;
    setVerifyingGiftCard(true);
    setGiftCardError("");
    try {
      const codeUpper = giftCardInput.toUpperCase().trim();
      const q = query(collection(db, "gift_cards"), where("code", "==", codeUpper));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const giftCardDoc = snap.docs[0];
        const giftCardData = giftCardDoc.data();
        
        if (!giftCardData.isActive) {
          setGiftCardError("This Gift Card is inactive.");
          return;
        }
        if ((giftCardData.balance || 0) <= 0) {
          setGiftCardError("This Gift Card balance is 0.");
          return;
        }
        setAppliedGiftCard({ id: giftCardDoc.id, ...giftCardData });
        setGiftCardError("");
      } else {
        setGiftCardError("Invalid Gift Card code.");
      }
    } catch (e) {
      console.error(e);
      setGiftCardError("Error verifying Gift Card.");
    } finally {
      setVerifyingGiftCard(false);
    }
  };

  
  const applyReferralCode = async () => {
    if (!referralInput) return;
    setVerifyingReferral(true);
    setReferralError("");
    try {
      if (user && userData?.isReferralClaimed) {
        setReferralError("You have already used a referral code.");
        return;
      }
      
      const q = query(collection(db, "users"), where("referralCode", "==", referralInput.toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setReferralError("Invalid referral code.");
        return;
      }
      
      const referrer = snap.docs[0].data();
      if (referrer.uid === user?.uid) {
        setReferralError("You cannot use your own referral code.");
        return;
      }
      
      const settingsSnap = await getDoc(doc(db, "settings", "referral"));
      let discount = 50;
      if (settingsSnap.exists() && settingsSnap.data().isActive) {
        discount = settingsSnap.data().refereeDiscount || 50;
      }
      
      setAppliedReferral(referralInput.toUpperCase());
      setReferralDiscountAmount(discount);
    } catch (e) {
      setReferralError("Error verifying referral.");
    } finally {
      setVerifyingReferral(false);
    }
  };

  const processSharedServiceReferral = async (bookedServiceTitle: string) => {
    try {
      const sharedRef = localStorage.getItem("sharedServiceReferral");
      const sharedSlug = localStorage.getItem("sharedServiceSlug");
      if (sharedRef && sharedSlug && bookedServiceTitle) {
        const expectedSlug = slugify(bookedServiceTitle);
        if (sharedSlug === expectedSlug) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("referralCode", "==", sharedRef));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            const referrerData = referrerDoc.data();
            const currentWallet = referrerData.walletBalance || 0;
            await updateDoc(doc(db, "users", referrerDoc.id), {
              walletBalance: currentWallet + 20
            });
          }
        }
      }
    } catch (err) {
      console.error("Error processing shared service referral credit:", err);
    } finally {
      localStorage.removeItem("sharedServiceReferral");
      localStorage.removeItem("sharedServiceSlug");
    }
  };

  const onSubmit = async (data: any) => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      let finalCustomerId = user?.uid || "guest";
      let finalUserEmail = user?.email || data.email;
      let finalWalletBalance = userData?.walletBalance || 0;

      // Auto-Signup for Guests
      if (!user) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          finalCustomerId = userCredential.user.uid;
          
          let referredBy = appliedReferral || null;

          const baseName = data.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
          const referralCode = `${baseName}-${randomStr}`;

          let welcomeBalance = 0;

          // Process Referral Reward if referred
          if (referredBy) {
            try {
              const settingsSnap = await getDoc(doc(db, "settings", "referral"));
              if (settingsSnap.exists() && settingsSnap.data().isActive) {
                const settingsData = settingsSnap.data();
                welcomeBalance = settingsData.refereeDiscount || 50;

                const usersRef = collection(db, "users");
                const q = query(usersRef, where("referralCode", "==", referredBy));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  const referrerDoc = querySnapshot.docs[0];
                  const referrerData = referrerDoc.data();
                  await updateDoc(doc(db, "users", referrerDoc.id), {
                    pendingWalletBalance: (referrerData.pendingWalletBalance || 0) + (settingsData.referrerReward || 100)
                  });
                }
              }
            } catch (err) {
              console.error("Error processing referral:", err);
            }
          }

          finalWalletBalance = welcomeBalance;

          const newUserData = {
            uid: finalCustomerId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: "customer",
            createdAt: serverTimestamp(),
            referralCode: referralCode,
            walletBalance: welcomeBalance,
            pendingWalletBalance: 0,
            referredBy: referredBy || null,
            isReferralClaimed: !!referredBy,
          };

          await setDoc(doc(db, "users", finalCustomerId), newUserData);

        } catch (authErr: any) {
          console.error("Signup error during booking:", authErr);
          if (authErr.code === "auth/email-already-in-use") {
            setStepError("This email is already registered. Please log in first to book.");
          } else {
            setStepError("Failed to create account: " + authErr.message);
          }
          setLoading(false);
          return; // Stop booking if account creation fails
        }
      } else {
        // If user is logged in but used a referral code during this checkout
        if (appliedReferral && !userData?.isReferralClaimed) {
          try {
             const settingsSnap = await getDoc(doc(db, "settings", "referral"));
             if (settingsSnap.exists() && settingsSnap.data().isActive) {
                const settingsData = settingsSnap.data();
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("referralCode", "==", appliedReferral));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  const referrerDoc = querySnapshot.docs[0];
                  const referrerData = referrerDoc.data();
                  await updateDoc(doc(db, "users", referrerDoc.id), {
                    pendingWalletBalance: (referrerData.pendingWalletBalance || 0) + (settingsData.referrerReward || 100)
                  });
                  await updateDoc(doc(db, "users", finalCustomerId), {
                    isReferralClaimed: true,
                    referredBy: appliedReferral
                  });
                }
             }
          } catch(e) { console.error(e) }
        }
      }

      const bRef = "JM-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // If finalPrice is 0 OR paymentMethod is upi_direct, skip Razorpay!
      if (finalPrice === 0 || paymentMethod === "upi_direct") {
        const isFree = finalPrice === 0;
        const bookingData = {
          bookingRef: bRef,
          customerId: finalCustomerId,
          customerName: data.name,
          phone: data.phone,
          address: data.address,
          serviceId: data.serviceId || "package",
          serviceTitle: data.packageName || selectedService?.title,
          price: finalPrice,
          originalPrice: basePrice,
          couponCode: appliedCoupon?.code || null,
          couponDiscount: couponDiscount,
          returningDiscount: returningDiscount,
          isPackage: !!data.packageName,
          additionalNotes: data.additionalNotes,
          inspirationPhoto: imageURL,
          bookingDateString: data.bookingDate,
          bookingDate: new Date(data.bookingDate),
          timeSlot: data.timeSlot,
          status: "confirmed",
          paymentStatus: isFree ? "paid" : "pay_on_arrival",
          paymentId: isFree ? "free_booking" : "direct_upi_booking",
          paymentMethod: isFree ? "Free Discount" : "Direct UPI / Pay on Arrival",
          amountPaidOnline: 0,
          balanceDue: isFree ? 0 : finalPrice,
          isVIPPass: isVIPPass,
          giftCardUsed: appliedGiftCard?.code || null,
          giftCardDiscount: giftCardDeduction,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "bookings"), bookingData);

        // Process shared service referral reward
        await processSharedServiceReferral(bookingData.serviceTitle);

        // Deduct Gift Card balance
        if (giftCardDeduction > 0 && appliedGiftCard) {
          const newGiftCardBalance = Math.max(0, appliedGiftCard.balance - giftCardDeduction);
          await updateDoc(doc(db, "gift_cards", appliedGiftCard.id), {
            balance: newGiftCardBalance,
            isActive: newGiftCardBalance > 0
          });
        }

        // Deduct wallet balance
        if (walletDeduction > 0 && finalCustomerId !== "guest") {
          await updateDoc(doc(db, "users", finalCustomerId), {
            walletBalance: finalWalletBalance - walletDeduction
          });
        }
        
        // Send Email Notification
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "NEW_BOOKING", 
            data: {
              ...bookingData,
              email: finalUserEmail
            }
          })
        });

        router.push(`/dashboard?bookingSuccess=true`);
        return;
      }

      // Initiate Razorpay payment
      try {
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: onlinePayAmount,
            receipt: bRef,
          }),
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          console.error("Razorpay order error:", errData);
          setPaymentMethod("upi_direct");
          throw new Error(errData.message || errData.error || "Online payment gateway is offline or API keys are not set on live server. We have automatically selected 'Direct UPI / Pay on Arrival' mode—please click 'Confirm Instant Booking' below to complete your booking now!");
        }

        const orderData = await orderRes.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Jyoti Mehendi Artist",
          description: `Booking deposit for ${data.packageName || selectedService?.title}`,
          image: "https://jyotimehendi.in/logo.png",
          order_id: orderData.id,
          handler: async function (response: any) {
            setLoading(true);
            try {
              const bookingData = {
                bookingRef: bRef,
                customerId: finalCustomerId,
                customerName: data.name,
                phone: data.phone,
                address: data.address,
                serviceId: data.serviceId || "package",
                serviceTitle: data.packageName || selectedService?.title,
                price: finalPrice,
                originalPrice: basePrice,
                couponCode: appliedCoupon?.code || null,
                couponDiscount: couponDiscount,
                returningDiscount: returningDiscount,
                isPackage: !!data.packageName,
                additionalNotes: data.additionalNotes,
                inspirationPhoto: imageURL,
                bookingDateString: data.bookingDate,
                bookingDate: new Date(data.bookingDate),
                timeSlot: data.timeSlot,
                status: "confirmed",
                paymentStatus: onlinePayAmount === finalPrice ? "paid" : "advance_paid",
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                amountPaidOnline: onlinePayAmount,
                balanceDue: finalPrice - onlinePayAmount,
                isVIPPass: isVIPPass,
                giftCardUsed: appliedGiftCard?.code || null,
                giftCardDiscount: giftCardDeduction,
                createdAt: serverTimestamp(),
              };

              await addDoc(collection(db, "bookings"), bookingData);

              // Process shared service referral reward
              await processSharedServiceReferral(bookingData.serviceTitle);

              // Deduct Gift Card balance
              if (giftCardDeduction > 0 && appliedGiftCard) {
                const newGiftCardBalance = Math.max(0, appliedGiftCard.balance - giftCardDeduction);
                await updateDoc(doc(db, "gift_cards", appliedGiftCard.id), {
                  balance: newGiftCardBalance,
                  isActive: newGiftCardBalance > 0
                });
              }

              // Deduct wallet balance
              if (walletDeduction > 0 && finalCustomerId !== "guest") {
                await updateDoc(doc(db, "users", finalCustomerId), {
                  walletBalance: finalWalletBalance - walletDeduction
                });
              }
              
              // Send Email Notification
              await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  type: "NEW_BOOKING", 
                  data: {
                    ...bookingData,
                    email: finalUserEmail
                  }
                })
              });

              router.push(`/dashboard?bookingSuccess=true`);
            } catch (err: any) {
              console.error("Firestore booking creation error:", err);
              alert("Payment was successful, but we failed to record your booking. Please contact support immediately with your Payment ID: " + response.razorpay_payment_id);
              setLoading(false);
            }
          },
          prefill: {
            name: data.name,
            email: data.email,
            contact: data.phone,
          },
          notes: {
            bookingRef: bRef,
            customerAddress: data.address,
          },
          theme: {
            color: "#C2185B",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setStepError("Payment cancelled. Please pay the advance deposit to confirm your booking.");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setLoading(false);
          setStepError("Payment failed: " + resp.error.description);
        });
        rzp.open();
      } catch (gatewayErr: any) {
        console.error("Payment initialization failed:", gatewayErr);
        setStepError("Payment initialization failed: " + (gatewayErr.message || "Please check connection."));
        setLoading(false);
      }
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
      
      // Check for returning customer
      try {
        const q = query(collection(db, "bookings"), where("phone", "==", watch("phone")));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsReturningCustomer(true);
        } else {
          setIsReturningCustomer(false);
        }
      } catch (e) {
        console.error("Error checking returning customer status:", e);
      }
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
      <SEO 
        title="Book Best Mehndi Artist in Agra | Jyoti Mehendi Appointments"
        description="Book your Mehndi appointment with Agra's favorite artist, Jyoti Mehendi. Available for home service in Kamla Nagar, Dayalbagh, Tajganj and more."
      />

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
                              // Check database blocked slots
                              let isBlocked = blockedSlots.includes(slot);
                              let blockReason = "Booked";
                              
                              // Check 12-hour advance booking rule
                              if (!isBlocked && selectedDate) {
                                const startTimeStr = slot.split(" - ")[0]; // "09:00 AM"
                                const [timePart, period] = startTimeStr.split(" ");
                                let [hours, minutes] = timePart.split(":").map(Number);
                                if (period === "PM" && hours !== 12) hours += 12;
                                if (period === "AM" && hours === 12) hours = 0;
                                
                                const [year, month, day] = selectedDate.split("-").map(Number);
                                const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
                                const now = new Date();
                                
                                const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                                if (diffHours < 12) {
                                  isBlocked = true;
                                  blockReason = "Needs 12h notice";
                                }
                              }

                              const isSelected = watch("timeSlot") === slot;
                              return (
                                <div 
                                  key={slot}
                                  onClick={() => !isBlocked && setValue("timeSlot", slot)}
                                  className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                                    isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 
                                    isSelected ? 'bg-[var(--color-primary)] text-white shadow-md cursor-pointer' : 
                                    'bg-white border border-gray-200 text-gray-600 hover:border-[var(--color-primary)] cursor-pointer'
                                  }`}
                                >
                                  {slot} {isBlocked && <span className="block text-[10px] mt-0.5 text-gray-400">({blockReason})</span>}
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="your@email.com" 
                          {...register("email", { 
                            required: "Email is required",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" }
                          })} 
                          className={`w-full p-4 bg-gray-50/50 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-2 focus:border-transparent transition-all shadow-sm`} 
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                      </div>

                      {!user && (
                        <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Create Password</label>
                          <p className="text-[10px] text-gray-500 mb-3 italic">Create an account to track your booking and earn wallet rewards!</p>
                          <input 
                            type="password" 
                            placeholder="Create a password (min 6 chars)" 
                            {...register("password", { 
                              required: "Password is required to create an account",
                              minLength: { value: 6, message: "Password must be at least 6 characters" }
                            })} 
                            className={`w-full p-4 bg-white border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} rounded-xl focus:ring-2 focus:border-transparent transition-all shadow-sm`} 
                          />
                          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
                          
                          <div className="mt-4 text-center">
                            <span className="text-xs text-gray-500">Already have an account? </span>
                            <a href="/login" className="text-xs font-bold text-[var(--color-primary)] hover:underline">Log in here</a>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
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
                          <span className="text-gray-600 font-medium">Subtotal</span>
                          <span className="text-lg font-bold text-gray-800">₹{basePrice}</span>
                        </div>
                        
                        {/* Discount Display */}
                        {returningDiscount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="font-medium text-xs">Loyalty Discount (Returning)</span>
                            <span className="font-bold text-sm">-₹{returningDiscount}</span>
                          </div>
                        )}
                        {couponDiscount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="font-medium text-xs">Coupon ({appliedCoupon?.code})</span>
                            <span className="font-bold text-sm">-₹{couponDiscount}</span>
                          </div>
                        )}
                        
                        {/* Referral Display */}
                        {appliedReferral && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="font-medium text-xs">Referral Applied ({appliedReferral})</span>
                            <span className="font-bold text-sm">Reward Unlocked!</span>
                          </div>
                        )}
                        
                        {/* Gift Card Display */}
                        {giftCardDeduction > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="font-medium text-xs">Gift Card Applied ({appliedGiftCard?.code})</span>
                            <span className="font-bold text-sm">-₹{giftCardDeduction}</span>
                          </div>
                        )}

                        {/* Wallet Section */}
                        {userData?.walletBalance > 0 && (
                          <div className="py-3 border-t border-dashed border-gray-200">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  checked={applyWallet} 
                                  onChange={(e) => setApplyWallet(e.target.checked)}
                                  className="w-4 h-4 text-pink-500 rounded border-gray-300 focus:ring-pink-500"
                                />
                                <span className="font-bold text-sm text-gray-700">Use Wallet Balance (₹{userData.walletBalance})</span>
                              </div>
                              {applyWallet && <span className="font-bold text-sm text-green-600">-₹{walletDeduction}</span>}
                            </label>
                          </div>
                        )}
                        
                        <div className="pt-3 mt-3 border-t border-pink-200 flex justify-between items-center">
                          <span className="text-gray-800 font-bold">Final Amount</span>
                          <span className="text-2xl font-bold text-[var(--color-primary)]">₹{finalPrice}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Coupon Input Area */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
                      
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Have a Coupon Code?</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE" 
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm font-bold uppercase focus:border-[var(--color-primary)] outline-none"
                            disabled={!!appliedCoupon}
                          />
                          {appliedCoupon ? (
                            <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Remove</button>
                          ) : (
                            <button type="button" onClick={applyCoupon} disabled={verifyingCoupon || !couponCode} className="px-6 py-2 bg-[var(--color-header)] text-white font-bold text-sm rounded-lg hover:bg-[var(--color-primary)] transition-colors disabled:opacity-50">
                              {verifyingCoupon ? "..." : "Apply"}
                            </button>
                          )}
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                        {appliedCoupon && <p className="text-green-600 text-xs mt-2 font-bold">Coupon applied successfully!</p>}
                      </div>

                      {(!user || !userData?.isReferralClaimed) && (
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Have a Referral Code?</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={referralInput}
                            onChange={e => setReferralInput(e.target.value.toUpperCase())}
                            placeholder="REFERRAL CODE" 
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm font-bold uppercase focus:border-[var(--color-primary)] outline-none"
                            disabled={!!appliedReferral}
                          />
                          {appliedReferral ? (
                            <button type="button" onClick={() => { setAppliedReferral(null); setReferralInput(""); setReferralDiscountAmount(0); }} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Remove</button>
                          ) : (
                            <button type="button" onClick={applyReferralCode} disabled={verifyingReferral || !referralInput} className="px-6 py-2 bg-pink-600 text-white font-bold text-sm rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
                              {verifyingReferral ? "..." : "Apply"}
                            </button>
                          )}
                        </div>
                        {referralError && <p className="text-red-500 text-xs mt-2 font-medium">{referralError}</p>}
                        {appliedReferral && <p className="text-green-600 text-xs mt-2 font-bold">Referral applied! ₹50 reward unlocked on completion.</p>}
                      </div>
                      )}
                    </div>

                    {/* Gift Card Input Area */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Have a Gift Card Voucher?</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={giftCardInput}
                          onChange={e => setGiftCardInput(e.target.value.toUpperCase())}
                          placeholder="ENTER GIFT CARD CODE" 
                          className="flex-1 p-3 border border-gray-200 rounded-lg text-sm font-bold uppercase focus:border-[var(--color-primary)] outline-none"
                          disabled={!!appliedGiftCard}
                        />
                        {appliedGiftCard ? (
                          <button type="button" onClick={() => { setAppliedGiftCard(null); setGiftCardInput(""); }} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Remove</button>
                        ) : (
                          <button type="button" onClick={applyGiftCard} disabled={verifyingGiftCard || !giftCardInput} className="px-6 py-2 bg-pink-600 text-white font-bold text-sm rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
                            {verifyingGiftCard ? "..." : "Apply"}
                          </button>
                        )}
                      </div>
                      {giftCardError && <p className="text-red-500 text-xs mt-2 font-medium">{giftCardError}</p>}
                      {appliedGiftCard && <p className="text-green-600 text-xs mt-2 font-bold">Gift Card verified! ₹{appliedGiftCard.balance} balance available.</p>}
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm space-y-3">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                        Select Payment Mode *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div 
                          onClick={() => setPaymentMethod("razorpay")}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethod === "razorpay"
                              ? "border-pink-500 bg-pink-50/60 text-pink-900 font-bold shadow-sm ring-2 ring-pink-200"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔵</span>
                            <div>
                              <div className="text-sm font-extrabold flex items-center gap-1.5">
                                <span>Online Gateway (Razorpay)</span>
                                <span className="bg-pink-100 text-pink-700 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black">Default</span>
                              </div>
                              <div className="text-[11px] text-gray-500 font-normal">Credit Card / Debit / NetBanking / UPI</div>
                            </div>
                          </div>
                          {paymentMethod === "razorpay" && <FiCheckCircle className="text-pink-600 text-xl flex-shrink-0" />}
                        </div>

                        <div 
                          onClick={() => setPaymentMethod("upi_direct")}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethod === "upi_direct"
                              ? "border-green-500 bg-green-50/60 text-green-900 font-bold shadow-sm ring-2 ring-green-200"
                              : "border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🟢</span>
                            <div>
                              <div className="text-sm font-extrabold">Direct UPI / Pay on Arrival</div>
                              <div className="text-[11px] text-gray-500 font-normal">No gateway error • Instant 1-click booking</div>
                            </div>
                          </div>
                          {paymentMethod === "upi_direct" && <FiCheckCircle className="text-green-600 text-xl flex-shrink-0" />}
                        </div>
                      </div>
                      {paymentMethod === "upi_direct" && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium flex items-center gap-2 mt-2">
                          <span>💡 <strong>100% Guaranteed Booking:</strong> Confirm your booking now! You can pay the advance deposit directly via GooglePay / PhonePe to Master Artist Jyoti on WhatsApp.</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-pink-50 border border-pink-100 text-sm p-5 rounded-2xl mb-6 shadow-inner space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold">
                          <FiCheckCircle size={18} />
                          <span>Secure Online Advance Deposit</span>
                        </div>
                        {/* VIP Switch Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer bg-white py-1.5 px-3 rounded-full border border-pink-200 shadow-sm text-xs font-bold text-pink-700 select-none">
                          <input 
                            type="checkbox" 
                            checked={isVIPPass}
                            onChange={(e) => setIsVIPPass(e.target.checked)}
                            className="w-4 h-4 text-pink-500 rounded border-gray-300 focus:ring-pink-500"
                          />
                          <span>✨ VIP Priority (₹200 lock)</span>
                        </label>
                      </div>
                      
                      {isVIPPass ? (
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                          🌟 **VIP Priority Booking Activated**: Humne aapki priority booking ke liye online deposit ko exactly ₹{minDeposit} par fix kar diya hai. Baaki bacha hua amount post-service adjust ho jayega. Hum aapko VIP status assign karenge!
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                          Apni booking confirm karne ke liye aapko kam se kam 5% advance payment online karna hoga. Baaki bacha hua amount aap service complete hone ke baad artist ko de sakte hain. Aap chaho to zyaada amount (100% tak) bhi abhi online pay kar sakte hain.
                        </p>
                      )}

                      <div className="bg-white p-4 rounded-xl border border-pink-100 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Online Advance to Pay Now:</span>
                          <span className="text-xl font-black text-[var(--color-primary)]">₹{onlinePayAmount}</span>
                        </div>

                        {!isVIPPass ? (
                          <>
                            <input 
                              type="range"
                              min={minDeposit}
                              max={finalPrice}
                              value={onlinePayAmount}
                              onChange={(e) => setOnlinePayAmount(Number(e.target.value))}
                              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-pink-600 mb-3"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              <span>Min: ₹{minDeposit} (5%)</span>
                              <span>Max: ₹{finalPrice} (100%)</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pink-500 font-bold uppercase tracking-wider text-center py-2 bg-pink-50/50 rounded-lg border border-pink-100">
                            🔒 Amount locked to VIP Priority Deposit of ₹{minDeposit}
                          </div>
                        )}
                      </div>

                      {/* Remaining Balance display */}
                      <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-t border-dashed border-pink-200 pt-3">
                        <span>Remaining Balance Due (Post-Service):</span>
                        <span className="text-sm font-extrabold text-gray-800">₹{finalPrice - onlinePayAmount}</span>
                      </div>
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
                        <span>Processing...</span>
                      </>
                    ) : (
                      paymentMethod === "upi_direct" || finalPrice === 0 ? "Confirm Instant Booking" : "Pay Online & Confirm"
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
