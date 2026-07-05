import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
import { FiCpu, FiCheck, FiTrash2, FiPlus, FiAlertCircle, FiHelpCircle, FiMessageSquare, FiSend, FiUser, FiActivity } from "react-icons/fi";

export default function AdminAssistantManager() {
  const [unresolved, setUnresolved] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newKeywords, setNewKeywords] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Real-time Live Chat Support States
  const [activeTab, setActiveTab] = useState<"live" | "teach">("live");
  const [liveChats, setLiveChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [replyMsgText, setReplyMsgText] = useState("");
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [greetingText, setGreetingText] = useState("");
  const [todayBookingsCount, setTodayBookingsCount] = useState<string>("8");

  // Load settings dynamic greeting
  useEffect(() => {
    if (db) {
      const unsub = onSnapshot(doc(db, "bot_settings", "greeting"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGreetingText(data.welcomeText || "");
          setTodayBookingsCount(data.todayBookings !== undefined ? String(data.todayBookings) : "8");
        }
      });
      return unsub;
    }
  }, []);

  const handleSaveGreeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!greetingText.trim()) return;
    try {
      await setDoc(doc(db, "bot_settings", "greeting"), {
        welcomeText: greetingText.trim(),
        todayBookings: Number(todayBookingsCount) || 8,
        updatedAt: new Date()
      });
      alert("Assistant settings saved successfully!");
    } catch (err) {
      console.error("Failed to save assistant settings:", err);
      alert("Failed to save setting.");
    }
  };

  const calculateSentiment = (messages: any[]): { label: string; color: string; emoji: string } => {
    if (!messages || messages.length === 0) return { label: "Neutral", color: "bg-gray-100 text-gray-700", emoji: "😐" };
    
    const customerMsgs = messages.filter(m => m.sender === "user").map(m => m.text?.toLowerCase() || "");
    if (customerMsgs.length === 0) return { label: "Neutral", color: "bg-gray-100 text-gray-700", emoji: "😐" };
    
    const negativeWords = ["fail", "error", "delay", "bad", "wrong", "expensive", "slow", "poor", "no", "hate", "issue", "cancel", "cheat"];
    const positiveWords = ["love", "nice", "good", "great", "awesome", "perfect", "thanks", "thank you", "yes", "beautiful", "happy", "ok"];
    
    let negScore = 0;
    let posScore = 0;
    
    customerMsgs.forEach(msg => {
      negativeWords.forEach(w => {
        if (msg.includes(w)) negScore++;
      });
      positiveWords.forEach(w => {
        if (msg.includes(w)) posScore++;
      });
    });
    
    if (negScore > posScore) {
      return { label: "Frustrated", color: "bg-rose-100 text-rose-800", emoji: "😡" };
    } else if (posScore > negScore) {
      return { label: "Happy", color: "bg-emerald-100 text-emerald-800", emoji: "😊" };
    }
    return { label: "Neutral", color: "bg-gray-100 text-gray-700", emoji: "😐" };
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.25);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.35);
      }, 120);
    } catch (e) {
      console.warn("AudioContext failed to play chime sound alert:", e);
    }
  };

  useEffect(() => {
    const pendingCount = liveChats.filter(c => c.status === "pending").length;
    if (pendingCount > prevPendingCount) {
      playChime();
    }
    setPrevPendingCount(pendingCount);
  }, [liveChats, prevPendingCount]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch unresolved queries
      const unresolvedSnap = await getDocs(collection(db, "unresolved_queries"));
      const unresolvedList: any[] = [];
      unresolvedSnap.forEach((doc) => {
        const data = doc.data();
        if (!data.resolved) {
          unresolvedList.push({ id: doc.id, ...data });
        }
      });
      // Sort by timestamp desc
      unresolvedList.sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
      });
      setUnresolved(unresolvedList);

      // 2. Fetch learned FAQs
      const faqsSnap = await getDocs(collection(db, "learned_faqs"));
      const faqsList: any[] = [];
      faqsSnap.forEach((doc) => {
        faqsList.push({ id: doc.id, ...doc.data() });
      });
      setFaqs(faqsList);
    } catch (err) {
      console.error("Error fetching assistant data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time live support channels listener
  useEffect(() => {
    let unsubscribe: any;
    if (activeTab === "live") {
      const q = collection(db, "live_chats");
      unsubscribe = onSnapshot(q, (snapshot) => {
        const chats: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.status !== "closed") {
            chats.push({ id: docSnap.id, ...data });
          }
        });
        chats.sort((a, b) => {
          const tA = a.updatedAt?.seconds || 0;
          const tB = b.updatedAt?.seconds || 0;
          return tB - tA;
        });
        setLiveChats(chats);
        
        // Refresh messages of currently active selected chat
        if (selectedChat) {
          const matched = chats.find(c => c.id === selectedChat.id);
          if (matched) {
            setSelectedChat(matched);
          }
        }
      }, (err) => {
        console.error("Live chats snapshot listener failure:", err);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab, selectedChat?.id]);

  const handleSendLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsgText.trim() || !selectedChat) return;

    try {
      const chatRef = doc(db, "live_chats", selectedChat.id);
      const updatedMessages = [
        ...(selectedChat.messages || []),
        { sender: "owner", text: replyMsgText.trim(), timestamp: new Date() }
      ];

      await updateDoc(chatRef, {
        messages: updatedMessages,
        status: "active",
        updatedAt: new Date()
      });

      setReplyMsgText("");
    } catch (err) {
      console.error("Error sending live message from admin:", err);
      alert("Failed to send message.");
    }
  };

  const handleCloseChat = async (id: string) => {
    if (!confirm("Are you sure you want to close this live support session?")) return;
    try {
      await updateDoc(doc(db, "live_chats", id), {
        status: "closed",
        updatedAt: new Date()
      });
      setSelectedChat(null);
    } catch (err) {
      console.error("Error closing chat session:", err);
    }
  };

  const handleSendSpecialLink = async (type: "product_link" | "booking_link", text: string) => {
    if (!selectedChat) return;
    try {
      const chatRef = doc(db, "live_chats", selectedChat.id);
      const updatedMessages = [
        ...(selectedChat.messages || []),
        { sender: "owner", text, type, timestamp: new Date() }
      ];

      await updateDoc(chatRef, {
        messages: updatedMessages,
        status: "active",
        updatedAt: new Date()
      });
    } catch (err) {
      console.error("Error sending special link message:", err);
    }
  };

  // Train bot from an unresolved customer query
  const handleTrainAndResolve = async (id: string, rawQuery: string) => {
    const answer = replyTexts[id];
    if (!answer || !answer.trim()) return;

    try {
      // Generate clean keywords from the raw query
      const cleanKeywords = rawQuery
        .toLowerCase()
        .replace(/[^\w\s,]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 4)
        .join(",");

      // 1. Add to learned FAQs
      await addDoc(collection(db, "learned_faqs"), {
        keywords: cleanKeywords || rawQuery.toLowerCase(),
        answer: answer.trim(),
        createdAt: new Date(),
        trainedFromQuery: rawQuery
      });

      // 2. Mark query as resolved
      await updateDoc(doc(db, "unresolved_queries", id), {
        resolved: true,
        resolvedAt: new Date(),
        answer: answer.trim()
      });

      // Clear text
      setReplyTexts(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      // Refresh lists
      fetchData();
    } catch (err) {
      console.error("Error training bot:", err);
      alert("Failed to train bot.");
    }
  };

  // Delete/Discard an unresolved query without training
  const handleDismissQuery = async (id: string) => {
    try {
      await updateDoc(doc(db, "unresolved_queries", id), {
        resolved: true,
        dismissed: true
      });
      fetchData();
    } catch (err) {
      console.error("Error dismissing query:", err);
    }
  };

  // Delete a trained FAQ
  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bot training?")) return;
    try {
      await deleteDoc(doc(db, "learned_faqs", id));
      fetchData();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
    }
  };

  // Manually create a new FAQ training
  const handleManualCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywords.trim() || !newAnswer.trim()) return;

    try {
      await addDoc(collection(db, "learned_faqs"), {
        keywords: newKeywords.toLowerCase().trim(),
        answer: newAnswer.trim(),
        createdAt: new Date()
      });

      setNewKeywords("");
      setNewAnswer("");
      fetchData();
    } catch (err) {
      console.error("Error adding custom FAQ:", err);
      alert("Failed to add training.");
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const kMatch = faq.keywords?.toLowerCase().includes(searchTerm.toLowerCase());
    const aMatch = faq.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    return kMatch || aMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview stats header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6 rounded-3xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <FiCpu className="text-white animate-pulse" /> AI Assistant Training Dashboard
          </h2>
          <p className="text-xs text-pink-100 mt-1">
            Toggle between live customer chat support and bot NLP question training/teach modes.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "live"
                ? "bg-white text-pink-600 shadow-sm"
                : "bg-pink-600 hover:bg-pink-700 text-white border border-pink-400"
            }`}
          >
            <FiMessageSquare /> Live Chat Support ({liveChats.filter(c => c.status === "pending").length} New)
          </button>
          <button
            onClick={() => setActiveTab("teach")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "teach"
                ? "bg-white text-pink-600 shadow-sm"
                : "bg-pink-600 hover:bg-pink-700 text-white border border-pink-400"
            }`}
          >
            <FiCpu /> Teach Bot ({unresolved.length} pending)
          </button>
        </div>
      </div>

      {activeTab === "live" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
          {/* Left Column: Active Chat sessions */}
          <div className="lg:col-span-4 border-r border-gray-100 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 font-serif flex items-center gap-1.5">
                <FiActivity className="text-pink-500" /> Active Customers
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Real-time chats waiting for help.</p>
            </div>
            
            {liveChats.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                🌱 No active live support chats.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[450px] custom-scrollbar pr-1">
                {liveChats.map(c => {
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  const needsReply = lastMsg && lastMsg.sender === "user";
                  const isSelected = selectedChat?.id === c.id;
                  const sentiment = calculateSentiment(c.messages);
                  
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChat(c)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? "bg-pink-50 border-pink-200"
                          : "bg-gray-50/50 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0 flex-grow">
                        <span className="text-xs font-bold text-gray-700 block truncate">
                          👤 {c.customerName || "Guest User"}
                        </span>
                        <div className="flex gap-1.5 items-center mt-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${sentiment.color}`}>
                            {sentiment.emoji} {sentiment.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-1">
                          {lastMsg ? lastMsg.text : "No messages yet"}
                        </p>
                      </div>
                      {needsReply ? (
                        <span className="bg-pink-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0 animate-pulse">
                          Pending
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">
                          Replied
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Chat Box */}
          <div className="lg:col-span-8 flex flex-col h-[520px]">
            {selectedChat ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">
                      Chatting with: **{selectedChat.customerName || "Guest"}**
                    </h4>
                    {selectedChat.phone && (
                      <p className="text-[9px] text-gray-400 mt-0.5">📞 +91 {selectedChat.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCloseChat(selectedChat.id)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-red-600 rounded-xl text-[10px] font-bold transition-all"
                  >
                    Close Live Session
                  </button>
                </div>

                {/* Messages Log */}
                <div className="flex-grow p-4 overflow-y-auto bg-pink-50/10 space-y-3 custom-scrollbar flex flex-col">
                  {selectedChat.messages?.map((msg: any, idx: number) => {
                    const isOwner = msg.sender === "owner";
                    return (
                      <div
                        key={idx}
                        className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                            isOwner
                              ? "bg-pink-600 text-white rounded-tr-none border-pink-700"
                              : "bg-white text-gray-700 rounded-tl-none border-gray-200"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Canned Quick Replies */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30 flex flex-wrap gap-2 items-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quick Answers:</span>
                  {[
                    { label: "🏠 Location & Visit", text: "We are based in Agra! We provide home services across Agra (Sanjay Place, Tajganj, Kamla Nagar, Dayalbagh, Shahganj). Visit charges are ₹200 for Agra." },
                    { label: "🌸 Bridal Pricing", text: "Our Bridal packages range from ₹3,100 to ₹11,000. It includes premium organic henna, custom matching designs, and free stain optimization sprays." },
                    { label: "🔮 Stain Care", text: "To get a deep dark mahogany stain: Keep paste on for 6-8 hours, scrap with mustard/coconut oil (no water for 24 hours), and take warm clove steam." },
                    { label: "🛍️ Cone Quality", text: "Our cones are 100% organic, hand-rolled with Rajasthani Sojat leaves, Eucalyptus oil, and Cloves. Safe for skin, kids, and pregnant ladies!" }
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplyMsgText(tpl.text)}
                      className="px-2 py-1 bg-white hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-lg text-[9px] font-semibold text-gray-600 transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}

                  {/* Push interactive links directly into customer screen */}
                  <div className="flex gap-1.5 ml-auto border-l border-gray-200 pl-2">
                    <button
                      type="button"
                      onClick={() => handleSendSpecialLink("product_link", "Here is a quick link to purchase our Organic Henna Cones!")}
                      className="px-2 py-1 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg text-[9px] font-bold text-pink-700 transition-colors"
                    >
                      🛍️ Cones Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSpecialLink("booking_link", "Click below to select packages and book your slot directly!")}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[9px] font-bold text-rose-700 transition-colors"
                    >
                      📅 Booking Link
                    </button>
                  </div>
                </div>

                {/* Reply textbox */}
                <form onSubmit={handleSendLiveMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={replyMsgText}
                    onChange={(e) => setReplyMsgText(e.target.value)}
                    placeholder="Type live response to customer..."
                    className="flex-grow px-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl transition-all shadow-md shadow-pink-600/10 flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <FiSend /> Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/20">
                <FiMessageSquare size={36} className="text-pink-300 animate-bounce" />
                <h4 className="font-bold text-gray-700 mt-3 text-sm">Real-time Support Desk</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Select an active customer query from the sidebar to engage in live support.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Pending Customer Queries */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 font-serif flex items-center gap-2 mb-4">
                <FiAlertCircle className="text-rose-500" /> Unresolved Customer Queries
              </h3>
              
              {unresolved.length === 0 ? (
                <div className="text-center py-10 bg-pink-50/20 rounded-2xl border border-dashed border-pink-100 p-6">
                  <span className="text-3xl">🎉</span>
                  <h4 className="font-bold text-gray-700 mt-2 text-sm">All queries resolved!</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    The AI assistant understands all recent customer questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {unresolved.map((q) => (
                    <div key={q.id} className="p-4 bg-pink-50/25 rounded-2xl border border-pink-100/50 space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Customer Question
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {q.timestamp ? new Date(q.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-gray-800 italic bg-white p-3 rounded-xl border border-pink-100/30">
                        &quot;{q.query}&quot;
                      </p>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                          Teach Bot response:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyTexts[q.id] || ""}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Type the answer response here..."
                            className="flex-grow px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-pink-500"
                          />
                          <button
                            onClick={() => handleTrainAndResolve(q.id, q.query)}
                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <FiCheck /> Train
                          </button>
                          <button
                            onClick={() => handleDismissQuery(q.id)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all"
                            title="Discard / Dismiss Query"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Manage Bot Knowledge (FAQs) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Manual Training Form */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-800 font-serif flex items-center gap-2">
                  <FiPlus className="text-pink-500" /> Teach Custom Knowledge
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Manually link keyword matches to custom responses.</p>
              </div>

              <form onSubmit={handleManualCreateFaq} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Trigger Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="e.g. discount, offer, sale, cheap"
                    className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-pink-500 focus:bg-white outline-none transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    AI Response Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Type the detailed response..."
                    className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-pink-500 focus:bg-white outline-none transition-all text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FiPlus size={14} /> Add Training FAQ
                </button>
              </form>
            </div>

            {/* Current FAQ List */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-gray-800 font-serif flex items-center gap-2">
                    <FiHelpCircle className="text-pink-500" /> Active Bot Knowledge
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">Currently learned dynamic responses.</p>
                </div>
              </div>

              {/* Search filter */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search active knowledge..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-pink-500 focus:bg-white outline-none transition-all text-[11px] font-medium"
              />

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredFaqs.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">No matching trained FAQ found.</p>
                ) : (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50 space-y-2 relative group">
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Training"
                      >
                        <FiTrash2 size={13} />
                      </button>
                      
                      <div className="pr-6">
                        <span className="block text-[10px] font-bold text-pink-600 uppercase tracking-wide">
                          Keywords: {faq.keywords}
                        </span>
                        <p className="text-[11px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic Bot Greeting Customizer Settings Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-800 font-serif flex items-center gap-2">
                  <FiCpu className="text-pink-500" /> Assistant Settings
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Configure bot welcome greeting text.</p>
              </div>

              <form onSubmit={handleSaveGreeting} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Bot Welcome Greeting Text
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={greetingText}
                    onChange={(e) => setGreetingText(e.target.value)}
                    placeholder="e.g. Namaste! Welcome to Jyoti Mehendi..."
                    className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-pink-500 focus:bg-white outline-none transition-all text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Today's Bookings Count
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={todayBookingsCount}
                    onChange={(e) => setTodayBookingsCount(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-pink-500 focus:bg-white outline-none transition-all text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  Save Settings
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
