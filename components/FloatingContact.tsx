import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaPhone, FaInstagram, FaFacebookF, FaPinterest, FaYoutube } from "react-icons/fa";
import { FiMessageCircle, FiX, FiSend, FiMic, FiVolume2, FiShoppingBag } from "react-icons/fi";
import { useAuth } from "@/lib/authContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, query, where } from "firebase/firestore";

interface Message {
  sender: "bot" | "user";
  text: string;
  isQuizResult?: boolean;
  type?: string;
}

interface BookingData {
  serviceId: string;
  serviceTitle: string;
  price: number;
  originalPrice: number;
  bookingDateString: string;
  timeSlot: string;
  customerName: string;
  phone: string;
}


const sanitizeInput = (text: string): string => {
  return text.replace(/<[^>]*>/g, "").trim();
};

const PHONE_NUMBER = "7906297942";

// Levenshtein distance for fuzzy/spelling matching
function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

const DICTIONARY: Record<string, string[]> = {
  price: ["price", "prais", "prce", "priec", "pric", "rate", "cost", "daam", "rupay", "money", "pais", "paisa", "charges", "charging", "fees", "fee", "kitna", "kimat", "keemat", "charge"],
  package: ["package", "pack", "pakage", "peckage", "packg", "pakeg", "packges", "packages", "pekage"],
  stain: ["stain", "stane", "dark", "colour", "color", "rang", "stani", "darkness", "laung", "clove", "oil", "steam", "aftercare", "care", "kaala", "rachna", "rachni"],
  visit: ["visit", "home", "location", "area", "travel", "charge", "agra", "visit", "charge", "adrs", "address", "shop", "studio", "ghar", "aana"],
  book: ["book", "appointment", "reserve", "slot", "date", "timing", "time", "avail", "booking", "tarikh"],
  contact: ["contact", "phone", "number", "instagram", "insta", "social", "whatsapp", "call", "yutub", "youtube", "socials", "no", "nambar", "numb"],
  design: ["design", "photo", "pic", "image", "work", "pattern", "gleri", "gallery", "designs"],
  offer: ["offer", "discount", "coupon", "deal", "discounts", "coupons", "sale", "off", "welcom50", "welcome50", "ofer", "discont"],
  review: ["review", "rating", "feedback", "testimonial", "reviews", "ratings", "feedbacks", "star", "stars", "reviw"],
  gift: ["gift", "voucher", "card", "vouchers", "cards", "giftcard", "giftcards", "gif"]
};

