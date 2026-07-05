import { compressImage } from "@/lib/imageUtils";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, updateDoc, doc, query, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc, onSnapshot, getDoc, where } from "firebase/firestore";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminAssistantManager from "@/components/AdminAssistantManager";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { FiUsers, FiCalendar, FiDollarSign, FiLogOut, FiImage, FiLayout, FiPieChart, FiX, FiUploadCloud, FiClock, FiCheck, FiActivity, FiTag, FiGift, FiEdit3, FiCpu } from "react-icons/fi";
import { FullScreenLoader } from "@/components/Loader";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const { user, userData, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"bookings" | "partners" | "reports" | "gallery" | "hero" | "express" | "packages" | "finances" | "services" | "coupons" | "referrals" | "blogs" | "giftcards" | "assistant">("bookings");
  const [bookings, setBookings] = useState<any[]>([]);
  const [referralSettings, setReferralSettings] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [expressZones, setExpressZones] = useState<any[]>([]);
  const [eventPackages, setEventPackages] = useState<any[]>([]);
  const [packageEnquiries, setPackageEnquiries] = useState<any[]>([]);
  const [revenueTransactions, setRevenueTransactions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  // Gift Card States
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [newGcAmount, setNewGcAmount] = useState("");
  const [newGcReceiver, setNewGcReceiver] = useState("");
  const [newGcPhone, setNewGcPhone] = useState("");
  const [newGcEmail, setNewGcEmail] = useState("");
  const [newGcReason, setNewGcReason] = useState("");
  const [gcSearchQuery, setGcSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Coupon States
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponType, setNewCouponType] = useState("flat");
  const [newCouponMin, setNewCouponMin] = useState("0");
  const [isFlashOffer, setIsFlashOffer] = useState(false);
  const [flashBannerText, setFlashBannerText] = useState("");
  const [flashExpiresAt, setFlashExpiresAt] = useState("");

  // Finances States
  const [newTransactionAmount, setNewTransactionAmount] = useState("");
  const [newTransactionReason, setNewTransactionReason] = useState("");


  // Upload States
  const [uploading, setUploading] = useState(false);
  const [newDesktopImage, setNewDesktopImage] = useState("");
  const [newMobileImage, setNewMobileImage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState("Bridal");

  // Service States
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Bridal");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceImage, setNewServiceImage] = useState("");
  const [newServiceTrending, setNewServiceTrending] = useState(false);

  // Partner State
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerArea, setNewPartnerArea] = useState("");
  const [partnerInvites, setPartnerInvites] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== "admin")) {
      router.push("/login");
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (userData?.role !== "admin") return;

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    // 1. Live Bookings Listener
    const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false); // Turn off main page loader once we get our first load
    }, (err) => console.error("Bookings sync error:", err));
    unsubscribes.push(unsubBookings);

    // 2. Live Partners Listener
    const unsubPartners = onSnapshot(collection(db, "partners"), (snapshot) => {
      setPartners(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Partners sync error:", err));
    unsubscribes.push(unsubPartners);

    // 3. Live Designs Gallery Listener
    const galleryQuery = query(collection(db, "designs_gallery"), orderBy("uploadedAt", "desc"));
    const unsubGallery = onSnapshot(galleryQuery, (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Gallery sync error:", err));
    unsubscribes.push(unsubGallery);

    // 4. Live Hero Slides Listener
    const unsubHero = onSnapshot(collection(db, "hero_slides"), (snapshot) => {
      setHeroSlides(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Hero slides sync error:", err));
    unsubscribes.push(unsubHero);

    // 5. Live Express Zones Listener
    const unsubExpress = onSnapshot(collection(db, "express_zones"), (snapshot) => {
      setExpressZones(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Express zones sync error:", err));
    unsubscribes.push(unsubExpress);

    // 6. Live Event Packages Listener
    const unsubPackages = onSnapshot(collection(db, "event_packages"), (snapshot) => {
      setEventPackages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Packages sync error:", err));
    unsubscribes.push(unsubPackages);

    // 7. Live Package Enquiries Listener
    const enquiryQuery = query(collection(db, "package_enquiries"), orderBy("createdAt", "desc"));
    const unsubEnquiry = onSnapshot(enquiryQuery, (snapshot) => {
      setPackageEnquiries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Enquiry sync error:", err));
    unsubscribes.push(unsubEnquiry);

    // 8. Live Partner Invites Listener
    const unsubInvites = onSnapshot(collection(db, "partner_invites"), (snapshot) => {
      setPartnerInvites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Invites sync error:", err));
    unsubscribes.push(unsubInvites);

    // 9. Live Services Listener
    const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Services sync error:", err));
    unsubscribes.push(unsubServices);

    // 10. Live Revenue Transactions Listener
    const revenueQuery = query(collection(db, "revenue_transactions"), orderBy("createdAt", "desc"));
    const unsubRevenue = onSnapshot(revenueQuery, (snapshot) => {
      setRevenueTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Revenue sync error:", err));
    unsubscribes.push(unsubRevenue);

    // 11. Live Coupons Listener
    const unsubCoupons = onSnapshot(collection(db, "coupons"), (snapshot) => {
      setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Coupons sync error:", err));
    unsubscribes.push(unsubCoupons);

    // 12. Live Referral Settings Listener
    const unsubReferral = onSnapshot(doc(db, "settings", "referral"), (snapshot) => {
      if (snapshot.exists()) {
        setReferralSettings(snapshot.data());
      } else {
        setReferralSettings({
          isActive: false,
          referrerReward: 100,
          refereeDiscount: 50,
          minBookingValue: 500
        });
      }
    }, (err) => console.error("Referral sync error:", err));
    unsubscribes.push(unsubReferral);

    // 13. Live Gift Cards Listener
    const giftCardsQuery = query(collection(db, "gift_cards"), orderBy("createdAt", "desc"));
    const unsubGiftCards = onSnapshot(giftCardsQuery, (snapshot) => {
      setGiftCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Gift Cards sync error:", err));
    unsubscribes.push(unsubGiftCards);

    // Clean up all active listeners on unmount or session switch
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "desktop" | "mobile" | "gallery" | "service") => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large! Please use an image smaller than 10MB.");
      return;
    }

    setUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedBase64 }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Server Error";
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || errorMessage;
        } catch (e) {
          if (text.includes("Body exceeded")) errorMessage = "Image size is too large for the server.";
          else errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (target === "desktop") setNewDesktopImage(data.url);
      else if (target === "mobile") setNewMobileImage(data.url);
      else if (target === "gallery") setNewImage(data.url);
      else if (target === "service") setNewServiceImage(data.url);
      
      console.log(`Uploaded to ${target}:`, data.url);
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponDiscount) return;
    try {
      const codeUpper = newCouponCode.toUpperCase().trim();
      
      const couponData = {
        code: codeUpper,
        discountAmount: Number(newCouponDiscount),
        discountType: newCouponType,
        minAmount: Number(newCouponMin),
        isActive: true,
        createdAt: serverTimestamp(),
        isFlashOffer: isFlashOffer,
        bannerText: isFlashOffer ? flashBannerText : "",
        expiresAt: isFlashOffer && flashExpiresAt ? new Date(flashExpiresAt).toISOString() : null,
      };

      await setDoc(doc(db, "coupons", codeUpper), couponData);
      
      alert("Coupon added!");
      setNewCouponCode("");
      setNewCouponDiscount("");
      setNewCouponMin("0");
      setNewCouponType("flat");
      setIsFlashOffer(false);
      setFlashBannerText("");
      setFlashExpiresAt("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to add coupon: " + err.message);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "coupons", couponId), { isActive: !currentStatus });
    } catch (err) {
      alert("Failed to toggle coupon status");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteDoc(doc(db, "coupons", couponId));
    } catch (err) {
      alert("Failed to delete coupon");
    }
  };

  const handleIssueGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGcAmount || !newGcReceiver || !newGcPhone) return alert("Please fill all required fields");
    const amountVal = Number(newGcAmount);
    if (amountVal < 500) return alert("Minimum amount is ₹500");

    try {
      const block1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const block2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const giftCardCode = `GC-${block1}-${block2}`;

      const giftCardData = {
        code: giftCardCode,
        amount: amountVal,
        balance: amountVal,
        senderName: "ADMIN (Complimentary)",
        senderEmail: "admin@jyotimehendi.in",
        receiverName: newGcReceiver,
        receiverEmail: newGcEmail || "N/A",
        receiverPhone: newGcPhone,
        message: newGcReason || "Complimentary VIP gift voucher issued by Jyoti Mehendi",
        paymentId: "admin_issued",
        paymentStatus: "paid",
        isActive: true,
        createdAt: serverTimestamp(),
        usedAt: null
      };

      await addDoc(collection(db, "gift_cards"), giftCardData);

      alert(`Gift card generated successfully! Code: ${giftCardCode}`);
      setNewGcAmount("");
      setNewGcReceiver("");
      setNewGcPhone("");
      setNewGcEmail("");
      setNewGcReason("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to issue gift card: " + err.message);
    }
  };

  const handleToggleGiftCard = async (gcId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "gift_cards", gcId), { isActive: !currentStatus });
    } catch (err) {
      alert("Failed to toggle Gift Card status");
    }
  };

  const handleDeleteGiftCard = async (gcId: string) => {
    if (!confirm("Are you sure you want to delete this Gift Card?")) return;
    try {
      await deleteDoc(doc(db, "gift_cards", gcId));
    } catch (err) {
      alert("Failed to delete Gift Card");
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName || !newPartnerEmail || !newPartnerArea) return;
    try {
      const emailLower = newPartnerEmail.toLowerCase().trim();
      const inviteData = {
        name: newPartnerName,
        email: emailLower,
        area: newPartnerArea,
        role: "partner",
        status: "pending",
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "partner_invites", emailLower), inviteData);
      setPartnerInvites([{ id: emailLower, ...inviteData }, ...partnerInvites]);
      alert("Partner invited successfully! They can now sign up using this email to claim their account.");
      setNewPartnerName("");
      setNewPartnerEmail("");
      setNewPartnerArea("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to invite partner: " + err.message);
    }
  };

  const [newImage, setNewImage] = useState(""); // For gallery

  const handleAddGalleryItem = async () => {
    if (!newImage) return;
    try {
      const newItem = {
        imageURL: newImage,
        category: newCategory,
        uploadedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "designs_gallery"), newItem);
      setGalleryItems([{ id: docRef.id, ...newItem }, ...galleryItems]);
      setNewImage("");
    } catch (err) {
      alert("Error adding to gallery");
    }
  };

  const handleAddHeroSlide = async () => {
    if (!newDesktopImage || !newMobileImage || !newTitle) return;
    try {
      const newSlide = {
        image: newDesktopImage,
        mobileImage: newMobileImage,
        title: newTitle,
        subtitle: newSubtitle,
      };
      const docRef = await addDoc(collection(db, "hero_slides"), newSlide);
      setHeroSlides([...heroSlides, { id: docRef.id, ...newSlide }]);
      setNewDesktopImage("");
      setNewMobileImage("");
      setNewTitle("");
      setNewSubtitle("");
    } catch (err) {
      alert("Error adding hero slide");
    }
  };

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; col: string; id: string } | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; type: string; data: any } | null>(null);

  const deleteItem = async () => {
    if (!deleteModal) return;
    const { col, id } = deleteModal;
    try {
      await deleteDoc(doc(db, col, id));
      if (col === "designs_gallery") setGalleryItems(galleryItems.filter(i => i.id !== id));
      if (col === "hero_slides") setHeroSlides(heroSlides.filter(i => i.id !== id));
      if (col === "express_zones") setExpressZones(expressZones.filter(i => i.id !== id));
      if (col === "event_packages") setEventPackages(eventPackages.filter(i => i.id !== id));
      if (col === "package_enquiries") setPackageEnquiries(packageEnquiries.filter(i => i.id !== id));
      if (col === "partners") setPartners(partners.filter(i => i.id !== id));
      if (col === "bookings") setBookings(bookings.filter(i => i.id !== id));
      if (col === "services") setServices(services.filter(s => s.id !== id));
      setDeleteModal(null);
      alert("Deleted successfully!");
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      const { type, data } = editModal;
      let col = "";
      if (type === "zone") col = "express_zones";
      else if (type === "package") col = "event_packages";
      else if (type === "partner") col = "partners";
      else if (type === "booking") col = "bookings";
      else if (type === "gallery") col = "designs_gallery";
      else if (type === "service") col = "services";

      if (!col) return;

      const docRef = doc(db, col, data.id);
      // Clean up data before saving (remove id to not overwrite it in doc)
      const { id, ...updateData } = data;
      
      await updateDoc(docRef, updateData);

      // Update local state
      if (type === "zone") setExpressZones(expressZones.map(z => z.id === id ? { ...z, ...updateData } : z));
      else if (type === "package") setEventPackages(eventPackages.map(p => p.id === id ? { ...p, ...updateData } : p));
      else if (type === "partner") setPartners(partners.map(p => p.id === id ? { ...p, ...updateData } : p));
      else if (type === "booking") {
        setBookings(bookings.map(b => b.id === id ? { ...b, ...updateData } : b));
        const originalBooking = bookings.find(b => b.id === id);
        if (originalBooking && originalBooking.status !== updateData.status) {
          if (updateData.status === 'assigned' || updateData.status === 'dispatched') {
            fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "BOOKING_CONFIRMED", data: updateData })
            }).catch(console.error);
          }
          if (updateData.status === 'completed') {
            // Process Referral Unlock
            if (originalBooking.customerId && originalBooking.customerId !== "guest") {
              try {
                const customerDoc = await getDoc(doc(db, "users", originalBooking.customerId));
                if (customerDoc.exists()) {
                  const customerData = customerDoc.data();
                  if (customerData.referredBy && !customerData.isReferralClaimed) {
                    const settingsSnap = await getDoc(doc(db, "settings", "referral"));
                    if (settingsSnap.exists() && settingsSnap.data().isActive) {
                      const settingsData = settingsSnap.data();
                      
                      // Check minBookingValue
                      if (originalBooking.price >= (settingsData.minBookingValue || 0)) {
                        // Find referrer
                        const usersRef = collection(db, "users");
                        const q = query(usersRef, where("referralCode", "==", customerData.referredBy));
                        const querySnapshot = await getDocs(q);
                        
                        if (!querySnapshot.empty) {
                          const referrerDoc = querySnapshot.docs[0];
                          const referrerData = referrerDoc.data();
                          
                          const rewardAmount = settingsData.referrerReward || 100;
                          
                          // Move pending to approved wallet
                          await updateDoc(doc(db, "users", referrerDoc.id), {
                            pendingWalletBalance: Math.max(0, (referrerData.pendingWalletBalance || 0) - rewardAmount),
                            walletBalance: (referrerData.walletBalance || 0) + rewardAmount
                          });
                          
                          // Mark referral claimed for customer
                          await updateDoc(doc(db, "users", originalBooking.customerId), {
                            isReferralClaimed: true
                          });
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Error unlocking referral reward:", err);
              }
            }
          }
        }
      }
      else if (type === "gallery") setGalleryItems(galleryItems.map(g => g.id === id ? { ...g, ...updateData } : g));
      else if (type === "service") setServices(services.map(s => s.id === id ? { ...s, ...updateData } : s));

      setEditModal(null);
      alert("Updated successfully!");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  const [newZoneName, setNewZoneName] = useState("");

  const handleAddExpressZone = async () => {
    if (!newZoneName) return;
    try {
      const docRef = await addDoc(collection(db, "express_zones"), {
        name: newZoneName,
        createdAt: serverTimestamp()
      });
      setExpressZones([{ id: docRef.id, name: newZoneName }, ...expressZones]);
      setNewZoneName("");
    } catch (err: any) {
      alert("Failed to add zone: " + err.message);
    }
  };

  const seedExpressZones = async () => {
    const demoZones = ["Kamla Nagar", "Sanjay Place", "Shastripuram ❤️", "Tajganj", "Dayalbagh"];
    try {
      for (const zone of demoZones) {
        await addDoc(collection(db, "express_zones"), {
          name: zone,
          createdAt: serverTimestamp()
        });
      }
      // Refresh list
      const expressSnap = await getDocs(collection(db, "express_zones"));
      setExpressZones(expressSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert("Demo Areas added successfully!");
    } catch (err: any) {
      alert("Seeding failed: " + err.message);
    }
  };

  const seedGalleryDesigns = async () => {
    const demoDesigns = [
      { imageURL: "/images/gallery/bridal_1.png", category: "Bridal" },
      { imageURL: "/images/gallery/bridal_2.png", category: "Bridal" },
      { imageURL: "/images/gallery/bridal_3.png", category: "Bridal" },
      { imageURL: "/images/gallery/arabic_1.png", category: "Arabic" },
      { imageURL: "/images/gallery/arabic_2.png", category: "Arabic" },
      { imageURL: "/images/gallery/feet_1.png", category: "Feet" },
      { imageURL: "/images/gallery/feet_2.png", category: "Feet" }
    ];
    try {
      for (const design of demoDesigns) {
        await addDoc(collection(db, "designs_gallery"), {
          imageURL: design.imageURL,
          category: design.category,
          uploadedAt: serverTimestamp()
        });
      }
      // Refresh list
      const gallerySnap = await getDocs(query(collection(db, "designs_gallery"), orderBy("uploadedAt", "desc")));
      setGalleryItems(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert("Demo designs seeded successfully!");
    } catch (err: any) {
      alert("Seeding failed: " + err.message);
    }
  };

  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgPrice, setNewPkgPrice] = useState("");
  const [newPkgDesc, setNewPkgDesc] = useState("");
  const [newPkgFeatures, setNewPkgFeatures] = useState<string[]>([""]);
  const [newPkgTrending, setNewPkgTrending] = useState(false);

  const addFeatureInput = () => setNewPkgFeatures([...newPkgFeatures, ""]);
  const updateFeatureInput = (index: number, value: string) => {
    const updated = [...newPkgFeatures];
    updated[index] = value;
    setNewPkgFeatures(updated);
  };

  const handleAddPackage = async () => {
    if (!newPkgName || !newPkgPrice) return;
    try {
      const docRef = await addDoc(collection(db, "event_packages"), {
        name: newPkgName,
        price: Number(newPkgPrice),
        description: newPkgDesc,
        features: newPkgFeatures.filter(f => f.trim() !== ""),
        isTrending: newPkgTrending,
        createdAt: serverTimestamp()
      });
      setEventPackages([{ 
        id: docRef.id, 
        name: newPkgName, 
        price: Number(newPkgPrice), 
        description: newPkgDesc,
        features: newPkgFeatures.filter(f => f.trim() !== ""),
        isTrending: newPkgTrending
      }, ...eventPackages]);
      setNewPkgName(""); setNewPkgPrice(""); setNewPkgDesc(""); setNewPkgFeatures([""]);
      setNewPkgTrending(false);
    } catch (err: any) {
      alert("Failed to add package: " + err.message);
    }
  };

  const togglePackageTrending = async (id: string, currentTrending: boolean) => {
    try {
      await updateDoc(doc(db, "event_packages", id), { isTrending: !currentTrending });
    } catch (err: any) {
      alert("Failed to update trending status: " + err.message);
    }
  };

  const seedPackages = async () => {
    const demoPkgs = [
      { 
        name: "The Royal Queen (Bridal Contract)", 
        price: 21000, 
        desc: "Agra ki sabse sundar dulhan ke liye hamara sabse premium contract. Ismein har cheez 'Royal' hogi.",
        features: ["Exquisite Bridal Mehndi (Full Hands & Legs)", "Mehndi for 10 Close Family Members", "3 Senior Artists for 6 Hours", "Premium Dark-Stain Organic Henna", "Complimentary Touch-up & Aftercare Kit"]
      },
      { 
        name: "Suhagan Group Pack (Family Special)", 
        price: 7999, 
        desc: "Ghar ki ladies aur doston ke liye ek perfect combo. Kam time mein zyada khubsurti.",
        features: ["Mehndi for up to 10 Ladies", "Stylish Arabic & Floral Patterns", "2 Professional Artists", "Quick-Drying Henna for Busy Events", "Fixed Price - No Hidden Charges"]
      },
      { 
        name: "Shagun Party Contract (Events)", 
        price: 12500, 
        desc: "Engagement, Sangeet ya Kitty Party ke liye best choice. Poore function ki raunak badhayein.",
        features: ["Unlimited Mehndi for 3 Hours", "Team of 3 Experts Artists", "Special Party Designs (Front & Back)", "Travel & Setup Included", "Instant Booking Confirmation"]
      }
    ];
    try {
      for (const pkg of demoPkgs) {
        await addDoc(collection(db, "event_packages"), { ...pkg, createdAt: serverTimestamp() });
      }
      const pkgSnap = await getDocs(collection(db, "event_packages"));
      setEventPackages(pkgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert("Beautiful Royal Packages added!");
    } catch (err: any) {
      alert("Failed to seed: " + err.message);
    }
  };

  const handleAddService = async () => {
    if (!newServiceTitle || !newServicePrice || !newServiceDuration) {
      alert("Please fill in Title, Price, and Duration.");
      return;
    }
    try {
      await addDoc(collection(db, "services"), {
        title: newServiceTitle,
        category: newServiceCategory,
        price: Number(newServicePrice),
        duration: newServiceDuration,
        description: newServiceDesc,
        image: newServiceImage || "",
        isActive: true,
        isTrending: newServiceTrending,
        createdAt: serverTimestamp()
      });
      // Reset form states
      setNewServiceTitle("");
      setNewServiceCategory("Bridal");
      setNewServicePrice("");
      setNewServiceDuration("");
      setNewServiceDesc("");
      setNewServiceImage("");
      setNewServiceTrending(false);
      alert("Service added successfully!");
    } catch (err: any) {
      alert("Failed to add service: " + err.message);
    }
  };

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "services", id), { isActive: !currentStatus });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const toggleServiceTrending = async (id: string, currentTrending: boolean) => {
    try {
      await updateDoc(doc(db, "services", id), { isTrending: !currentTrending });
    } catch (err: any) {
      alert("Failed to update trending status: " + err.message);
    }
  };

  const seedServicesList = async () => {
    const demoServices = [
      { title: "Traditional Bridal Mehndi", description: "Intricate full-hand and foot art with Marwari/Rajasthani motifs like peacocks and lotuses.", price: 5000, duration: "5 hours", image: "/images/services/bridal.png", category: "Bridal", isActive: true },
      { title: "Arabic Floral Mehndi", description: "Bold, flowing patterns with elegant floral and vine motifs. Modern and stylish.", price: 1500, duration: "2 hours", image: "/images/services/arabic.png", category: "Arabic", isActive: true },
      { title: "Indo-Arabic Fusion", description: "A beautiful blend of traditional Indian intricacy and bold Arabic outlines.", price: 2500, duration: "3 hours", image: "/images/services/fusion.png", category: "Fusion", isActive: true },
      { title: "Leg & Foot Bridal", description: "Intricate bridal patterns extending from the feet to the legs for a complete look.", price: 3000, duration: "3 hours", image: "/images/services/leg.png", category: "Bridal", isActive: true },
      { title: "Minimalist Guest Mehndi", description: "Quick and elegant designs for wedding guests and small functions.", price: 500, duration: "30 mins", image: "/images/services/minimalist.png", category: "Guest", isActive: true },
    ];
    try {
      for (const s of demoServices) {
        await addDoc(collection(db, "services"), { ...s, createdAt: serverTimestamp() });
      }
      alert("Demo services added successfully!");
    } catch (err: any) {
      alert("Seeding failed: " + err.message);
    }
  };

  const updateSlideText = async (id: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, "hero_slides", id), { [field]: value });
      setHeroSlides(heroSlides.map(s => s.id === id ? { ...s, [field]: value } : s));
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const saveReferralSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "referral"), referralSettings, { merge: true });
      alert("Referral settings updated successfully!");
    } catch (err: any) {
      alert("Failed to update referral settings: " + err.message);
    }
  };

  if (authLoading || loading) return <FullScreenLoader />;
  if (!user || userData?.role !== "admin") return null;

  const handleAddRevenueTransaction = async (type: 'manual_adjustment' | 'reset', amount: number, reason: string) => {
    try {
      await addDoc(collection(db, "revenue_transactions"), {
        type,
        amount,
        reason,
        addedBy: userData?.email || "Admin",
        createdAt: serverTimestamp()
      });
      if (type === 'manual_adjustment') {
        setNewTransactionAmount("");
        setNewTransactionReason("");
        alert("Transaction added successfully!");
      } else {
        alert("Revenue reset successfully!");
      }
    } catch (err: any) {
      alert("Failed to add transaction: " + err.message);
    }
  };

  const handleDownloadTransactions = () => {
    const headers = ["Date", "Type", "Amount", "Reason", "Added By"];
    const rows = revenueTransactions.map(tx => [
      tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : "Pending",
      tx.type,
      tx.amount,
      tx.reason,
      tx.addedBy
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revenue_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRazorpayPayments = () => {
    const headers = ["Booking Ref", "Customer Name", "Phone", "Service Booked", "Booking Date", "Total Price", "Amount Paid Online", "Balance Due", "Razorpay Payment ID", "Order ID", "Date Created"];
    const filtered = bookings.filter(b => b.paymentId && b.paymentId !== 'free_booking');
    const rows = filtered.map(b => [
      b.bookingRef || "N/A",
      b.customerName || "N/A",
      b.phone || "N/A",
      b.serviceTitle || "N/A",
      b.bookingDateString || "N/A",
      b.price || 0,
      b.amountPaidOnline || 0,
      b.balanceDue || 0,
      b.paymentId || "N/A",
      b.razorpayOrderId || "N/A",
      b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleString() : "N/A"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "razorpay_payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Data preparation
  const razorpayRevenue = bookings.reduce((sum, b) => sum + (b.paymentId && b.paymentId !== 'free_booking' ? Number(b.amountPaidOnline || 0) : 0), 0);
  const totalBalanceDue = bookings.reduce((sum, b) => sum + Number(b.balanceDue || 0), 0);
  const bookingRevenue = bookings.reduce((a, b) => a + Number(b.price || 0), 0);
  const manualRevenue = revenueTransactions.reduce((a, tx) => a + Number(tx.amount || 0), 0);
  const totalRevenue = razorpayRevenue + manualRevenue;

  const revenueByStatus = bookings.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + Number(curr.price || 0);
    return acc;
  }, {} as Record<string, number>);

  const barData = {
    labels: Object.keys(revenueByStatus),
    datasets: [
      {
        label: "Revenue (₹)",
        data: Object.values(revenueByStatus),
        backgroundColor: ["#FF69B4", "#FFD700", "#FFB6C1", "#4ADE80", "#F87171"],
      }
    ]
  };

  const statusCount = bookings.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const doughnutData = {
    labels: Object.keys(statusCount),
    datasets: [
      {
        data: Object.values(statusCount),
        backgroundColor: ["#FF69B4", "#FFD700", "#FFB6C1", "#4ADE80", "#F87171"],
      }
    ]
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard | Jyoti Mehendi</title>
      </Head>

      <div className="bg-gray-50 min-h-screen pb-12">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-pink-600 text-white pt-28 pb-12 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
          {/* Subtle geometric texture overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-15 mix-blend-overlay"></div>
          {/* Soft background lighting accents */}
          <div className="absolute -left-20 -top-20 w-60 h-60 bg-pink-300 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
          <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-amber-100 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-serif tracking-tight text-white drop-shadow-sm">Admin Portal</h1>
              <p className="text-pink-100 font-medium text-xs md:text-sm mt-1.5 leading-relaxed">Manage system bookings, registers, partners, and analytics reports.</p>
            </div>
            <button onClick={handleSignOut} className="mt-4 md:mt-0 flex items-center space-x-2 bg-white/25 hover:bg-white/35 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md border border-white/20 backdrop-blur-sm">
              <FiLogOut /> <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-20px] relative z-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-3 md:p-6 border border-gray-100 flex flex-col md:flex-row items-center md:items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-pink-50 text-pink-500 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl"><FiCalendar /></div>
              <div><p className="text-gray-400 md:text-gray-500 text-[9px] md:text-sm font-bold uppercase tracking-wider md:normal-case">Bookings</p><p className="text-base md:text-2xl font-black text-gray-800">{bookings.length}</p></div>
            </div>
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-3 md:p-6 border border-gray-100 flex flex-col md:flex-row items-center md:items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-green-50 text-green-500 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl"><FiDollarSign /></div>
              <div><p className="text-gray-400 md:text-gray-500 text-[9px] md:text-sm font-bold uppercase tracking-wider md:normal-case">Revenue</p><p className="text-base md:text-2xl font-black text-gray-800">₹{totalRevenue}</p></div>
            </div>
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-3 md:p-6 border border-gray-100 flex flex-col md:flex-row items-center md:items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-50 text-purple-500 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl"><FiUsers /></div>
              <div><p className="text-gray-400 md:text-gray-500 text-[9px] md:text-sm font-bold uppercase tracking-wider md:normal-case">Partners</p><p className="text-base md:text-2xl font-black text-gray-800">{partners.filter(p => p.isAvailable).length}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden min-h-[60vh]">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto scroll-smooth custom-scrollbar pb-1">
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #fdf2f8; 
                  border-radius: 8px;
                  margin: 0 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #fbcfe8; 
                  border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #f472b6; 
                }
              `}</style>
              {[
                { id: "bookings", label: "Bookings", icon: <FiCalendar/> },
                { id: "partners", label: "Partners", icon: <FiUsers/> },
                { id: "services", label: "Services", icon: <FiActivity/> },
                { id: "gallery", label: "Gallery", icon: <FiImage/> },
                { id: "hero", label: "Hero Slider", icon: <FiLayout/> },
                { id: "express", label: "Express Zones", icon: <FiClock/> },
                { id: "packages", label: "Event Packages", icon: <FiUsers/> },
                { id: "coupons", label: "Coupons", icon: <FiTag/> },
                { id: "referrals", label: "Referrals", icon: <FiGift/> },
                { id: "giftcards", label: "Gift Cards", icon: <FiGift/> },
                { id: "blogs", label: "Blogs", icon: <FiEdit3/> },
                { id: "assistant", label: "AI Assistant", icon: <FiCpu/> },
                { id: "finances", label: "Finances", icon: <FiDollarSign/> },
                { id: "reports", label: "Reports", icon: <FiPieChart/> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 md:px-8 py-4 font-bold capitalize whitespace-nowrap transition-all flex items-center space-x-2 border-b-2 text-xs md:text-sm ${activeTab === tab.id ? "text-[var(--color-primary)] border-[var(--color-primary)] bg-pink-50/40" : "text-gray-500 border-transparent hover:bg-gray-50"}`}
                >
                  <span className="text-base">{tab.icon}</span> <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Referrals Tab */}
              {activeTab === "blogs" && (
                <AdminBlogManager />
              )}
              {activeTab === "assistant" && (
                <AdminAssistantManager />
              )}
              {activeTab === "referrals" && referralSettings && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold font-serif text-gray-800 flex items-center gap-2">
                        <FiGift className="text-pink-500" /> Referral & Wallet Program
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Configure rewards and rules for the referral system.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={referralSettings.isActive} onChange={(e) => setReferralSettings({...referralSettings, isActive: e.target.checked})} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${referralSettings.isActive ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${referralSettings.isActive ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Reward Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Referrer Reward (₹)</label>
                          <input 
                            type="number" 
                            value={referralSettings.referrerReward || 0} 
                            onChange={e => setReferralSettings({...referralSettings, referrerReward: Number(e.target.value)})} 
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Given to the person who shared the link.</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Referee Discount (₹)</label>
                          <input 
                            type="number" 
                            value={referralSettings.refereeDiscount || 0} 
                            onChange={e => setReferralSettings({...referralSettings, refereeDiscount: Number(e.target.value)})} 
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Given to the new user instantly in wallet.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Unlock Rules</h3>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Minimum Booking Value (₹)</label>
                        <input 
                          type="number" 
                          value={referralSettings.minBookingValue || 0} 
                          onChange={e => setReferralSettings({...referralSettings, minBookingValue: Number(e.target.value)})} 
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Referrer reward unlocks only if referee's first booking value is {">="} this amount.</p>
                      </div>
                    </div>

                    <button 
                      onClick={saveReferralSettings} 
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                    >
                      Save Referral Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "giftcards" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Issue New Gift Card */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 font-serif flex items-center gap-2">
                          <FiGift className="text-pink-500" /> Issue Complimentary Gift Card
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Generate a free VIP gift card without payment.</p>
                      </div>

                      <form onSubmit={handleIssueGiftCard} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Recipient Name *</label>
                          <input 
                            type="text" 
                            required
                            value={newGcReceiver} 
                            onChange={e => setNewGcReceiver(e.target.value)} 
                            placeholder="Name" 
                            className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-pink-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Recipient Phone *</label>
                            <input 
                              type="tel" 
                              required
                              value={newGcPhone} 
                              onChange={e => setNewGcPhone(e.target.value)} 
                              placeholder="Phone number" 
                              className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-pink-500 outline-none transition-all font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Recipient Email</label>
                            <input 
                              type="email" 
                              value={newGcEmail} 
                              onChange={e => setNewGcEmail(e.target.value)} 
                              placeholder="Optional" 
                              className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-pink-500 outline-none transition-all font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gift Card Value (₹) *</label>
                          <input 
                            type="number" 
                            min="500"
                            required
                            value={newGcAmount} 
                            onChange={e => setNewGcAmount(e.target.value)} 
                            placeholder="Minimum ₹500" 
                            className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-pink-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Issuing Reason</label>
                          <textarea 
                            rows={2} 
                            value={newGcReason} 
                            onChange={e => setNewGcReason(e.target.value)} 
                            placeholder="e.g. VIP Promo, Contest Winner, Compensation" 
                            className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-pink-500 outline-none transition-all resize-none font-medium"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md active:scale-[0.98]"
                        >
                          Generate & Issue Gift Card
                        </button>
                      </form>
                    </div>

                    {/* Right Panel: Gift Card Pool Ledger */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-50 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 font-serif">Voucher Ledger</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Total Vouchers: {giftCards.length} | Balance Pool: ₹{giftCards.reduce((acc, gc) => acc + (gc.balance || 0), 0)}
                          </p>
                        </div>
                        <input 
                          type="text" 
                          value={gcSearchQuery}
                          onChange={e => setGcSearchQuery(e.target.value)}
                          placeholder="Search Code or Name..." 
                          className="p-2 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-pink-500 max-w-[200px]"
                        />
                      </div>

                      <div className="overflow-x-auto border border-gray-50 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/50 text-gray-500">
                            <tr>
                              <th className="p-3 font-bold uppercase tracking-wider">Date</th>
                              <th className="p-3 font-bold uppercase tracking-wider">Code</th>
                              <th className="p-3 font-bold uppercase tracking-wider">Recipient Details</th>
                              <th className="p-3 font-bold uppercase tracking-wider">Balance / Value</th>
                              <th className="p-3 font-bold uppercase tracking-wider">Status</th>
                              <th className="p-3 font-bold uppercase tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {giftCards
                              .filter(gc => {
                                const q = gcSearchQuery.toLowerCase();
                                return (
                                  (gc.code || "").toLowerCase().includes(q) ||
                                  (gc.receiverName || "").toLowerCase().includes(q) ||
                                  (gc.receiverPhone || "").toLowerCase().includes(q)
                                );
                              })
                              .map(gc => (
                                <tr key={gc.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-3 text-gray-500 whitespace-nowrap">
                                    {gc.createdAt ? new Date(gc.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-pink-700">{gc.code}</td>
                                  <td className="p-3">
                                    <p className="font-bold text-gray-800">{gc.receiverName}</p>
                                    <p className="text-[10px] text-gray-400">{gc.receiverPhone}</p>
                                  </td>
                                  <td className="p-3 font-medium text-gray-800">
                                    ₹{gc.balance || 0} <span className="text-[10px] text-gray-400 font-normal">/ ₹{gc.amount}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                      gc.isActive && (gc.balance || 0) > 0
                                        ? "bg-green-50 text-green-600 border border-green-200"
                                        : "bg-red-50 text-red-500 border border-red-200"
                                    }`}>
                                      {gc.isActive && (gc.balance || 0) > 0 ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2 justify-center">
                                      <button 
                                        onClick={() => handleToggleGiftCard(gc.id, gc.isActive)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                                          gc.isActive 
                                            ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" 
                                            : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                        }`}
                                      >
                                        {gc.isActive ? "Pause" : "Resume"}
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteGiftCard(gc.id)}
                                        className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            {giftCards.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-400 text-xs">No Gift Vouchers in circulation.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === "bookings" && (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-4 rounded-tl-xl font-medium">Customer</th>
                          <th className="p-4 font-medium">Service</th>
                          <th className="p-4 font-medium">Date & Time</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Assign Partner</th>
                          <th className="p-4 rounded-tr-xl font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.map(booking => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">{booking.customerName}</span>
                                  {booking.isVIPPass && (
                                    <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border border-pink-100">
                                      ✨ VIP Priority
                                    </span>
                                  )}
                                </div>
                                {booking.bookingRef && <span className="text-[10px] font-mono font-bold text-[var(--color-primary)] mt-0.5">{booking.bookingRef}</span>}
                                {booking.phone ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <a 
                                      href={`tel:${booking.phone}`} 
                                      className="font-extrabold text-[var(--color-primary)] hover:underline flex items-center gap-1 text-xs"
                                      title="Call Customer"
                                    >
                                      📞 {booking.phone}
                                    </a>
                                    <a 
                                      href={`https://wa.me/91${booking.phone}?text=Hello%20${encodeURIComponent(booking.customerName)}%2C%20Jyoti%20Mehendi%20Admin%20here%20regarding%20your%20booking%20for%20${encodeURIComponent(booking.serviceTitle)}.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                                      title="Chat on WhatsApp"
                                    >
                                      💬 WhatsApp
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {booking.serviceTitle} <br/>
                              <span className="text-xs text-gray-500 font-semibold">₹{booking.price}</span>
                              {booking.bookingType === "express" && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-600 uppercase tracking-widest animate-pulse">🚀 Express</span>
                              )}
                            </td>
                            <td className="p-4">{booking.bookingDateString} <br/><span className="text-xs text-gray-500">{booking.timeSlot}</span></td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                booking.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                                booking.status === 'dispatched' ? 'bg-pink-100 text-pink-700 font-extrabold animate-pulse border border-pink-200' :
                                booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status.toUpperCase()}
                              </span>
                              {booking.status === 'completed' && booking.completedBy && (
                                <div className="text-[9px] text-gray-500 font-bold mt-1 uppercase">By: {booking.completedBy}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <select 
                                  className="border border-gray-300 rounded p-1 text-sm bg-white"
                                  value={booking.partnerId || ""}
                                  onChange={async (e) => {
                                    const pId = e.target.value;
                                    await updateDoc(doc(db, "bookings", booking.id), { partnerId: pId, status: "assigned" });
                                    setBookings(bookings.map(b => b.id === booking.id ? { ...b, partnerId: pId, status: "assigned" } : b));
                                    const partner = partners.find(p => p.id === pId);
                                    if (partner) {
                                      fetch("/api/notify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ type: "PARTNER_ASSIGNED", data: { ...booking, partnerEmail: partner.email } })
                                      }).catch(console.error);
                                    }
                                  }}
                                  disabled={booking.status === "completed" || booking.status === "cancelled"}
                                >
                                  <option value="" disabled>Select Partner</option>
                                  {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.area})</option>
                                  ))}
                                </select>
                            </td>
                            <td className="p-4 flex flex-col items-start gap-1">
                              <button onClick={() => setEditModal({ isOpen: true, type: "booking", data: booking })} className="text-[var(--color-primary)] font-semibold hover:underline text-[10px] uppercase tracking-tighter">Edit Details</button>
                              <button onClick={() => setDeleteModal({ isOpen: true, col: "bookings", id: booking.id })} className="text-red-500 font-semibold hover:underline text-[10px] uppercase tracking-tighter">Delete Booking</button>
                              <Link href={`/booking-slip/${booking.id}`} target="_blank" className="text-blue-500 font-bold hover:underline text-[10px] uppercase tracking-tighter">View Slip</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="block md:hidden space-y-4">
                    {bookings.map(booking => (
                      <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        {booking.bookingType === "express" && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-pink-400 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm animate-pulse">
                            🚀 EXPRESS DISPATCH
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-gray-800 text-base">{booking.customerName}</h4>
                              {booking.bookingRef && <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">{booking.bookingRef}</span>}
                              {booking.isVIPPass && (
                                <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase">
                                  ✨ VIP
                                </span>
                              )}
                            </div>
                            {booking.phone ? (
                              <div className="flex items-center gap-2 mt-1">
                                <a href={`tel:${booking.phone}`} className="text-pink-600 font-bold text-xs hover:underline flex items-center">
                                  📞 {booking.phone}
                                </a>
                                <a 
                                  href={`https://wa.me/91${booking.phone}?text=Hello%20${encodeURIComponent(booking.customerName)}%2C%20Jyoti%20Mehendi%20Admin%20here%20regarding%20your%20booking%20for%20${encodeURIComponent(booking.serviceTitle)}.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 font-bold text-xs flex items-center gap-0.5"
                                >
                                  💬 Chat
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                            booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            booking.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'dispatched' ? 'bg-pink-100 text-pink-700 animate-pulse border border-pink-200' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                          {booking.status === 'completed' && booking.completedBy && (
                            <div className="text-[9px] text-gray-500 font-bold text-right mt-1 uppercase">By: {booking.completedBy}</div>
                          )}
                        </div>

                        <div className="space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-400">Service:</span>
                            <span className="font-bold text-gray-800">{booking.serviceTitle} (₹{booking.price})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-400">Schedule:</span>
                            <span className="font-bold text-gray-800">{booking.bookingDateString} | {booking.timeSlot}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-gray-400 w-16">Address:</span>
                            <span className="font-bold text-gray-800 text-right leading-relaxed flex-1 ml-4">{booking.address}</span>
                          </div>
                          {booking.additionalNotes && (
                            <div className="bg-pink-50/50 p-2 rounded-lg mt-2 text-[11px]">
                              <span className="font-semibold text-gray-400">Notes:</span> {booking.additionalNotes}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assign Partner</label>
                            <select 
                              className="w-full border border-gray-300 rounded-xl px-2 py-1.5 text-xs bg-white font-bold"
                              value={booking.partnerId || ""}
                              onChange={async (e) => {
                                const pId = e.target.value;
                                await updateDoc(doc(db, "bookings", booking.id), { partnerId: pId, status: "assigned" });
                                setBookings(bookings.map(b => b.id === booking.id ? { ...b, partnerId: pId, status: "assigned" } : b));
                                const partner = partners.find(p => p.id === pId);
                                if (partner) {
                                  fetch("/api/notify", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ type: "PARTNER_ASSIGNED", data: { ...booking, partnerEmail: partner.email } })
                                  }).catch(console.error);
                                }
                              }}
                              disabled={booking.status === "completed" || booking.status === "cancelled"}
                            >
                              <option value="" disabled>Select Partner</option>
                              {partners.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.area})</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end items-center gap-3 pt-2">
                            <button onClick={() => setEditModal({ isOpen: true, type: "booking", data: booking })} className="bg-pink-50 hover:bg-pink-100 text-[var(--color-primary)] font-extrabold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors">Edit</button>
                            <button onClick={() => setDeleteModal({ isOpen: true, col: "bookings", id: booking.id })} className="bg-red-50 hover:bg-red-100 text-red-500 font-extrabold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors">Delete</button>
                            <Link href={`/booking-slip/${booking.id}`} target="_blank" className="bg-blue-50 hover:bg-blue-100 text-blue-500 font-extrabold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors text-center">Slip</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <p className="text-center text-gray-400 py-8 italic">No bookings found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Partners Tab */}
              {activeTab === "partners" && (
                <div className="space-y-8">
                  {/* Register Form */}
                  <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 shadow-sm">
                    <h3 className="font-bold text-lg text-[var(--color-header)] mb-4">Invite New Partner</h3>
                    <form onSubmit={handleAddPartner} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                        <input type="text" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} required className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Riya Mehndi Art" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email Address</label>
                        <input type="email" value={newPartnerEmail} onChange={e => setNewPartnerEmail(e.target.value)} required className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="partner@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Operational Area</label>
                        <input type="text" value={newPartnerArea} onChange={e => setNewPartnerArea(e.target.value)} required className="w-full p-2.5 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Kamla Nagar" />
                      </div>
                      <button type="submit" className="bg-[var(--color-primary)] text-white font-bold py-2.5 px-6 rounded-lg hover:bg-[var(--color-header)] transition-colors shadow-md w-full">
                        Send Invite
                      </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-3 italic">* The partner simply needs to 'Sign Up' using this exact email address to claim their account.</p>
                  </div>

                  {/* Active Partners List */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center space-x-2"><span>Registered Partners</span> <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{partners.length} Active</span></h3>
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                          <tr>
                            <th className="p-4 font-medium">Partner Name</th>
                            <th className="p-4 font-medium">Contact</th>
                            <th className="p-4 font-medium">Area</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {partners.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">{p.name}</span>
                                  <span className="text-[10px] text-amber-500 font-bold mt-0.5">⭐ {p.rating?.toFixed(1) || "5.0"} Avg Rating</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {p.phone ? (
                                  <div className="flex flex-col">
                                    <a href={`tel:${p.phone}`} className="font-extrabold text-[var(--color-primary)] hover:underline flex items-center gap-1 text-xs">
                                      📞 {p.phone}
                                    </a>
                                    <span className="text-[10px] text-gray-400 mt-0.5">{p.email}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs font-semibold">{p.email}</span>
                                )}
                              </td>
                              <td className="p-4 text-gray-600">{p.area || "Not specified"}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                                  p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                }`}>
                                  {p.isAvailable ? "AVAILABLE" : "OFFLINE"}
                                </span>
                              </td>
                              <td className="p-4 flex gap-2 items-center">
                                {p.phone && (
                                  <>
                                    <a 
                                      href={`tel:${p.phone}`} 
                                      className="bg-green-50 hover:bg-green-100 text-green-600 font-extrabold px-2.5 py-1 rounded-lg border border-green-100/50 text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                      Call Partner
                                    </a>
                                    <a 
                                      href={`https://wa.me/91${p.phone}?text=Hello%20${encodeURIComponent(p.name)}%2C%20Jyoti%20Mehendi%20Admin%20here.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-100/50 text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                      WhatsApp
                                    </a>
                                  </>
                                )}
                                <button onClick={() => setEditModal({ isOpen: true, type: "partner", data: p })} className="text-pink-500 font-bold hover:underline text-[10px] uppercase tracking-wider">Edit</button>
                                <button onClick={() => setDeleteModal({ isOpen: true, col: "partners", id: p.id })} className="text-red-500 font-bold hover:underline text-[10px] uppercase tracking-wider">Delete</button>
                              </td>
                            </tr>
                          ))}
                          {partners.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No active partners yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="block md:hidden space-y-4">
                      {partners.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-extrabold text-gray-800 text-base">{p.name}</h4>
                              <p className="text-[10px] text-amber-500 font-bold mt-0.5 uppercase tracking-wider">⭐ {p.rating?.toFixed(1) || "5.0"} Rating</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                              p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {p.isAvailable ? "AVAILABLE" : "OFFLINE"}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-400">Contact:</span>
                              {p.phone ? (
                                <a href={`tel:${p.phone}`} className="font-extrabold text-pink-600 hover:underline">
                                  📞 {p.phone}
                                </a>
                              ) : (
                                <span className="font-bold text-gray-800">{p.email}</span>
                              )}
                            </div>
                            {p.phone && (
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-400">Email:</span>
                                <span className="font-bold text-gray-800">{p.email}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-400">Operational Area:</span>
                              <span className="font-bold text-[var(--color-primary)]">{p.area || "Not specified"}</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                            {p.phone ? (
                              <div className="flex gap-2">
                                <a 
                                  href={`tel:${p.phone}`} 
                                  className="bg-green-50 hover:bg-green-100 text-green-600 font-extrabold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                >
                                  Call
                                </a>
                                <a 
                                  href={`https://wa.me/91${p.phone}?text=Hello%20${encodeURIComponent(p.name)}%2C%20Jyoti%20Mehendi%20Admin%20here.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            ) : (
                              <div></div>
                            )}
                            <div className="flex gap-3">
                              <button onClick={() => setEditModal({ isOpen: true, type: "partner", data: p })} className="bg-pink-50 text-pink-500 font-extrabold px-3 py-2 rounded-xl text-xs uppercase transition-colors">Edit</button>
                              <button onClick={() => setDeleteModal({ isOpen: true, col: "partners", id: p.id })} className="bg-red-50 text-red-500 font-extrabold px-3 py-2 rounded-xl text-xs uppercase transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {partners.length === 0 && (
                        <p className="text-center text-gray-400 py-8 italic">No registered partners yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Pending Invites List */}
                  {partnerInvites.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center space-x-2"><span>Pending Invites</span> <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{partnerInvites.filter(i => i.status === "pending").length} Pending</span></h3>
                      
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                            <tr>
                              <th className="p-4 font-medium">Invited Name</th>
                              <th className="p-4 font-medium">Email Address</th>
                              <th className="p-4 font-medium">Area</th>
                              <th className="p-4 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {partnerInvites.map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="p-4 font-semibold text-gray-600">{inv.name}</td>
                                <td className="p-4 text-gray-500">{inv.email}</td>
                                <td className="p-4 text-gray-500">{inv.area}</td>
                                <td className="p-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'claimed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {inv.status === 'claimed' ? 'Claimed' : 'Waiting for Signup'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card List View */}
                      <div className="block md:hidden space-y-4">
                        {partnerInvites.map(inv => (
                          <div key={inv.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-extrabold text-gray-800 text-base">{inv.name}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${inv.status === 'claimed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {inv.status === 'claimed' ? 'CLAIMED' : 'PENDING'}
                              </span>
                            </div>
                            <div className="space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-400">Email:</span>
                                <span className="font-bold text-gray-800">{inv.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-400">Area:</span>
                                <span className="font-bold text-gray-800">{inv.area}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === "reports" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                  <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4 text-center">Revenue by Status</h3>
                    <div className="h-64"><Bar data={barData} options={{ maintainAspectRatio: false }} /></div>
                  </div>
                  <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center">
                    <h3 className="font-bold text-gray-700 mb-4 text-center">Booking Status Distribution</h3>
                    <div className="h-64 w-64"><Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} /></div>
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === "services" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 font-serif">Manage Mehndi Services</h3>
                      <button 
                        onClick={seedServicesList}
                        className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1 rounded-lg transition-colors font-bold border border-pink-200"
                      >
                        Seed Demo Services
                      </button>
                    </div>

                    {/* Add New Service Form */}
                    <div className="bg-pink-50/30 p-8 rounded-[32px] border border-pink-100 mb-8">
                      <h4 className="font-bold text-pink-700 text-lg mb-6 flex items-center"><FiActivity className="mr-2"/> Create New Service</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Service Title</label>
                            <input 
                              type="text" 
                              value={newServiceTitle} 
                              onChange={(e)=>setNewServiceTitle(e.target.value)} 
                              placeholder="e.g. Traditional Bridal Mehndi" 
                              className="w-full p-4 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-pink-400 text-sm" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Category</label>
                              <select 
                                value={newServiceCategory} 
                                onChange={(e)=>setNewServiceCategory(e.target.value)} 
                                className="w-full p-4 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                              >
                                <option>Bridal</option>
                                <option>Arabic</option>
                                <option>Fusion</option>
                                <option>Mandala</option>
                                <option>Geometric</option>
                                <option>Minimalist</option>
                                <option>Guest</option>
                                <option>Modern</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Price (₹)</label>
                              <input 
                                type="number" 
                                value={newServicePrice} 
                                onChange={(e)=>setNewServicePrice(e.target.value)} 
                                placeholder="e.g. 5000" 
                                className="w-full p-4 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-pink-400 text-sm" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Duration</label>
                              <input 
                                type="text" 
                                value={newServiceDuration} 
                                onChange={(e)=>setNewServiceDuration(e.target.value)} 
                                placeholder="e.g. 5 hours, 45 mins" 
                                className="w-full p-4 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-pink-400 text-sm" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Short Description</label>
                            <textarea 
                              value={newServiceDesc} 
                              onChange={(e)=>setNewServiceDesc(e.target.value)} 
                              placeholder="Write a charming description of the service..." 
                              rows={5} 
                              className="w-full p-4 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-pink-400 resize-none text-sm" 
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Service Image (Optional) <span className="text-[10px] text-pink-500 normal-case ml-1">(Rec: 600x600px, Max 1MB)</span></label>
                            <div className="flex items-center space-x-4 bg-white p-3 border border-gray-200 rounded-2xl shadow-sm">
                              <input 
                                type="file" 
                                onChange={(e) => handleImageUpload(e, "service")} 
                                className="text-xs cursor-pointer flex-1" 
                              />
                              {uploading && <span className="text-xs text-pink-500 animate-pulse">Uploading...</span>}
                              {newServiceImage && (
                                <img src={newServiceImage} className="w-12 h-12 rounded-xl object-cover border" alt="Preview"/>
                              )}
                            </div>
                          </div>

                          <div className="pt-2">
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={newServiceTrending} 
                                onChange={(e)=>setNewServiceTrending(e.target.checked)} 
                                className="w-5 h-5 text-pink-600 border-gray-300 rounded-xl focus:ring-pink-500 cursor-pointer" 
                              />
                              <span className="text-sm font-extrabold text-pink-700 uppercase tracking-wider flex items-center">
                                🔥 Mark as Trending Service
                              </span>
                            </label>
                          </div>

                        </div>
                      </div>

                      <button 
                        onClick={handleAddService} 
                        disabled={!newServiceTitle || !newServicePrice || !newServiceDuration || uploading}
                        className="w-full bg-[var(--color-primary)] hover:bg-pink-600 text-white py-4 rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-pink-100 disabled:opacity-50"
                      >
                        Create Premium Service
                      </button>
                    </div>

                    {/* Services Listing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {services.map(service => {
                        const getDefaultImage = (title: string) => {
                          const t = title.toLowerCase();
                          if (t.includes('bridal')) return '/images/services/bridal.png';
                          if (t.includes('arabic')) return '/images/services/arabic.png';
                          if (t.includes('portrait')) return '/images/services/portrait.png';
                          if (t.includes('mandala')) return '/images/services/mandala.png';
                          if (t.includes('fusion')) return '/images/services/fusion.png';
                          return '/images/services/minimalist.png';
                        };

                        return (
                          <div 
                            key={service.id} 
                            className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all relative flex flex-col group"
                          >
                            <div className="relative h-48 overflow-hidden bg-pink-50">
                              <img 
                                src={service.image || getDefaultImage(service.title)} 
                                onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
                                alt={service.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                              <div className="absolute top-3 left-3">
                                <span className="bg-white/90 backdrop-blur-md text-[var(--color-primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                  {service.category || 'Service'}
                                </span>
                              </div>
                              <div className="absolute top-3 right-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-full font-bold text-sm shadow-md">
                                ₹{service.price}
                              </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                              <h4 className="text-xl font-bold text-gray-800 font-serif leading-snug mb-2">{service.title}</h4>
                              <div className="flex items-center text-xs text-gray-400 font-semibold mb-3 space-x-3">
                                <span className="flex items-center">
                                  <svg className="w-3.5 h-3.5 mr-1 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {service.duration}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${service.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </div>
                              <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-grow line-clamp-3">{service.description}</p>
                              
                              <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-gray-400 font-black uppercase w-12">Visible:</span>
                                    <button
                                      onClick={() => toggleServiceStatus(service.id, service.isActive)}
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${service.isActive ? 'bg-pink-500' : 'bg-gray-200'}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${service.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-gray-400 font-black uppercase w-12">Trending:</span>
                                    <button
                                      onClick={() => toggleServiceTrending(service.id, service.isTrending || false)}
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${service.isTrending ? 'bg-pink-500' : 'bg-gray-200'}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${service.isTrending ? 'translate-x-4' : 'translate-x-0'}`}
                                      />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => setEditModal({ isOpen: true, type: "service", data: service })}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => setDeleteModal({ isOpen: true, col: "services", id: service.id })}
                                    className="bg-red-50 hover:bg-red-100 text-red-500 font-extrabold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {services.length === 0 && (
                        <p className="col-span-full text-center text-gray-400 py-10 italic bg-gray-50 rounded-2xl">No services found. Click "Seed Demo Services" to populate.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === "gallery" && (
                <div className="space-y-8">
                  <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-pink-700 flex items-center"><FiImage className="mr-2"/> Add New Gallery Item</h3>
                      <button 
                        onClick={seedGalleryDesigns}
                        className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1 rounded-lg transition-colors font-bold border border-pink-200"
                      >
                        Seed Demo Designs
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Select Image <span className="text-[10px] text-pink-500 normal-case ml-1">(Rec: 800x1200px, Max 2MB)</span></label>
                        <div className="relative border border-gray-300 rounded-lg p-2 bg-white flex items-center justify-between">
                          <input type="file" onChange={(e) => handleImageUpload(e, "gallery")} className="text-xs w-full cursor-pointer" />
                        </div>
                        {uploading && <p className="text-xs text-pink-500 mt-1 animate-pulse">Uploading to Cloudinary...</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Category</label>
                        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                          <option>Bridal</option>
                          <option>Arabic</option>
                          <option>Fusion</option>
                          <option>Mandala</option>
                          <option>Geometric</option>
                          <option>Minimalist</option>
                          <option>Guest</option>
                          <option>Modern</option>
                        </select>
                      </div>
                      <button 
                        onClick={handleAddGalleryItem} 
                        disabled={!newImage || uploading} 
                        className="bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--color-header)] transition-colors disabled:opacity-50 shadow-md"
                      >
                        Add to Gallery
                      </button>
                    </div>
                    {newImage && <div className="mt-4"><img src={newImage} className="h-32 rounded-lg shadow-sm border-2 border-white" alt="Preview"/></div>}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {galleryItems.map(item => (
                      <div key={item.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100">
                        <img src={item.imageURL} className="w-full h-full object-cover" alt="Gallery"/>
                        <div className="absolute inset-0 bg-black/40 md:bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button onClick={() => setEditModal({ isOpen: true, type: "gallery", data: item })} className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:scale-105 transition-transform font-bold">Edit</button>
                          <button onClick={() => setDeleteModal({ isOpen: true, col: "designs_gallery", id: item.id })} className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform"><FiX size={20}/></button>
                        </div>
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-[var(--color-header)]">{item.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero Slider Tab */}
              {activeTab === "hero" && (
                <div className="space-y-8">
                  <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
                    <h3 className="font-bold text-lg text-pink-700 mb-4 flex items-center"><FiLayout className="mr-2"/> Add Responsive Hero Slide</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Slide Title</label>
                          <input type="text" placeholder="e.g. Exquisite Bridal Mehndi" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Subtitle</label>
                          <input type="text" placeholder="e.g. Crafting memories..." value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white rounded-xl border border-pink-100">
                          <label className="block text-xs font-bold text-pink-600 mb-2 uppercase">1. Desktop Image (Wide) <span className="text-[10px] text-gray-400 normal-case ml-1">(Rec: 1920x1080px, Max 2MB)</span></label>
                          <input type="file" onChange={(e) => handleImageUpload(e, "desktop")} className="w-full text-xs" />
                          {newDesktopImage && <img src={newDesktopImage} className="mt-2 h-20 w-full object-cover rounded-lg border" alt="Desktop Preview"/>}
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-pink-100">
                          <label className="block text-xs font-bold text-pink-600 mb-2 uppercase">2. Mobile Image (Portrait) <span className="text-[10px] text-gray-400 normal-case ml-1">(Rec: 1080x1920px, Max 2MB)</span></label>
                          <input type="file" onChange={(e) => handleImageUpload(e, "mobile")} className="w-full text-xs" />
                          {newMobileImage && <img src={newMobileImage} className="mt-2 h-20 w-20 object-cover rounded-lg border" alt="Mobile Preview"/>}
                        </div>
                      </div>

                      <button 
                        onClick={handleAddHeroSlide} 
                        disabled={!newDesktopImage || !newMobileImage || !newTitle || uploading} 
                        className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl hover:bg-[var(--color-header)] transition-colors disabled:opacity-50 shadow-lg"
                      >
                        {uploading ? "Uploading..." : "Save Responsive Slide"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {heroSlides.map(slide => (
                      <div key={slide.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 group hover:shadow-md transition-shadow">
                        {/* Image Previews */}
                        <div className="flex space-x-3 flex-shrink-0">
                          <div className="text-center">
                            <img src={slide.image} className="w-32 h-20 rounded-lg object-cover shadow-sm border-2 border-white" alt="Desktop"/>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Desktop</p>
                          </div>
                          <div className="text-center">
                            <img src={slide.mobileImage || slide.image} className="w-16 h-20 rounded-lg object-cover shadow-sm border-2 border-white" alt="Mobile"/>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Mobile</p>
                          </div>
                        </div>

                        {/* Editable Content */}
                        <div className="flex-1 space-y-2 w-full">
                          <input 
                            type="text" 
                            value={slide.title} 
                            onChange={(e) => updateSlideText(slide.id, "title", e.target.value)}
                            className="font-bold text-gray-800 text-sm bg-transparent border-b border-transparent focus:border-blue-500 w-full outline-none p-1"
                            placeholder="Slide Title"
                          />
                          <textarea 
                            value={slide.subtitle} 
                            onChange={(e) => updateSlideText(slide.id, "subtitle", e.target.value)}
                            className="text-xs text-gray-500 bg-transparent border-b border-transparent focus:border-blue-500 w-full outline-none p-1 resize-none"
                            placeholder="Slide Subtitle"
                            rows={2}
                          />
                        </div>

                        {/* Delete Button */}
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, col: "hero_slides", id: slide.id })} 
                          className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                          title="Delete Slide"
                        >
                          <FiX size={20}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXPRESS ZONES TAB */}
              {activeTab === "express" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 font-serif">Manage Express Zones (20 Min Reach)</h3>
                    <button 
                      onClick={seedExpressZones}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-colors font-bold"
                    >
                      Seed Demo Areas
                    </button>
                  </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                      <input 
                        type="text" 
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        placeholder="Enter Area Name (e.g. Kamla Nagar)"
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)] outline-none"
                      />
                      <button 
                        onClick={handleAddExpressZone}
                        className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--color-header)] transition-all shadow-lg shadow-pink-100"
                      >
                        Add Area
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {expressZones.length > 0 ? expressZones.map(zone => (
                        <div key={zone.id} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-pink-50 transition-colors border border-gray-100">
                          <span className="font-medium text-gray-700">{zone.name}</span>
                          <div className="flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditModal({ isOpen: true, type: "zone", data: zone })}
                              className="bg-pink-100 text-pink-500 px-3 py-1 rounded-lg text-xs font-bold hover:bg-pink-200"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, col: "express_zones", id: zone.id })}
                              className="bg-red-100 text-red-500 p-1.5 rounded-lg hover:bg-red-200"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <p className="col-span-full text-center text-gray-400 py-8">No express zones added yet. Demo: Kamla Nagar, Sanjay Place.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PACKAGES TAB */}
              {activeTab === "packages" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 font-serif">Manage Event & Wedding Packages</h3>
                      <button 
                        onClick={seedPackages}
                        className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 px-3 py-1 rounded-lg transition-colors font-bold border border-amber-200"
                      >
                        Seed Demo Packages
                      </button>
                    </div>

                    <div className="bg-amber-50/30 p-8 rounded-[32px] border border-amber-100 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-gray-700">Package Name</label>
                          <input type="text" value={newPkgName} onChange={(e)=>setNewPkgName(e.target.value)} placeholder="e.g. Royal Bridal Contract" className="w-full p-4 rounded-2xl border border-white bg-white shadow-sm outline-none focus:ring-2 focus:ring-amber-400" />
                          
                          <label className="block text-sm font-bold text-gray-700">Starting Price (₹)</label>
                          <input type="number" value={newPkgPrice} onChange={(e)=>setNewPkgPrice(e.target.value)} placeholder="e.g. 15000" className="w-full p-4 rounded-2xl border border-white bg-white shadow-sm outline-none focus:ring-2 focus:ring-amber-400" />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-gray-700">Short Description</label>
                          <textarea value={newPkgDesc} onChange={(e)=>setNewPkgDesc(e.target.value)} placeholder="What is this package about?" rows={5} className="w-full p-4 rounded-2xl border border-white bg-white shadow-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-bold text-gray-700">Package Includes (Key Points)</label>
                          <button onClick={addFeatureInput} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg font-bold">+ Add Point</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {newPkgFeatures.map((feat, idx) => (
                            <input 
                              key={idx} 
                              type="text" 
                              value={feat} 
                              onChange={(e) => updateFeatureInput(idx, e.target.value)} 
                              placeholder={`Point ${idx+1} (e.g. Full Hand Bridal)`}
                              className="p-3 rounded-xl border border-white bg-white shadow-sm outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={newPkgTrending} 
                            onChange={(e)=>setNewPkgTrending(e.target.checked)} 
                            className="w-5 h-5 text-amber-600 border-gray-300 rounded-xl focus:ring-amber-500 cursor-pointer" 
                          />
                          <span className="text-sm font-extrabold text-amber-700 uppercase tracking-wider">
                            🔥 Mark as Trending Package
                          </span>
                        </label>
                      </div>

                      <button onClick={handleAddPackage} className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-700 transition-all shadow-xl shadow-amber-100">Create Luxury Package</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {eventPackages.map(pkg => (
                        <div key={pkg.id} className="bg-white border border-gray-100 p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all relative group border-t-4 border-t-amber-400">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-2xl font-bold text-gray-800 font-serif">{pkg.name}</h4>
                            <div className="text-right">
                              <span className="text-amber-600 font-bold text-2xl">₹{pkg.price}</span>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Starting At</p>
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm leading-relaxed mb-6">{pkg.description}</p>
                          
                          <div className="space-y-2 mb-6">
                            {pkg.features?.map((f: string, i: number) => (
                              <div key={i} className="flex items-center space-x-2 text-xs text-gray-600">
                                <span className="text-amber-500 font-bold">✓</span>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-400 font-black uppercase">Trending:</span>
                              <button
                                onClick={() => togglePackageTrending(pkg.id, pkg.isTrending || false)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pkg.isTrending ? 'bg-pink-500' : 'bg-gray-200'}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pkg.isTrending ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="absolute -top-3 -right-3 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditModal({ isOpen: true, type: "package", data: pkg })}
                              className="bg-blue-500 text-white px-3 py-1 text-xs rounded-full shadow-lg font-bold"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, col: "event_packages", id: pkg.id })}
                              className="bg-red-500 text-white p-2 rounded-full shadow-lg"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* NEW: PACKAGE ENQUIRIES TABLE */}
                    <div className="mt-16">
                      <h3 className="text-2xl font-bold text-gray-800 font-serif mb-6 flex items-center gap-3">
                        <span className="bg-pink-100 p-2 rounded-xl text-pink-600">📩</span>
                        Recent Package Enquiries
                      </h3>
                      {/* NEW: PACKAGE ENQUIRIES TABLE */}
                      <div className="mt-16">
                        <h3 className="text-2xl font-bold text-gray-800 font-serif mb-6 flex items-center gap-3">
                          <span className="bg-pink-100 p-2 rounded-xl text-pink-600">📩</span>
                          Recent Package Enquiries
                        </h3>
                        
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Customer</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Package</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Date & Address</th>
                                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {packageEnquiries.length > 0 ? packageEnquiries.map(enq => (
                                <tr key={enq.id} className="hover:bg-pink-50/30 transition-colors">
                                  <td className="p-5">
                                    <p className="font-bold text-gray-800">{enq.name}</p>
                                    <p className="text-sm text-pink-600 font-medium">{enq.phone}</p>
                                  </td>
                                  <td className="p-5">
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">
                                      {enq.packageName}
                                    </span>
                                  </td>
                                  <td className="p-5">
                                    <p className="text-sm font-bold text-gray-700">{enq.date}</p>
                                    <p className="text-xs text-gray-500 line-clamp-1">{enq.address}</p>
                                  </td>
                                  <td className="p-5">
                                    <button 
                                      onClick={() => setDeleteModal({ isOpen: true, col: "package_enquiries", id: enq.id })}
                                      className="text-red-400 hover:text-red-600 p-2"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="p-10 text-center text-gray-400 italic">No enquiries yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="block md:hidden space-y-4">
                          {packageEnquiries.length > 0 ? packageEnquiries.map(enq => (
                            <div key={enq.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-extrabold text-gray-800 text-base">{enq.name}</h4>
                                <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider">
                                  {enq.packageName}
                                </span>
                              </div>
                              <div className="space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-gray-400">Phone:</span>
                                  <a href={`tel:${enq.phone}`} className="text-pink-600 font-bold hover:underline">{enq.phone}</a>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-semibold text-gray-400">Date:</span>
                                  <span className="font-bold text-gray-800">{enq.date}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-gray-400 w-16">Address:</span>
                                  <span className="font-bold text-gray-800 text-right leading-relaxed flex-1 ml-4">{enq.address}</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                <button 
                                  onClick={() => setDeleteModal({ isOpen: true, col: "package_enquiries", id: enq.id })}
                                  className="bg-red-50 hover:bg-red-100 text-red-500 font-extrabold px-3 py-2 rounded-xl text-xs uppercase transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center text-gray-400 py-8 italic">No enquiries yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COUPONS TAB */}
              {activeTab === "coupons" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-pink-100/50">
                    <h3 className="text-2xl font-bold text-[var(--color-header)] font-serif mb-6 flex items-center">
                      <FiTag className="mr-3 text-[var(--color-primary)]" />
                      Manage Coupons
                    </h3>
                    
                    <form onSubmit={handleAddCoupon} className="flex flex-col gap-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Coupon Code</label>
                          <input type="text" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)} placeholder="e.g. DIWALI50" className="w-full p-4 border-2 border-white rounded-xl shadow-sm focus:border-pink-300 transition-all uppercase" required />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Type</label>
                          <select value={newCouponType} onChange={e => setNewCouponType(e.target.value)} className="w-full p-4 border-2 border-white rounded-xl shadow-sm focus:border-pink-300 transition-all bg-white font-bold text-gray-700">
                            <option value="flat">Flat (₹)</option>
                            <option value="percent">Percent (%)</option>
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Discount</label>
                          <input type="number" value={newCouponDiscount} onChange={e => setNewCouponDiscount(e.target.value)} placeholder={newCouponType === 'flat' ? "₹ Amount" : "% Amount"} className="w-full p-4 border-2 border-white rounded-xl shadow-sm focus:border-pink-300 transition-all" required />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Min. Booking</label>
                          <input type="number" value={newCouponMin} onChange={e => setNewCouponMin(e.target.value)} placeholder="0" className="w-full p-4 border-2 border-white rounded-xl shadow-sm focus:border-pink-300 transition-all" />
                        </div>
                        <div className="md:col-span-1">
                          <button type="submit" className="w-full bg-[var(--color-primary)] text-white p-4 rounded-xl font-bold shadow-md hover:bg-[var(--color-header)] hover:-translate-y-0.5 transition-all">
                            + Add Coupon
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4 mt-2">
                        <label className="flex items-center space-x-3 cursor-pointer mb-4">
                          <input type="checkbox" checked={isFlashOffer} onChange={e => setIsFlashOffer(e.target.checked)} className="w-5 h-5 accent-pink-500 rounded" />
                          <span className="font-bold text-gray-700">Make this a Limited Time Flash Offer?</span>
                        </label>
                        {isFlashOffer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Banner Title</label>
                              <input type="text" value={flashBannerText} onChange={e => setFlashBannerText(e.target.value)} placeholder="e.g. Navratri Special 20% Off!" className="w-full p-3 border-2 border-white rounded-xl focus:border-pink-300" required />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Expiration Date & Time</label>
                              <input type="datetime-local" value={flashExpiresAt} onChange={e => setFlashExpiresAt(e.target.value)} className="w-full p-3 border-2 border-white rounded-xl focus:border-pink-300" required />
                            </div>
                          </div>
                        )}
                      </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className={`p-6 rounded-2xl border-2 transition-all relative ${coupon.isActive ? 'border-pink-200 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="bg-pink-100 text-[var(--color-primary)] text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full">{coupon.code}</span>
                              {coupon.isFlashOffer && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-1 rounded">Flash Offer</span>}
                            </div>
                            <button 
                              onClick={() => setDeleteModal({ isOpen: true, col: "coupons", id: coupon.id })}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm"
                            >
                              <FiX />
                            </button>
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-3xl font-black text-gray-800">
                              {coupon.discountType === 'flat' ? `₹${coupon.discountAmount}` : `${coupon.discountAmount}%`}
                            </span>
                            <span className="text-sm font-bold text-gray-500 ml-1">OFF</span>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-4 font-medium">
                            Min. Booking: <strong className="text-gray-800">₹{coupon.minAmount || 0}</strong>
                          </p>

                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                            <button 
                              onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                              className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${coupon.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                            >
                              {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                            </button>
                          </div>
                        </div>
                      ))}
                      {coupons.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                          <FiTag className="mx-auto text-4xl mb-3 opacity-20" />
                          <p>No coupons created yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FINANCES TAB */}
              {activeTab === "finances" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Summary Cards */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 font-serif">Revenue & Finances Dashboard</h3>
                      <button 
                        onClick={() => {
                          if (confirm("Are you sure you want to reset revenue? This will add a negative transaction to zero out the total.")) {
                            handleAddRevenueTransaction('reset', -totalRevenue, 'Revenue Reset');
                          }
                        }}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-colors font-bold border border-red-200"
                      >
                        Reset Net Collections
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Contract Value</p>
                        <p className="text-2xl font-black text-gray-700">₹{bookingRevenue}</p>
                      </div>
                      <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 text-center">
                        <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">Razorpay Online</p>
                        <p className="text-2xl font-black text-blue-700">₹{razorpayRevenue}</p>
                      </div>
                      <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 text-center">
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Cash Due On-Site</p>
                        <p className="text-2xl font-black text-amber-700">₹{totalBalanceDue}</p>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Adjustments</p>
                        <p className="text-2xl font-black text-gray-700">₹{manualRevenue}</p>
                      </div>
                      <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center shadow-sm">
                        <p className="text-green-600 text-[10px] font-bold uppercase tracking-widest mb-1">Net Collections</p>
                        <p className="text-2xl font-black text-green-700">₹{totalRevenue}</p>
                      </div>
                    </div>

                    {/* Razorpay Online Payments Listing */}
                    <div className="mb-10">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          💳 Razorpay Payments Ledger ({bookings.filter(b => b.paymentId && b.paymentId !== 'free_booking').length} bookings)
                        </h4>
                        <button 
                          onClick={handleDownloadRazorpayPayments}
                          className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          <FiUploadCloud /> Download Payments CSV
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                            <tr>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Date</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Booking Ref</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Customer Details</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Service Booked</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Price</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Paid Online</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Cash Due</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Payment ID</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {bookings.filter(b => b.paymentId && b.paymentId !== 'free_booking').map(b => (
                              <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                  {b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}<br/>
                                  <span className="text-[10px] text-gray-400">
                                    {b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-bold text-xs text-pink-700">{b.bookingRef || "N/A"}</td>
                                <td className="p-4">
                                  <p className="font-bold text-gray-800 text-xs">{b.customerName || "N/A"}</p>
                                  <p className="text-[10px] text-gray-500">{b.phone || "N/A"}</p>
                                </td>
                                <td className="p-4 text-xs font-medium text-gray-700 max-w-[150px] truncate" title={b.serviceTitle}>
                                  {b.serviceTitle || "N/A"}
                                </td>
                                <td className="p-4 text-right font-medium text-gray-700 text-xs">₹{b.price || 0}</td>
                                <td className="p-4 text-right font-bold text-blue-600 text-xs">₹{b.amountPaidOnline || 0}</td>
                                <td className="p-4 text-right font-medium text-amber-600 text-xs">₹{b.balanceDue || 0}</td>
                                <td className="p-4 text-xs font-mono text-gray-400">{b.paymentId || "N/A"}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                                    b.paymentStatus === 'paid' 
                                      ? 'bg-green-50 text-green-600 border border-green-200' 
                                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                                  }`}>
                                    {b.paymentStatus || 'advance_paid'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {bookings.filter(b => b.paymentId && b.paymentId !== 'free_booking').length === 0 && (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-400 text-xs">No Razorpay online payments found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Manual Adjustments Section */}
                    <div className="bg-pink-50/30 p-6 rounded-3xl border border-pink-100 mb-8">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">✍️ Add Manual Revenue Adjustment</h4>
                      <div className="flex flex-col md:flex-row gap-4">
                        <input 
                          type="number" 
                          value={newTransactionAmount}
                          onChange={(e) => setNewTransactionAmount(e.target.value)}
                          placeholder="Amount (e.g. 500 or -500)"
                          className="flex-1 p-3 border border-white bg-white rounded-2xl focus:ring-[var(--color-primary)] outline-none shadow-sm text-sm"
                        />
                        <input 
                          type="text" 
                          value={newTransactionReason}
                          onChange={(e) => setNewTransactionReason(e.target.value)}
                          placeholder="Reason (e.g. Cash On-Site Payment, Discount Adjustment)"
                          className="flex-[2] p-3 border border-white bg-white rounded-2xl focus:ring-[var(--color-primary)] outline-none shadow-sm text-sm"
                        />
                        <button 
                          onClick={() => {
                            if (!newTransactionAmount || !newTransactionReason) return alert("Please fill both amount and reason");
                            handleAddRevenueTransaction('manual_adjustment', Number(newTransactionAmount), newTransactionReason);
                          }}
                          className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[var(--color-header)] transition-all shadow-md text-xs"
                        >
                          Add Adjustment
                        </button>
                      </div>
                    </div>

                    {/* Manual Transaction History table */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800">📊 Manual Adjustments Log</h4>
                        <button 
                          onClick={handleDownloadTransactions}
                          className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          <FiUploadCloud /> Download Adjustments CSV
                        </button>
                      </div>
                      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Date</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Type</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Amount</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Reason</th>
                              <th className="p-4 font-bold text-xs uppercase tracking-wider">Added By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {revenueTransactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-xs text-gray-500">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : "Just now"}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${tx.type === 'reset' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                                    {tx.type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className={`p-4 font-bold text-xs ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                                </td>
                                <td className="p-4 text-gray-700 text-xs font-medium">{tx.reason}</td>
                                <td className="p-4 text-xs text-gray-500">{tx.addedBy}</td>
                              </tr>
                            ))}
                            {revenueTransactions.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 text-xs">No manual adjustments yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {deleteModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(null)}></div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiX size={32}/>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete This Item?</h3>
              <p className="text-gray-500 text-sm mb-8">Kya aap sach mein ise delete karna chahte hain? Ye action wapas nahi liya ja sakega.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteItem}
                  className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Global Edit Modal */}
        {editModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)}></div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 capitalize">Edit {editModal.type}</h3>
                <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600"><FiX size={24}/></button>
              </div>
              
              <form onSubmit={saveEdit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                
                {/* ZONE EDIT */}
                {editModal.type === "zone" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Zone Name</label>
                    <input type="text" value={editModal.data.name || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, name: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                  </div>
                )}

                {/* GALLERY EDIT */}
                {editModal.type === "gallery" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select value={editModal.data.category || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, category: e.target.value } })} className="w-full p-3 border rounded-xl">
                      <option>Bridal</option>
                      <option>Arabic</option>
                      <option>Fusion</option>
                      <option>Mandala</option>
                      <option>Geometric</option>
                      <option>Minimalist</option>
                      <option>Guest</option>
                      <option>Modern</option>
                    </select>
                  </div>
                )}

                {/* PARTNER EDIT */}
                {editModal.type === "partner" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                      <input type="text" value={editModal.data.name || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, name: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Area</label>
                      <input type="text" value={editModal.data.area || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, area: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                      <input type="text" value={editModal.data.phone || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, phone: e.target.value } })} className="w-full p-3 border rounded-xl" />
                    </div>
                  </>
                )}

                {/* BOOKING EDIT */}
                {editModal.type === "booking" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name</label>
                      <input type="text" value={editModal.data.customerName || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, customerName: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Phone</label>
                      <input type="text" value={editModal.data.phone || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, phone: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Complete Address</label>
                      <textarea value={editModal.data.address || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, address: e.target.value } })} className="w-full p-3 border rounded-xl" rows={2} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                        <input type="text" value={editModal.data.bookingDateString || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, bookingDateString: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Time Slot</label>
                        <input type="text" value={editModal.data.timeSlot || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, timeSlot: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                        <input type="number" value={editModal.data.price || 0} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, price: Number(e.target.value) } })} className="w-full p-3 border rounded-xl" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Booking Status</label>
                        <select value={editModal.data.status || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, status: e.target.value } })} className="w-full p-3 border rounded-xl bg-white font-semibold">
                          <option value="pending">PENDING</option>
                          <option value="assigned">ASSIGNED</option>
                          <option value="dispatched">DISPATCHED</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Additional Notes</label>
                      <textarea value={editModal.data.additionalNotes || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, additionalNotes: e.target.value } })} className="w-full p-3 border rounded-xl" rows={2} />
                    </div>
                  </>
                )}

                {/* SERVICE EDIT */}
                {editModal.type === "service" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Service Title</label>
                      <input type="text" value={editModal.data.title || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, title: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <select value={editModal.data.category || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, category: e.target.value } })} className="w-full p-3 border rounded-xl bg-white font-semibold">
                          <option value="Bridal">Bridal</option>
                          <option value="Arabic">Arabic</option>
                          <option value="Fusion">Fusion</option>
                          <option value="Mandala">Mandala</option>
                          <option value="Geometric">Geometric</option>
                          <option value="Minimalist">Minimalist</option>
                          <option value="Guest">Guest</option>
                          <option value="Modern">Modern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                        <input type="number" value={editModal.data.price || 0} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, price: Number(e.target.value) } })} className="w-full p-3 border rounded-xl" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                        <input type="text" value={editModal.data.duration || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, duration: e.target.value } })} className="w-full p-3 border rounded-xl" placeholder="e.g. 5 hours, 45 mins" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                        <select value={editModal.data.isActive ? "active" : "inactive"} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, isActive: e.target.value === "active" } })} className="w-full p-3 border rounded-xl bg-white font-semibold">
                          <option value="active">Active (Visible)</option>
                          <option value="inactive">Inactive (Hidden)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea value={editModal.data.description || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, description: e.target.value } })} className="w-full p-3 border rounded-xl" rows={3} required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Image URL (Optional)</label>
                      <input type="text" value={editModal.data.image || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, image: e.target.value } })} className="w-full p-3 border rounded-xl text-xs" />
                      <div className="mt-2 flex items-center space-x-2">
                        <input type="file" onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onloadend = async () => {
                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ image: reader.result }),
                              });
                              if (!res.ok) throw new Error("Upload failed");
                              const uploadRes = await res.json();
                              setEditModal({ ...editModal, data: { ...editModal.data, image: uploadRes.url } });
                            } catch (err: any) {
                              alert("Upload failed: " + err.message);
                            }
                          };
                        }} className="text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer select-none mt-2">
                        <input 
                          type="checkbox" 
                          checked={editModal.data.isTrending || false} 
                          onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, isTrending: e.target.checked } })} 
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" 
                        />
                        <span className="text-sm font-bold text-gray-700">🔥 Mark as Trending Service</span>
                      </label>
                    </div>
                  </>
                )}

                {/* PACKAGE EDIT */}
                {editModal.type === "package" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
                      <input type="text" value={editModal.data.name || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, name: e.target.value } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                      <input type="number" value={editModal.data.price || 0} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, price: Number(e.target.value) } })} className="w-full p-3 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea value={editModal.data.description || ""} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, description: e.target.value } })} className="w-full p-3 border rounded-xl" rows={3} required />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-700">Features (Key Points)</label>
                        <button type="button" onClick={() => {
                          const newFeatures = editModal.data.features ? [...editModal.data.features] : [];
                          newFeatures.push("");
                          setEditModal({ ...editModal, data: { ...editModal.data, features: newFeatures } });
                        }} className="text-xs bg-amber-500 text-white px-2 py-1 rounded font-bold">+ Add</button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(editModal.data.features || []).map((feat: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              type="text" 
                              value={feat} 
                              onChange={(e) => {
                                const newFeatures = [...editModal.data.features];
                                newFeatures[idx] = e.target.value;
                                setEditModal({ ...editModal, data: { ...editModal.data, features: newFeatures } });
                              }} 
                              className="flex-1 p-2 border rounded-lg text-sm" 
                            />
                            <button type="button" onClick={() => {
                              const newFeatures = editModal.data.features.filter((_: string, i: number) => i !== idx);
                              setEditModal({ ...editModal, data: { ...editModal.data, features: newFeatures } });
                            }} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={editModal.data.isTrending || false} 
                          onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, isTrending: e.target.checked } })} 
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer" 
                        />
                        <span className="text-sm font-bold text-gray-700">🔥 Mark as Trending Package</span>
                      </label>
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-3 px-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-header)] shadow-lg shadow-pink-100">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
