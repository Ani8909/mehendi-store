import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";

const MOCK_SERVICES = [
  { title: "Traditional Bridal Mehndi", description: "Intricate full-hand and foot art with Marwari/Rajasthani motifs like peacocks and lotuses.", price: 5000, duration: "5 hours", image: "/images/services/bridal.png", category: "Bridal", isActive: true },
  { title: "Arabic Floral Mehndi", description: "Bold, flowing patterns with elegant floral and vine motifs. Modern and stylish.", price: 1500, duration: "2 hours", image: "/images/services/arabic.png", category: "Arabic", isActive: true },
  { title: "Indo-Arabic Fusion", description: "A beautiful blend of traditional Indian intricacy and bold Arabic outlines.", price: 2500, duration: "3 hours", image: "/images/services/fusion.png", category: "Fusion", isActive: true },
  { title: "Portrait & Figure Mehndi", description: "Custom hand-sketched portraits of the bride and groom (Dulha-Dulhan) for a personalized touch.", price: 8000, duration: "6 hours", image: "/images/services/portrait.png", category: "Premium", isActive: true },
  { title: "Mandala Art Mehndi", description: "Symmetric and spiritual circular patterns focused on the center of the palm.", price: 1200, duration: "1.5 hours", image: "/images/services/mandala.png", category: "Modern", isActive: true },
  { title: "Bombay Style Mehndi", description: "Trendy and contemporary patterns popular in urban India, perfect for any occasion.", price: 2000, duration: "2.5 hours", image: "/images/services/bombay.png", category: "Urban", isActive: true },
  { title: "Moroccan Geometric", description: "Clean, linear, and geometric patterns inspired by Moroccan henna traditions.", price: 1800, duration: "2 hours", image: "/images/services/moroccan.png", category: "Geometric", isActive: true },
  { title: "Leg & Foot Bridal", description: "Intricate bridal patterns extending from the feet to the legs for a complete look.", price: 3000, duration: "3 hours", image: "/images/services/leg.png", category: "Bridal", isActive: true },
  { title: "Jewelry Style Mehndi", description: "Delicate designs that mimic bracelets, rings, and hand chains (Hathphool).", price: 1000, duration: "1 hour", image: "/images/services/jewelry.png", category: "Minimalist", isActive: true },
  { title: "Minimalist Guest Mehndi", description: "Quick and elegant designs for wedding guests and small functions.", price: 500, duration: "30 mins", image: "/images/services/minimalist.png", category: "Guest", isActive: true },
];

const MOCK_PARTNERS = [
  { name: "Aarti Sharma", phone: "9876543210", area: "South Delhi", rating: 4.9, totalBookings: 150, isAvailable: true, earnings: 75000 },
  { name: "Kavita Verma", phone: "9876543211", area: "West Delhi", rating: 4.7, totalBookings: 85, isAvailable: true, earnings: 42000 },
  { name: "Riya Kapoor", phone: "9876543212", area: "Gurugram", rating: 4.8, totalBookings: 210, isAvailable: true, earnings: 105000 },
];

const MOCK_HERO_SLIDES = [
  { image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355099/hero_slides/sjpfw91fxfwoggnnorlx.jpg", title: "Royal Bridal Mehndi Artistry", subtitle: "Agra's premier 'mehndi wali' boutique. Handcrafting pristine, chemical-free organic henna and intricate heritage patterns since 2014." },
  { image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355101/hero_slides/kl1qf6eo81oeazosxamq.jpg", title: "Sophisticated Arabic & Floral Couture", subtitle: "Bold, flowing outlines blended with delicate contemporary textures. Tailored mehndi services for the modern bride and absolute perfection." },
  { image: "https://res.cloudinary.com/dtjnwzei7/image/upload/v1778355102/hero_slides/di1flpverp0dru1ndhmh.jpg", title: "Intricate Indo-Arabic Fusion", subtitle: "Timeless Mughal symmetry meets modern aesthetics. Handcrafted with premium organic stain to radiate trust and royal elegance on your auspicious day." },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Use POST" });
  if (req.headers.authorization !== "Bearer jyoti-secret-seed") return res.status(401).json({ message: "Unauthorized" });

  try {
    const batch = writeBatch(db);

    // Seed Hero Slides
    MOCK_HERO_SLIDES.forEach(slide => {
      const ref = doc(collection(db, "hero_slides"));
      batch.set(ref, { ...slide, id: ref.id });
    });

    // 1. Seed Services (Cleanup first)
    const servicesSnapshot = await getDocs(collection(db, "services"));
    servicesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    MOCK_SERVICES.forEach(s => {
      const ref = doc(collection(db, "services"));
      batch.set(ref, { ...s, id: ref.id });
    });

    // 2. Seed Partners
    const partnerIds: string[] = [];
    MOCK_PARTNERS.forEach(p => {
      const ref = doc(collection(db, "partners"));
      partnerIds.push(ref.id);
      batch.set(ref, { ...p, id: ref.id, joinedAt: serverTimestamp() });
    });

    // 3. Seed Mock Bookings for Pipeline Demo
    const bookingStatuses = ["pending", "assigned", "completed", "cancelled"];
    const customerNames = ["Anjali Singh", "Priya Mehra", "Sonal Gupta"];

    customerNames.forEach((name, i) => {
      const ref = doc(collection(db, "bookings"));
      batch.set(ref, {
        id: ref.id,
        customerId: `mock_user_${i}`,
        customerName: name,
        phone: `999990000${i}`,
        address: `House No ${i+12}, Street 4, ${i % 2 === 0 ? "New Delhi" : "Noida"}`,
        serviceId: "mock_service_id",
        serviceTitle: i % 2 === 0 ? "Bridal Mehndi" : "Arabic Floral",
        price: i % 2 === 0 ? 5000 : 1500,
        bookingDateString: "2026-05-15",
        timeSlot: "11:00 AM - 01:00 PM",
        status: bookingStatuses[i % 4],
        paymentStatus: i === 2 ? "paid" : "pending",
        partnerId: i === 1 ? partnerIds[0] : null,
        createdAt: serverTimestamp(),
      });
    });

    // 4. Seed Gallery (Cleanup first)
    const gallerySnapshot = await getDocs(collection(db, "designs_gallery"));
    gallerySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    const galleryItems = [
      { imageURL: "/images/gallery/bridal_1.png", category: "Bridal" },
      { imageURL: "/images/gallery/bridal_2.png", category: "Bridal" },
      { imageURL: "/images/gallery/bridal_3.png", category: "Bridal" },
      { imageURL: "/images/services/portrait.png", category: "Bridal" },
      { imageURL: "/images/gallery/arabic_1.png", category: "Arabic" },
      { imageURL: "/images/gallery/arabic_2.png", category: "Arabic" },
      { imageURL: "/images/services/fusion.png", category: "Arabic" },
      { imageURL: "/images/gallery/feet_1.png", category: "Feet" },
      { imageURL: "/images/gallery/feet_2.png", category: "Feet" },
      { imageURL: "/images/services/leg.png", category: "Feet" },
      { imageURL: "/images/services/mandala.png", category: "Party" },
      { imageURL: "/images/services/jewelry.png", category: "Party" },
      { imageURL: "/images/services/minimalist.png", category: "Party" },
    ];
    galleryItems.forEach(item => {
      const ref = doc(collection(db, "designs_gallery"));
      batch.set(ref, { ...item, id: ref.id, uploadedAt: serverTimestamp() });
    });

    await batch.commit();
    return res.status(200).json({ message: "Pipeline Seeded Successfully!" });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