function correctSpelling(input: string): string {
  const words = input.toLowerCase().split(/\s+/);
  const correctedWords = words.map(word => {
    for (const [key, variants] of Object.entries(DICTIONARY)) {
      for (const variant of variants) {
        if (word === variant || (word.length >= 4 && getLevenshteinDistance(word, variant) <= (word.length >= 7 ? 2 : 1))) {
          return key;
        }
      }
    }
    return word;
  });
  return correctedWords.join(" ");
}

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFloating, setShowFloating] = useState(true);
  
  const { user, userData } = useAuth();
  const [learnedFaqs, setLearnedFaqs] = useState<any[]>([]);
  const [liveServices, setLiveServices] = useState<any[]>([]);
  const [livePackages, setLivePackages] = useState<any[]>([]);
  const [liveBlogs, setLiveBlogs] = useState<any[]>([]);
  const [liveCoupons, setLiveCoupons] = useState<any[]>([]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Namaste! Welcome to Jyoti Mehendi. 🙏 How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [quizStep, setQuizStep] = useState(0); // 0 = idle, 1 = hours, 2 = oil, 3 = hand part
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState(0); // 0 = idle, 1 = service, 2 = date, 3 = slot, 4 = name, 5 = phone, 6 = confirm
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: "",
    serviceTitle: "",
    price: 0,
    originalPrice: 0,
    bookingDateString: "",
    timeSlot: "",
    customerName: "",
    phone: ""
  });

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [orderStep, setOrderStep] = useState(0); // 0 = idle, 1 = product selection, 2 = address, 3 = payment
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState("");

  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [isLiveChatMode, setIsLiveChatMode] = useState(false);
  const [liveChatVerifyingStep, setLiveChatVerifyingStep] = useState(0); // 0 = idle, 1 = verification input, 2 = verified
  const [welcomeText, setWelcomeText] = useState("Namaste! Welcome to Jyoti Mehendi. 🙏 How can I help you today?");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let sessId = localStorage.getItem("jyoti_chat_session_id");
      if (!sessId) {
        sessId = "sess_" + Math.random().toString(36).substring(2, 9).toUpperCase();
        localStorage.setItem("jyoti_chat_session_id", sessId);
      }
      setChatSessionId(sessId);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-IN";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTextInput(transcript);
          submitVoiceQuery(transcript);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load learned FAQs, live services, and event packages dynamically from Firestore
  useEffect(() => {
    if (db) {
      const fetchData = async () => {
        try {
          // 1. Fetch FAQs
          const faqSnapshot = await getDocs(collection(db, "learned_faqs"));
          const faqs: any[] = [];
          faqSnapshot.forEach((doc) => {
            faqs.push({ id: doc.id, ...doc.data() });
          });
          setLearnedFaqs(faqs);

          // 2. Fetch Services
          const servicesSnapshot = await getDocs(collection(db, "services"));
          const services: any[] = [];
          servicesSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isActive !== false) {
              services.push({ id: doc.id, ...data });
            }
          });
          setLiveServices(services);

          // 3. Fetch Packages
          const packagesSnapshot = await getDocs(collection(db, "event_packages"));
          const packages: any[] = [];
          packagesSnapshot.forEach((doc) => {
            packages.push({ id: doc.id, ...doc.data() });
          });
          setLivePackages(packages);

          // 4. Fetch Blogs
          const blogsSnapshot = await getDocs(collection(db, "blogs"));
          const blogs: any[] = [];
          blogsSnapshot.forEach((doc) => {
            blogs.push({ id: doc.id, ...doc.data() });
          });
          setLiveBlogs(blogs);

          // 5. Fetch Coupons
          const couponsSnapshot = await getDocs(collection(db, "coupons"));
          const coupons: any[] = [];
          couponsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isActive !== false) {
              coupons.push({ id: doc.id, ...data });
            }
          });
          setLiveCoupons(coupons);
        } catch (err) {
          console.error("Failed to load live data for AI assistant (offline?):", err);
        }
      };
      fetchData();
    }
  }, []);

  // Real-time live support messages listener
  useEffect(() => {
    let unsubscribe: any;
    if (db && chatSessionId && isLiveChatMode) {
      unsubscribe = onSnapshot(doc(db, "live_chats", chatSessionId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === "closed") {
            setIsLiveChatMode(false);
            setMessages(prev => [
              ...prev,
              { sender: "bot", text: "📞 *Live support session closed by owner.* I am back in auto-assistant mode. Ask me anything!" }
            ]);
            return;
          }
          if (data.messages && data.messages.length > 0) {
            const dbMsgs = data.messages.map((m: any) => ({
              sender: m.sender === "owner" ? "bot" : "user",
              text: m.text,
              type: m.type || null
            }));
            setMessages(dbMsgs);
          }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatSessionId, isLiveChatMode]);

  // Load dynamic settings greeting
  useEffect(() => {
    if (db) {
      const unsub = onSnapshot(doc(db, "bot_settings", "greeting"), (docSnap) => {
        if (docSnap.exists()) {
          const text = docSnap.data().welcomeText;
          if (text) {
            setWelcomeText(text);
            setMessages(prev => {
              if (prev.length === 1 && prev[0].sender === "bot") {
                return [{ sender: "bot", text }];
              }
              return prev;
            });
          }
        }
      }, (err) => {
        console.error("Dynamic welcome greeting loading error:", err);
      });
      return unsub;
    }
  }, []);

  // Offline Auto-Responder (System Notice if owner is away for > 60 seconds)
  useEffect(() => {
    let timer: any;
    if (isLiveChatMode && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "user") {
        timer = setTimeout(() => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.sender === "user") {
              return [
                ...prev,
                { sender: "bot", text: `⏱️ **Owner Away Notice**:\n\nJyoti is currently details-focused on applying a beautiful bridal mehendi! 🌸 She will reply very shortly inside this screen.\n\nYou can also contact her directly at **+91 ${PHONE_NUMBER}**.` }
              ];
            }
            return prev;
          });
        }, 60000);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLiveChatMode, messages]);

  const startLiveChatSession = async () => {
    setIsTyping(true);
    try {
      const initialUserMsg = "Customer initiated live chat session support channel.";
      const initialMsgs = [
        { sender: "user", text: initialUserMsg, timestamp: new Date() }
      ];

      await setDoc(doc(db, "live_chats", chatSessionId), {
        sessionId: chatSessionId,
        customerName: userData?.name || user?.email || "Guest Client",
        phone: userData?.phone || "",
        status: "pending",
        messages: initialMsgs,
        updatedAt: new Date()
      });

      setIsLiveChatMode(true);
      setIsTyping(false);
      setMessages([
        { sender: "bot", text: "📞 **Connecting you to Jyoti (Owner)...**\n\nI have requested a live connection. Please type your message here, she will reply directly inside this screen!" }
      ]);
    } catch (err: any) {
      setIsTyping(false);
      console.error("Error starting live chat session:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `❌ Failed to connect: ${err.message}. Please click again.` }
      ]);
    }
  };

  const initiateLiveSupportRequest = () => {
    const cachedVerified = typeof window !== "undefined" ? localStorage.getItem("jyoti_booking_verified") : null;
    if (cachedVerified === "true" || user?.email) {
      startLiveChatSession();
    } else {
      setLiveChatVerifyingStep(1);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "🔒 **Live Support Verification**: Live chat with the owner is exclusive to clients with active bookings.\n\nPlease type your **Registered Phone Number** or **Booking ID** to verify your booking:" }
      ]);
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (router.pathname === "/") {
        if (window.scrollY > window.innerHeight * 0.7) {
          setShowFloating(true);
        } else {
          setShowFloating(false);
          setIsOpen(false);
        }
      } else {
        setShowFloating(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [router.pathname]);

  // Minimize chatbot window when route changes to allow users to see the new page
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const phone = "7906297942";
  const whatsappMessage = encodeURIComponent("Hi Jyoti Mehendi! I would like to book a mehendi session.");

  const socialLinks = [
    { name: "Instagram", icon: <FaInstagram size={16} />, href: "https://www.instagram.com/mehndi_artist__jyoti?igsh=M200NHNncnZjOWQz", color: "text-pink-600 hover:text-pink-800" },
    { name: "Facebook", icon: <FaFacebookF size={14} />, href: "https://www.facebook.com/share/1AwpsjFKnh/", color: "text-blue-600 hover:text-blue-800" },
    { name: "Pinterest", icon: <FaPinterest size={16} />, href: "https://pin.it/2ZoiasFlN", color: "text-red-600 hover:text-red-800" },
    { name: "YouTube", icon: <FaYoutube size={16} />, href: "https://youtube.com/@jyotimehndiartist-m9g?si=a_nUhTHsi0zv-4nX", color: "text-red-500 hover:text-red-700" }
  ];

  if (!mounted || !showFloating) return null;

  // Check if current user is admin
  const isAdmin = user && (user.email === "anuj@jyotimhendi.in" || user.email === "singhani5549@gmail.com" || userData?.role === "admin");

  // Advanced natural language bot response generator
  const generateBotResponse = async (corrected: string, raw: string): Promise<string> => {
    const rawLower = raw.toLowerCase().trim();
    const isAction = 
      rawLower.includes("go") || 
      rawLower.includes("open") || 
      rawLower.includes("show") || 
      rawLower.includes("redirect") || 
      rawLower.includes("navigate") || 
      rawLower.includes("call") || 
      rawLower.includes("dial") || 
      rawLower.includes("book") || 
      rawLower.includes("whatsapp") ||
      raw === "Bridal Packages" ||
      raw === "Agra Visit Details" ||
      raw === "Calculate Stain Darkness" ||
      raw === "Active Offers & Coupons" ||
      raw === "Latest Designs Gallery" ||
      raw === "Customer Reviews & Ratings" ||
      raw === "Gift Vouchers Details" ||
      raw === "Social Networks";

    // 1. Live Admin Training mode
    if ((rawLower.startsWith("/train") || rawLower.startsWith("/teach")) && isAdmin) {
      const match = raw.match(/^\/(?:train|teach)\s+(.+?)\s*->\s*(.+)$/i);
      if (match) {
        const keywords = match[1].trim().toLowerCase();
        const answer = match[2].trim();
        try {
          await addDoc(collection(db, "learned_faqs"), {
            keywords: keywords,
            answer: answer,
            trainedBy: user.email,
            createdAt: new Date()
          });
          setLearnedFaqs(prev => [...prev, { keywords: keywords, answer: answer }]);
          return `🤖 Training Successful!\nI learned a new response for keywords: *"${keywords}"*.\n\nFrom now on, I will answer matching questions with:\n*"${answer}"*`;
        } catch (err: any) {
          return `❌ Training failed: ${err.message}`;
        }
      } else {
        return `💡 How to train me:\nUse this format:\n\`/train key1,key2 -> Your custom answer here\`\n\nExample:\n\`/train discount,offer -> We offer a 10% discount on group bookings!\``;
      }
    }

    // 2. Check dynamically learned FAQs from Firestore first
    for (const faq of learnedFaqs) {
      const faqKeywords = Array.isArray(faq.keywords) 
        ? faq.keywords 
        : (typeof faq.keywords === "string" ? faq.keywords.split(",") : []);
      
      for (const kw of faqKeywords) {
        const cleanKw = kw.trim().toLowerCase();
        if (corrected.includes(cleanKw) || rawLower.includes(cleanKw)) {
          return faq.answer;
        }
      }
    }

    // 3. Check for specific matching live service from database
    for (const s of liveServices) {
      const titleLower = s.title.toLowerCase();
      if (corrected.includes(titleLower) || rawLower.includes(titleLower)) {
        return `🌸 **${s.title}** (${s.category} Service):\n\n• **Price:** ₹${s.price}\n• **Duration:** ${s.duration}\n• **Description:** ${s.description}\n\nType *'book now'* if you'd like to book this service!`;
      }
    }

    // 4. Check for specific matching live event package from database
    for (const p of livePackages) {
      const nameLower = p.name.toLowerCase();
      if (corrected.includes(nameLower) || rawLower.includes(nameLower)) {
        const featuresStr = p.features && p.features.length > 0
          ? p.features.map((f: string) => `  - ${f}`).join("\n")
          : "";
        return `🎁 **Package: ${p.name}**\n\n• **Price:** ₹${p.price}\n• **Description:** ${p.description}\n${featuresStr ? `• **Includes:**\n${featuresStr}` : ""}\n\nType *'go to booking'* to reserve this package!`;
      }
    }

    // 5. Unique benefits USP triggers
    const JYOTI_USP = `✨ **Why Jyoti Mehendi is Unique (Our Benefits):**\n\n🌿 **100% Organic Henna:** Hand-mixed organic henna paste with zero chemicals, ensuring a safe, deep royal mahogany stain.\n🎨 **Intricate Custom Portraits:** Specialization in custom portrait figures (drawing the couple's face, wedding stories, or icons inside the palms).\n🚗 **Free Home Visit:** Complete comfort with free home visits across Agra.\n⭐ **Flawless Symmetry & Speed:** Clean borders, detailed traditional motifs, and fast application.`;
    
    if (corrected.includes("jyoti") || corrected.includes("unique") || corrected.includes("benefit") || corrected.includes("why") || corrected.includes("diff") || corrected.includes("special") || corrected.includes("best") || corrected.includes("king")) {
      return `${JYOTI_USP}`;
    }

    // 6. Check for specific matching live blog from database
    const queryWords = corrected.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length > 0) {
      for (const b of liveBlogs) {
        const titleLower = b.title.toLowerCase();
        const contentLower = (b.content || "").toLowerCase();
        const matchesTitle = queryWords.some(w => titleLower.includes(w));
        const matchesContent = queryWords.some(w => contentLower.includes(w));
        
        if (matchesTitle || matchesContent) {
          setTimeout(() => { router.push(`/blog/${b.slug}`); }, 2000);
          return `📝 **Recommended Blog Post:**\n\nI found an interesting article on our blog that answers your question: **"${b.title}"**.\n\n*Redirecting you to our Blog post page in 2 seconds to read the full details...*`;
        }
      }
    }

    // 7. Predefined NLP Intents with Smart Actions
    if (corrected.includes("price") || corrected.includes("service") || corrected.includes("menu")) {
      if (isAction) {
        setTimeout(() => { router.push("/packages"); }, 1500);
        return "Sure! Redirecting you to our Event Packages page to view all tiers and pricing... 🌸";
      }
      if (liveServices.length > 0) {
        const serviceListStr = liveServices.map(s => `• **${s.title}**: ₹${s.price} (${s.duration})`).join("\n");
        return `🌸 **Jyoti Mehendi Services & Pricing:**\n\n${serviceListStr}\n\nType the name of any service for details, or *'go to booking'* to make an appointment!`;
      }
      return "🌸 **Jyoti Mehendi Packages & Pricing:**\n\n• **Premium Bridal:** Starts from ₹3,100\n• **Standard Bridal:** Starts from ₹2,100\n• **Guest/Sagai:** Starts from ₹250/hand\n• **Arabic/Modern:** Starts from ₹350/hand\n\nType *'go to packages'* to view packages or *'go to booking'* to reserve a slot!";
    }

    if (corrected.includes("package") || corrected.includes("deal")) {
      if (isAction) {
        setTimeout(() => { router.push("/packages"); }, 1500);
        return "Sure! Redirecting you to our Event Packages page to view all tiers and pricing... 🌸";
      }
      if (livePackages.length > 0) {
        const packageListStr = livePackages.map(p => `• **${p.name}**: ₹${p.price} (${p.description})`).join("\n");
        return `🎁 **Jyoti Mehendi Event Packages:**\n\n${packageListStr}\n\nType the name of any package for full details, or *'go to booking'* to make an appointment!`;
      }
      return "🌸 **Jyoti Mehendi Packages:**\n\n• Premium Bridal, Standard Bridal, and Sagai deals are available.\n\nType *'go to packages'* to view more!";
    }
    
    if (corrected.includes("visit") || corrected.includes("location") || corrected.includes("agra")) {
      return "🚗 **Home Visit & Location Details:**\n\nWe provide doorstep mehndi services across Agra!\n• **Within Central Agra:** Home visits are **completely free** (e.g. Shastripuram, Sikandra, Taj Ganj, Kamla Nagar).\n• **Outer Agra limits:** A small travel charge may apply depending on distance.\n\n📍 **Studio Location:** 5 Pathwari Mandir, Behind Delhi Public School, Shastripuram, Sikandra, Agra.";
    }

    if (corrected.includes("stain") || corrected.includes("dark") || corrected.includes("aftercare")) {
      return "💡 **Secrets for a Dark Mahogany Stain:**\n\n1. **Duration:** Keep the henna paste on for 6 to 8 hours (overnight is highly recommended!).\n2. **Clove Steam:** Dry steam your hands over clove (laung) fumes for 2 minutes while the paste is dry.\n3. **Oil Wipe:** Scrape off the paste using butter knife/spoon. Rub mustard or coconut oil on it. **Do NOT wash with water or soap for 24 hours!**";
    }

    if (corrected.includes("book") || corrected.includes("appointment") || corrected.includes("slot")) {
      if (isAction || rawLower.includes("book")) {
        setTimeout(() => { router.push("/booking"); }, 1500);
        return "Sure! Redirecting you to our Instant Booking page... 📅 Select your packages and pick a slot there!";
      }
      return "📅 **Booking your Appointment:**\n\nYou can book slots instantly on our website by clicking the **Click to Instant Book Slot** button at the bottom of this chat, or by visiting `/booking`.\n\nType *'go to booking'* and I will redirect you there instantly!";
    }

    if (corrected.includes("contact") || corrected.includes("whatsapp") || corrected.includes("social") || corrected.includes("instagram")) {
      if (rawLower.includes("call") || rawLower.includes("dial") || rawLower.includes("phone")) {
        setTimeout(() => { window.location.href = `tel:+91${phone}`; }, 1500);
        return "Calling Jyoti Mehendi... 📞 Connecting you directly to our phone dialer app.";
      }
      if (rawLower.includes("instagram") || rawLower.includes("insta")) {
        setTimeout(() => { window.open("https://www.instagram.com/mehndi_artist__jyoti?igsh=M200NHNncnZjOWQz", "_blank"); }, 1500);
        return "Opening our Instagram profile in a new tab... 📸 Check out our latest reels and designs!";
      }
      if (rawLower.includes("youtube") || rawLower.includes("yutub")) {
        setTimeout(() => { window.open("https://youtube.com/@jyotimehndiartist-m9g?si=a_nUhTHsi0zv-4nX", "_blank"); }, 1500);
        return "Opening our YouTube channel in a new tab... 🎥 Enjoy our bridal vlogs!";
      }
      if (rawLower.includes("facebook") || rawLower.includes("fb")) {
        setTimeout(() => { window.open("https://www.facebook.com/share/1AwpsjFKnh/", "_blank"); }, 1500);
        return "Opening our Facebook page in a new tab... 💻";
      }
      if (rawLower.includes("pinterest") || rawLower.includes("pin")) {
        setTimeout(() => { window.open("https://pin.it/2ZoiasFlN", "_blank"); }, 1500);
        return "Opening our Pinterest boards in a new tab... 📌";
      }
      return "📲 **Connect with Jyoti Mehendi:**\n\n• **WhatsApp/Call:** +91 7906297942\n• **Instagram:** [@mehndi_artist__jyoti](https://www.instagram.com/mehndi_artist__jyoti)\n• **YouTube:** [Jyoti Mehndi Artist](https://youtube.com/@jyotimehndiartist-m9g)\n\nType *'call now'* to call us, or *'open instagram'* to view our profile!";
    }

    if (corrected.includes("design") || corrected.includes("gallery") || corrected.includes("photo") || corrected.includes("pic")) {
      if (isAction) {
        setTimeout(() => { router.push("/gallery"); }, 1500);
        return "Redirecting you to our portfolio Gallery... 🎨 Enjoy browsing our signature henna designs!";
      }
      return "🎨 **Designs & Gallery:**\n\nYou can browse our latest bridal, arabic, and traditional designs under the **Gallery** tab on our website, or check our Instagram grid!\n\nType *'go to gallery'* and I will redirect you there instantly!";
    }

    if (corrected.includes("offer") || corrected.includes("coupon") || corrected.includes("discount")) {
      if (isAction) {
        setTimeout(() => { router.push("/offers"); }, 1500);
        return "Taking you to our Active Offers page... 🏷️ Check out active coupon codes like WELCOME50!";
      }
      if (liveCoupons.length > 0) {
        const couponListStr = liveCoupons
          .map(c => `• **${c.id}**: Get ${c.discountType === 'flat' ? `₹${c.discountAmount}` : `${c.discountAmount}%`} off${c.minAmount ? ` (on bookings above ₹${c.minAmount})` : ""}`)
          .join("\n");
        return `🏷️ **Active Coupons & Offers:**\n\n${couponListStr}\n\nType the coupon code when checking out to claim your discount! 🌸\n\n💡 *Why choose us? We use 100% organic henna and specialize in custom portrait patterns! 🌿*`;
      }
      return "🏷️ **Active Offers & Discounts:**\n\n• **First Booking:** Use coupon code **WELCOME50** to get ₹50 off!\n• **Group Discount:** Get **10% off** on bridal bookings if guest count exceeds 5 hands.\n\nType *'go to offers'* to view full details!";
    }

    if (corrected.includes("review") || corrected.includes("rating") || corrected.includes("feedback") || corrected.includes("testimonial")) {
      if (isAction) {
        setTimeout(() => { router.push("/reviews"); }, 1500);
        return "Redirecting you to our Customer Reviews page to read what brides say... ⭐";
      }
      return "⭐ **Customer Reviews & Ratings:**\n\nWe are proud to have a **4.9/5 star rating** from over 250+ brides in Agra!\n\nType *'go to reviews'* to read full customer reviews!";
    }

    if (corrected.includes("gift") || corrected.includes("voucher") || corrected.includes("card")) {
      if (isAction) {
        setTimeout(() => { router.push("/gift-cards"); }, 1500);
        return "Taking you to our Gift Cards customization store... 🎁 Create and send premium vouchers online!";
      }
      return "🎁 **Gift Vouchers:**\n\nSurprise your friends and family with a premium mehndi session! You can purchase customized gift vouchers online starting from **₹500**.\n\nType *'go to gift cards'* and I will redirect you there instantly!";
    }

    if (rawLower.includes("hello") || rawLower.includes("hi") || rawLower.includes("namaste") || rawLower.includes("hey")) {
      return "Namaste! Welcome to Jyoti Mehendi. 🙏 How can I assist you with designs, prices, aftercare, or bookings today?";
    }

    // 4. Log Unanswered Query for auto-learning
    if (!isAdmin && raw.trim().length > 0) {
      try {
        await addDoc(collection(db, "unresolved_queries"), {
          query: raw,
          timestamp: new Date(),
          resolved: false,
          source: "chatbot_nlp"
        });
      } catch (e) {
        console.error("Error logging unanswered query:", e);
      }
    }

    return `🤖 I am still learning! I couldn't find a direct answer for: *"${raw}"*.\n\nI have logged your question for Jyoti to review. \n\nIn the meantime, feel free to ask about:\n• 🌸 **Packages & prices**\n• 🚗 **Home visit coverage**\n• 🍋 **Stain tips & aftercare**\n• 📅 **How to book a slot**`;
  };

  // Render message text with simple markdown parsing for links [label](url) and bold **text**
  const renderBoldText = (text: string): (string | React.ReactNode)[] => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;
    boldRegex.lastIndex = 0;
    while ((match = boldRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const textBefore = text.substring(lastIndex, matchIndex);
      if (textBefore) {
        parts.push(textBefore);
      }
      const boldContent = match[1];
      parts.push(
        <strong key={`bold-${matchIndex}`} className="font-extrabold text-pink-700">
          {boldContent}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  const renderMessageText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const textBefore = text.substring(lastIndex, matchIndex);
      if (textBefore) {
        parts.push(...renderBoldText(textBefore));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a 
          key={`link-${matchIndex}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-pink-600 hover:text-pink-800 underline font-bold transition-colors inline-block"
        >
          {label}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(...renderBoldText(text.substring(lastIndex)));
    }
    return parts.length > 0 ? parts : text;
  };

  // Bot response dispatcher for quick suggestion buttons
  const handleUserSelect = (option: string, value: string) => {
    setMessages(prev => [...prev, { sender: "user", text: option }]);
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      if (value === "live_support") {
        initiateLiveSupportRequest();
      } else if (value === "start_quiz") {
        setQuizStep(1);
        setQuizAnswers([]);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Let's calculate your Mehndi Stain Darkness! 🔮 Question 1: How long will you keep the mehndi on your hands?" }
        ]);
      } else {
        const corrected = correctSpelling(option);
        const botResponse = await generateBotResponse(corrected, option);
        setMessages(prev => [...prev, { sender: "bot", text: botResponse }]);
      }
    }, 800);
  };

  // Chat custom text submission
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const raw = sanitizeInput(textInput);
    if (!raw) return;
    setTextInput("");
    setMessages((prev) => [...prev, { sender: "user", text: raw }]);
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      
      // Intercept if booking name is requested
      if (bookingStep === 4) {
        setBookingData(prev => ({
          ...prev,
          customerName: raw
        }));
        setBookingStep(5);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: `Thank you, **${raw}**! Step 5: Now enter your contact phone number in the chat box:` }
        ]);
        return;
      }

      // Intercept if booking phone is requested
      if (bookingStep === 5) {
        setBookingData(prev => ({
          ...prev,
          phone: raw
        }));
        setBookingStep(6);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Almost done! Step 6: Review your details below and click **'Confirm Booking'** to reserve your slot." }
        ]);
        return;
      }

      // Intercept shipping address
      if (orderStep === 2) {
        setShippingAddress(raw);
        setOrderStep(3);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: `Got it! Shipping to: **${raw}**.\n\nStep 3: Complete your UPI payment below to place your order.` }
        ]);
        return;
      }

      // Intercept booking verification for live chat
      if (liveChatVerifyingStep === 1) {
        const queryText = raw.trim();
        let verified = false;
        let matchedDoc: any = null;

        try {
          const docRef = doc(db, "bookings", queryText);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            verified = true;
            matchedDoc = docSnap.data();
          }

          if (!verified) {
            const qPhone = query(collection(db, "bookings"), where("phone", "==", queryText));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) {
              verified = true;
              matchedDoc = snapPhone.docs[0].data();
            }
          }

          if (!verified) {
            const qEmail = query(collection(db, "bookings"), where("customerEmail", "==", queryText));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
              verified = true;
              matchedDoc = snapEmail.docs[0].data();
            }
          }
        } catch (err) {
          console.error("Error querying bookings database for verification:", err);
        }

        if (verified) {
          localStorage.setItem("jyoti_booking_verified", "true");
          setLiveChatVerifyingStep(2);
          setMessages(prev => [
            ...prev,
            { sender: "bot", text: `✅ **Booking Verified!** Found active reservation for: **${matchedDoc.customerName || "Client"}**.` }
          ]);
          setTimeout(() => {
            startLiveChatSession();
          }, 800);
        } else {
          setMessages(prev => [
            ...prev,
            { sender: "bot", text: `❌ **Failed to verify booking**: We couldn't find any active booking matching *"${queryText}"*.\n\nPlease type a different Phone Number / Booking ID, or click **'📅 Book Slot Now'** to reserve a new slot.` }
          ]);
        }
        return;
      }

      // Intercept if live support chat session is active
      if (isLiveChatMode) {
        try {
          await updateDoc(doc(db, "live_chats", chatSessionId), {
            messages: arrayUnion({
              sender: "user",
              text: raw,
              timestamp: new Date()
            }),
            status: "pending",
            updatedAt: new Date()
          });
        } catch (err) {
          console.error("Failed to append client message to live chat doc:", err);
        }
        return;
      }

      const corrected = correctSpelling(raw);
      const botResponse = await generateBotResponse(corrected, raw);
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 800);
  };

  // Conversational booking helpers
  const getNext5Days = () => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        label: d.toLocaleDateString('en-US', options),
        iso: d.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const handleBookingSelect = (type: string, value: any) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (type === "service") {
        setBookingData(prev => ({
          ...prev,
          serviceId: value.id,
          serviceTitle: value.title,
          price: value.price,
          originalPrice: value.price
        }));
        setBookingStep(2);
        setMessages(prev => [
          ...prev,
          { sender: "user", text: `Selected Service: ${value.title}` },
          { sender: "bot", text: "Great choice! Step 2: Choose your booking date from the options below:" }
        ]);
      } else if (type === "package") {
        setBookingData(prev => ({
          ...prev,
          serviceId: "package",
          serviceTitle: value.name,
          price: value.price,
          originalPrice: value.price
        }));
        setBookingStep(2);
        setMessages(prev => [
          ...prev,
          { sender: "user", text: `Selected Package: ${value.name}` },
          { sender: "bot", text: "Great choice! Step 2: Choose your booking date from the options below:" }
        ]);
      } else if (type === "date") {
        setBookingData(prev => ({
          ...prev,
          bookingDateString: value.iso
        }));
        setBookingStep(3);
        setMessages(prev => [
          ...prev,
          { sender: "user", text: `Selected Date: ${value.label}` },
          { sender: "bot", text: "Perfect. Step 3: Select an available time slot:" }
        ]);
      } else if (type === "slot") {
        setBookingData(prev => ({
          ...prev,
          timeSlot: value
        }));
        setBookingStep(4);
        setMessages(prev => [
          ...prev,
          { sender: "user", text: `Selected Time Slot: ${value}` },
          { sender: "bot", text: "Awesome! Step 4: Please enter your full name in the chat box below to identify your booking:" }
        ]);
      }
    }, 600);
  };

  const submitBooking = async () => {
    setIsTyping(true);
    try {
      const bRef = "JM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalCustomerId = user ? user.uid : "guest";

      const finalBooking = {
        bookingRef: bRef,
        customerId: finalCustomerId,
        customerName: bookingData.customerName,
        phone: bookingData.phone,
        address: "Agra Home Visit (via AI Assistant)",
        serviceId: bookingData.serviceId,
        serviceTitle: bookingData.serviceTitle,
        price: bookingData.price,
        originalPrice: bookingData.originalPrice,
        couponCode: null,
        couponDiscount: 0,
        returningDiscount: 0,
        isPackage: bookingData.serviceId === "package",
        bookingDateString: bookingData.bookingDateString,
        bookingDate: new Date(bookingData.bookingDateString),
        timeSlot: bookingData.timeSlot,
        status: "confirmed",
        paymentStatus: "pending",
        paymentId: "pay_at_venue",
        amountPaidOnline: 0,
        balanceDue: bookingData.price,
        createdAt: new Date()
      };

      const waNotifyMsg = encodeURIComponent(`Hi Jyoti, a customer just booked an appointment slot!\n\n• Ref ID: ${bRef}\n• Service: ${bookingData.serviceTitle}\n• Date: ${bookingData.bookingDateString}\n• Time: ${bookingData.timeSlot}\n• Phone: ${bookingData.phone}`);
      const waAlertLink = `https://wa.me/917906297942?text=${waNotifyMsg}`;

      await addDoc(collection(db, "bookings"), finalBooking);

      setIsTyping(false);
      setBookingStep(0);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `🎉 **Booking Confirmed!**\n\nYour appointment slot has been successfully reserved!\n\n• **Reference ID:** ${bRef}\n• **Service:** ${bookingData.serviceTitle}\n• **Date:** ${bookingData.bookingDateString}\n• **Time Slot:** ${bookingData.timeSlot}\n\n[Click here to notify Jyoti on WhatsApp](${waAlertLink}) instantly to coordinate her home visit!\n\nThank you. 🙏` }
      ]);
    } catch (err: any) {
      setIsTyping(false);
      console.error("Error creating booking from chatbot:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `❌ Failed to confirm booking: ${err.message}. Please try again.` }
      ]);
    }
  };

  // Voice Synthesis & Recognition Helpers
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`[\]()]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Google Chrome or Safari!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const submitVoiceQuery = (transcript: string) => {
    const cleanTranscript = sanitizeInput(transcript);
    if (!cleanTranscript) return;
    setMessages((prev) => [...prev, { sender: "user", text: cleanTranscript }]);
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      
      if (bookingStep === 4) {
        setBookingData(prev => ({ ...prev, customerName: transcript }));
        setBookingStep(5);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: `Thank you, **${transcript}**! Step 5: Now enter your contact phone number in the chat box:` }
        ]);
        return;
      }
      if (bookingStep === 5) {
        setBookingData(prev => ({ ...prev, phone: transcript }));
        setBookingStep(6);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Almost done! Step 6: Review your details below and click **'Confirm Booking'** to reserve your slot." }
        ]);
        return;
      }
      if (orderStep === 2) {
        setShippingAddress(transcript);
        setOrderStep(3);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: `Got it! Shipping to: **${transcript}**.\n\nStep 3: Complete your UPI payment below to place your order.` }
        ]);
        return;
      }

      // Intercept booking verification for live chat
      if (liveChatVerifyingStep === 1) {
        const queryText = transcript.trim();
        let verified = false;
        let matchedDoc: any = null;

        try {
          const docRef = doc(db, "bookings", queryText);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            verified = true;
            matchedDoc = docSnap.data();
          }

          if (!verified) {
            const qPhone = query(collection(db, "bookings"), where("phone", "==", queryText));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) {
              verified = true;
              matchedDoc = snapPhone.docs[0].data();
            }
          }

          if (!verified) {
            const qEmail = query(collection(db, "bookings"), where("customerEmail", "==", queryText));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
              verified = true;
              matchedDoc = snapEmail.docs[0].data();
            }
          }
        } catch (err) {
          console.error("Error querying bookings database for verification:", err);
        }

        if (verified) {
          localStorage.setItem("jyoti_booking_verified", "true");
          setLiveChatVerifyingStep(2);
          setMessages(prev => [
            ...prev,
            { sender: "bot", text: `✅ **Booking Verified!** Found active reservation for: **${matchedDoc.customerName || "Client"}**.` }
          ]);
          setTimeout(() => {
            startLiveChatSession();
          }, 800);
        } else {
          setMessages(prev => [
            ...prev,
            { sender: "bot", text: `❌ **Failed to verify booking**: We couldn't find any active booking matching *"${queryText}"*.\n\nPlease type a different Phone Number / Booking ID, or click **'📅 Book Slot Now'** to reserve a new slot.` }
          ]);
        }
        return;
      }

      // Intercept if live support chat session is active
      if (isLiveChatMode) {
        try {
          await updateDoc(doc(db, "live_chats", chatSessionId), {
            messages: arrayUnion({
              sender: "user",
              text: transcript,
              timestamp: new Date()
            }),
            status: "pending",
            updatedAt: new Date()
          });
        } catch (err) {
          console.error("Failed to append client voice message to live chat doc:", err);
        }
        return;
      }

      const corrected = correctSpelling(transcript);
      const botResponse = await generateBotResponse(corrected, transcript);
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 800);
  };

  // Organic Store Checkout Helpers
  const handleProductChoice = (product: any) => {
    setSelectedProduct(product);
    setOrderStep(2);
    setMessages(prev => [
      ...prev,
      { sender: "user", text: `Buy Product: ${product.name}` },
      { sender: "bot", text: `Excellent choice! 📦 **${product.name}** costs ₹${product.price}.\n\nStep 2: Please enter your complete delivery/shipping address in the chat text box below:` }
    ]);
  };

  const submitOrder = async () => {
    setIsTyping(true);
    try {
      const orderRef = "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalCustomerId = user ? user.uid : "guest";

      const orderDoc = {
        orderRef,
        customerId: finalCustomerId,
        productName: selectedProduct.name,
        productId: selectedProduct.id,
        price: selectedProduct.price,
        shippingAddress,
        status: "pending_payment",
        createdAt: new Date()
      };

      await addDoc(collection(db, "product_orders"), orderDoc);

      const waNotifyMsg = encodeURIComponent(`Hi Jyoti, a customer just placed an order!\n\n• Order Ref: ${orderRef}\n• Product: ${selectedProduct.name}\n• Address: ${shippingAddress}`);
      const waAlertLink = `https://wa.me/917906297942?text=${waNotifyMsg}`;

      setIsTyping(false);
      setOrderStep(0);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `🎉 **Order Registered Successfully!**\n\nYour reference ID is **${orderRef}**.\n\n* Jyoti will verify your payment and dispatch the package within 24 hours.\n* [Click to notify Jyoti on WhatsApp](${waAlertLink}) instantly to confirm delivery address!\n\nThank you for shopping at Jyoti Mehendi! 🌿` }
      ]);
    } catch (err: any) {
      setIsTyping(false);
      console.error("Order submission failure:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `❌ Order submission failed: ${err.message}. Please try again.` }
      ]);
    }
  };

  const cancelOrder = () => {
    setOrderStep(0);
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "Order process cancelled. How else can I help you today?" }
    ]);
  };

  const generateCertificateImage = (text: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, "#FFF5F7");
    grad.addColorStop(1, "#FFE4E6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Draw double borders
    ctx.strokeStyle = "#DB2777";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 760, 560);
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 730, 530);

    // Draw brand name
    ctx.fillStyle = "#DB2777";
    ctx.font = "bold 32px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("JYOTI MEHENDI ARTIST", 400, 90);

    // Draw subtitle
    ctx.fillStyle = "#9D174D";
    ctx.font = "italic 16px Georgia, serif";
    ctx.fillText(" Agra's Premium Organic Henna Expert ", 400, 120);

    // Divider line
    ctx.strokeStyle = "#DB2777";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 140);
    ctx.lineTo(550, 140);
    ctx.stroke();

    // Certificate Title
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 26px Georgia, serif";
    ctx.fillText("HENNA AFTERCARE CERTIFICATE", 400, 200);

    // Body text
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText("This certificate registers your custom stain prediction & care recommendation:", 400, 240);

    // Extract prediction score
    let scoreText = "Stain Predictor Result";
    if (text.includes("Rank: 10")) scoreText = "Deep Royal Mahogany Stain (Stain Rank: 10/10)";
    else if (text.includes("Rank: 7")) scoreText = "Classic Chestnut Stain (Stain Rank: 7/10)";
    else if (text.includes("Rank: 4")) scoreText = "Light Tangerine Amber (Stain Rank: 4/10)";

    ctx.fillStyle = "#BE185D";
    ctx.font = "bold 22px Georgia, serif";
    ctx.fillText(scoreText, 400, 290);

    // Recommendations block background
    ctx.fillStyle = "rgba(219, 39, 119, 0.05)";
    ctx.fillRect(80, 330, 640, 180);
    ctx.strokeStyle = "rgba(219, 39, 119, 0.2)";
    ctx.strokeRect(80, 330, 640, 180);

    // Write recommendations
    ctx.fillStyle = "#475569";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Recommended Organic Care Rules:", 110, 365);

    ctx.font = "13px sans-serif";
    ctx.fillText("1. Do NOT wash with water directly. Scrape mehendi paste using mustard/coconut oil.", 110, 395);
    ctx.fillText("2. Keep mehendi paste on skin for at least 6 to 8 hours (preferably overnight).", 110, 425);
    ctx.fillText("3. Take warm clove steam (laung ki bhaap) on palms to intensify the dark stain.", 110, 455);
    ctx.fillText("4. Avoid soaps, sanitizers, or heavy washing for the first 24 hours.", 110, 485);

    // Footer signature
    ctx.fillStyle = "#DB2777";
    ctx.font = "italic 18px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Jyoti Mehendi", 400, 550);

    // Trigger image download
    const link = document.createElement("a");
    link.download = `Jyoti_Mehendi_Stain_Certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const cancelBooking = () => {
    setBookingStep(0);
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "Booking process cancelled. How else can I help you today?" }
    ]);
  };

  // Quiz progression logic
  const handleQuizAnswer = (answerText: string, value: string) => {
    setMessages(prev => [...prev, { sender: "user", text: answerText }]);
    const updatedAnswers = [...quizAnswers, value];
    setQuizAnswers(updatedAnswers);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      if (quizStep === 1) {
        setQuizStep(2);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Got it! Question 2: What after-care oil/steam will you apply after scraping off the paste?" }
        ]);
      } else if (quizStep === 2) {
        setQuizStep(3);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "Final Question: Which part of the hand/body are you applying mehndi on?" }
        ]);
      } else if (quizStep === 3) {
        setQuizStep(0);
        const hours = updatedAnswers[0];
        const care = updatedAnswers[1];
        const part = updatedAnswers[2];

        let score = 0;
        if (hours === "overnight") score += 3;
        else if (hours === "4to8") score += 2;
        else score += 1;

        if (care === "clove_steam") score += 3;
        else if (care === "mustard") score += 2;
        else score += 1;

        if (part === "palms") score += 3;
        else if (part === "back_hand") score += 2;
        else score += 1;

        let prediction = "";
        let advice = "";

        if (score >= 8) {
          prediction = "🔥 Prediction: Deep Royal Mahogany Stain! (Stain Rank: 10/10)";
          advice = "Your stain is expected to be incredibly rich and dark! Since you're opting for overnight application and clove steam/mustard oil on your palms, you'll get the maximum mahogany stain. Remember to keep hands dry for 24 hours.";
        } else if (score >= 5) {
          prediction = "🍂 Prediction: Classic Chestnut Stain! (Stain Rank: 7/10)";
          advice = "You'll get a beautiful dark red-brown stain. To bump it up to rank 10: avoid washing with water directly, scrape using oil, and take clove steam!";
        } else {
          prediction = "🍊 Prediction: Light Tangerine Amber! (Stain Rank: 4/10)";
          advice = "Your stain might remain on the lighter orange side. Tip: Do not wash with water, keep paste on for at least 6 hours, and avoid soap for 24 hours!";
        }

        setMessages(prev => [
          ...prev,
          { sender: "bot", text: `${prediction}\n\n${advice}`, isQuizResult: true }
        ]);
      }
    }, 800);
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-24 md:bottom-10 right-6 z-[100] flex flex-col items-end space-y-4">
      
      {/* Floating Action Buttons */}
      <div className="flex flex-col items-center space-y-3">
        {/* WhatsApp */}
        <motion.a
          href={`https://wa.me/91${phone}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.3)] border-2 border-white flex items-center justify-center relative group"
        >
          <FaWhatsapp size={22} className="animate-[whatsapp-bounce_2s_infinite]" />
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/20">
            WhatsApp: +91 {phone}
          </span>
        </motion.a>

        {/* Call Now */}
        <motion.a
          href={`tel:+91${phone}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-green-500 text-white p-3.5 rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.3)] border-2 border-white flex items-center justify-center relative group"
        >
          <span className="animate-[wiggle_1.2s_ease-in-out_infinite] flex items-center justify-center">
            <FaPhone size={20} style={{ transform: "scaleX(-1)" }} />
          </span>
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/20">
            Call Now: +91 {phone}
          </span>
        </motion.a>

        {/* Chatbot Toggle Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`${isOpen ? 'bg-gray-800 border-gray-700' : 'bg-pink-600 border-white'} text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-colors border-2 relative`}
        >
          {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
          )}
        </motion.button>
      </div>
    </div>
      )}

      {/* Chatbot Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 sm:bottom-8 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-96 max-h-[85vh] md:max-h-[580px] bg-white rounded-3xl border border-pink-100 shadow-[0_20px_50px_rgba(219,39,119,0.15)] overflow-hidden z-[110] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-serif font-black text-white text-lg">
                  J
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide font-serif">Jyoti Mehendi Assistant</h4>
                  <p className="text-[10px] text-pink-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Online • Responds Instantly
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <FiX size={20} />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-grow min-h-[100px] p-4 overflow-y-auto space-y-3 bg-pink-50/20 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm border relative group/msg ${
                      m.sender === "user"
                        ? "bg-pink-600 text-white rounded-tr-none border-pink-700"
                        : m.isQuizResult
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100 font-medium"
                        : "bg-white text-gray-700 rounded-tl-none border-pink-50/50"
                    }`}
                  >
                    {renderMessageText(m.text)}

                    {/* Interactive conversational product push card */}
                    {m.type === "product_link" && (
                      <div className="mt-2.5 p-3 bg-pink-50/50 border border-pink-100/50 rounded-xl space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🛍️</span>
                          <div>
                            <p className="font-bold text-gray-800 text-[10px]">Premium Organic Cones</p>
                            <p className="text-[8px] text-gray-400">100% natural, deep mahogany stain guaranteed</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setOrderStep(1);
                            setMessages(prev => [
                              ...prev,
                              { sender: "bot", text: "Welcome to Jyoti Mehendi's Organic Store! 🛍️ Select an item below to begin your purchase:" }
                            ]);
                          }}
                          className="w-full py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[9px] font-bold uppercase transition-all shadow-sm shadow-pink-600/10 flex items-center justify-center gap-1"
                        >
                          Buy Organic Cones
                        </button>
                      </div>
                    )}

                    {/* Interactive conversational booking push card */}
                    {m.type === "booking_link" && (
                      <div className="mt-2.5 p-3 bg-pink-50/50 border border-pink-100/50 rounded-xl space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          <div>
                            <p className="font-bold text-gray-800 text-[10px]">Reserve Appointment Slot</p>
                            <p className="text-[8px] text-gray-400">Select packages, designs, and date/time slot</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setBookingStep(1);
                            setMessages(prev => [
                              ...prev,
                              { sender: "bot", text: "Let's book a mehendi appointment slot! 📅 Step 1: Select the mehendi service or package you'd like to book:" }
                            ]);
                          }}
                          className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-bold uppercase transition-all shadow-sm shadow-rose-600/10 flex items-center justify-center gap-1"
                        >
                          Book Slot Now
                        </button>
                      </div>
                    )}

                    {/* Speak Button (Visible on hover for Bot messages) */}
                    {m.sender === "bot" && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="absolute -right-7 top-1/2 -translate-y-1/2 p-1 bg-white border border-pink-100 rounded-full text-pink-500 hover:bg-pink-50 opacity-0 group-hover/msg:opacity-100 transition-opacity shadow-sm flex items-center justify-center z-10"
                        title="Speak response"
                      >
                        <FiVolume2 size={10} />
                      </button>
                    )}

                    {/* Download Stain Certificate Button */}
                    {m.isQuizResult && (
                      <button
                        onClick={() => generateCertificateImage(m.text)}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        📥 Download Stain Certificate
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-400 px-4 py-2 rounded-2xl rounded-tl-none border border-pink-50/50 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions / Quiz / Booking Options */}
            <div className="p-3 border-t border-pink-50 bg-white flex-shrink-0">
              {orderStep === 1 ? (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] text-gray-400 font-bold mb-1">Select Product to Purchase:</p>
                  {[
                    { id: "cone_pack", name: "Premium Organic Cones (Pack of 5)", price: 250, desc: "100% natural henna cones." },
                    { id: "stain_oil", name: "Stain Booster Henna Oil (30ml)", price: 120, desc: "Clove & eucalyptus blend." },
                    { id: "stencil_kit", name: "Bridal Stencil Templates Set", price: 199, desc: "Easy reusable templates." }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProductChoice(p)}
                      className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-bold border border-pink-100 transition-colors text-[10px] flex justify-between items-center"
                    >
                      <span>🛍️ {p.name}</span>
                      <span>₹{p.price}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setOrderStep(0)}
                    className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-[10px] font-bold transition-all text-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : orderStep === 2 ? (
                <div className="p-2 bg-pink-50/20 rounded-xl border border-pink-100/50 text-[10px] text-gray-500 font-bold text-center">
                  🚚 Please type your full delivery address in the text input box below.
                </div>
              ) : orderStep === 3 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold">UPI Payment Checkout:</p>
                  <div className="p-3 bg-pink-50/30 border border-pink-100 rounded-2xl text-[10px] text-gray-700 space-y-1 leading-relaxed font-sans">
                    <p>• **Product:** {selectedProduct.name}</p>
                    <p>• **Total Price:** ₹{selectedProduct.price}</p>
                    <p>• **Deliver To:** {shippingAddress}</p>
                  </div>
                  
                  {/* Dynamic UPI Deep Link Button for Mobile */}
                  <a
                    href={`upi://pay?pa=7906297942@paytm&pn=Jyoti%20Mehendi&am=${selectedProduct.price}&cu=INR&tn=Order%20for%20${selectedProduct.name}`}
                    className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:shadow-md transition-shadow flex items-center justify-center gap-1 shadow-md text-center"
                  >
                    📱 Click to Pay via UPI (Mobile)
                  </a>

                  <div className="flex gap-2">
                    <button
                      onClick={submitOrder}
                      className="flex-grow py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={cancelOrder}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : bookingStep === 1 ? (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] text-gray-400 font-bold mb-1">Select Service or Package:</p>
                  {liveServices.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleBookingSelect("service", s)}
                      className="w-full text-left p-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors text-[10px]"
                    >
                      🌸 {s.title} (₹{s.price})
                    </button>
                  ))}
                  {livePackages.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleBookingSelect("package", p)}
                      className="w-full text-left p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium border border-rose-100 transition-colors text-[10px]"
                    >
                      🎁 Package: {p.name} (₹{p.price})
                    </button>
                  ))}
                </div>
              ) : bookingStep === 2 ? (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] text-gray-400 font-bold w-full mb-1">Select Date:</p>
                  {getNext5Days().map(d => (
                    <button
                      key={d.iso}
                      onClick={() => handleBookingSelect("date", d)}
                      className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-bold border border-pink-100 transition-colors text-[10px]"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              ) : bookingStep === 3 ? (
                <div className="flex flex-wrap gap-2">
                  <p className="text-[10px] text-gray-400 font-bold w-full mb-1">Select Time Slot:</p>
                  {["10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"].map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleBookingSelect("slot", slot)}
                      className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-bold border border-pink-100 transition-colors text-[10px]"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : bookingStep === 4 || bookingStep === 5 ? (
                <div className="p-2 bg-pink-50/20 rounded-xl border border-pink-100/50 text-[10px] text-gray-500 font-bold text-center">
                  💬 Please type your details in the text input box below to continue.
                </div>
              ) : bookingStep === 6 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold">Review Booking Details:</p>
                  <div className="p-3 bg-pink-50/30 border border-pink-100 rounded-2xl text-[10px] text-gray-700 space-y-1 leading-relaxed font-sans">
                    <p>• **Service:** {bookingData.serviceTitle}</p>
                    <p>• **Price:** ₹{bookingData.price}</p>
                    <p>• **Date:** {bookingData.bookingDateString}</p>
                    <p>• **Time Slot:** {bookingData.timeSlot}</p>
                    <p>• **Name:** {bookingData.customerName}</p>
                    <p>• **Phone:** {bookingData.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={submitBooking}
                      className="flex-grow py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={cancelBooking}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : quizStep === 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                  <button
                    onClick={() => handleUserSelect("💬 Live Chat with Owner", "live_support")}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-pink-500 rounded-full font-bold text-[10px] hover:shadow-md transition-all flex items-center gap-1 shadow-sm"
                  >
                    💬 Live Chat with Owner
                  </button>
                  <button
                    onClick={() => {
                      setBookingStep(1);
                      setMessages(prev => [
                        ...prev,
                        { sender: "bot", text: "Let's book a mehendi appointment slot! 📅 Step 1: Please select the mehendi service or package you'd like to book:" }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-pink-600 text-white border border-pink-700 rounded-full font-bold text-[10px] hover:bg-pink-700 transition-all flex items-center gap-1 shadow-md shadow-pink-600/10"
                  >
                    📅 Book Slot Now
                  </button>
                  <button
                    onClick={() => {
                      setOrderStep(1);
                      setMessages(prev => [
                        ...prev,
                        { sender: "bot", text: "Welcome to Jyoti Mehendi's Organic Store! 🛍️ Select an item below to begin your purchase:" }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[10px] hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    🛍️ Buy Organic Cones
                  </button>
                  <button
                    onClick={() => handleUserSelect("Bridal Packages", "bridal_info")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🌸 Bridal Packages
                  </button>
                  <button
                    onClick={() => handleUserSelect("Agra Visit Details", "visit_charges")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🏠 Agra Visit Details
                  </button>
                  <button
                    onClick={() => handleUserSelect("Stain Darkening Tips", "stain_tips")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🍋 Stain Darkening Tips
                  </button>
                  <button
                    onClick={() => handleUserSelect("Calculate Stain Darkness", "start_quiz")}
                    className="px-3 py-1.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full font-bold text-[10px] hover:bg-rose-200 transition-colors flex items-center gap-1"
                  >
                    🔮 Stain Predictor Quiz
                  </button>
                  <button
                    onClick={() => handleUserSelect("Active Offers & Coupons", "offers")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🏷️ Active Offers
                  </button>
                  <button
                    onClick={() => handleUserSelect("Latest Designs Gallery", "gallery")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🎨 Latest Designs
                  </button>
                  <button
                    onClick={() => handleUserSelect("Customer Reviews & Ratings", "reviews")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    ⭐ Customer Reviews
                  </button>
                  <button
                    onClick={() => handleUserSelect("Gift Vouchers Details", "gift_vouchers")}
                    className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold text-[10px] hover:bg-pink-100 transition-colors"
                  >
                    🎁 Gift Vouchers
                  </button>
                  <button
                    onClick={() => handleUserSelect("Social Networks", "socials")}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-full font-bold text-[10px] hover:bg-gray-100 transition-colors"
                  >
                    📲 Social Networks
                  </button>
                </div>
              ) : quizStep === 1 ? (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleQuizAnswer("Less than 4 hours", "less4")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    ⌛ Less than 4 hours (Quick session)
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("4 to 8 hours", "4to8")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    🕒 4 to 8 hours (Standard)
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("Overnight (8+ hours)", "overnight")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    💤 Overnight (8+ hours - Recommended)
                  </button>
                </div>
              ) : quizStep === 2 ? (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleQuizAnswer("None / Washing with water directly", "water")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    💧 Wash with water directly
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("Mustard / Coconut Oil wipe", "mustard")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    🥥 Apply Mustard/Coconut Oil only
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("Clove steam + Mustard oil scrape", "clove_steam")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    💨 Clove Steam fumes + Mustard Oil (Best)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleQuizAnswer("Palms of hands", "palms")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    ✋ Palms of Hands (Skin is thicker)
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("Back of hands", "back_hand")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    🤚 Back of Hands
                  </button>
                  <button
                    onClick={() => handleQuizAnswer("Legs / Feet", "legs")}
                    className="w-full text-left p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-medium border border-pink-100 transition-colors"
                  >
                    👣 Legs or Feet
                  </button>
                </div>
              )}

              {messages[messages.length - 1]?.text?.includes("latest designs") && (
                <div className="flex items-center gap-3 justify-center mt-3 pt-3 border-t border-pink-50">
                  {socialLinks.map(s => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 bg-gray-50 border border-gray-100 rounded-full transition-all ${s.color}`}
                      title={s.name}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Keyboard TextInput Bar */}
            <form onSubmit={handleSendText} className="flex items-center gap-2 p-2.5 border-t border-pink-50 bg-white">
              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all flex items-center justify-center border ${
                  isListening 
                    ? "bg-red-500 text-white border-red-600 animate-pulse" 
                    : "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100"
                }`}
                title="Speak your question"
              >
                <FiMic size={13} />
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isAdmin ? "Ask or train: /train key -> reply" : "Type your question..."}
                className="flex-grow px-3.5 py-2 bg-pink-50/30 border border-pink-100 rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-[11px] font-medium text-gray-700"
              />
              <button
                type="submit"
                className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all shadow-md shadow-pink-600/10 flex items-center justify-center"
              >
                <FiSend size={13} />
              </button>
            </form>

            <div className="bg-pink-50/30 p-2 text-center border-t border-pink-50">
              <a
                href="/booking"
                className="inline-block w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:shadow-md transition-shadow"
              >
                📅 Click to Instant Book Slot
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes whatsapp-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </>
  );
}
