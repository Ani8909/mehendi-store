import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiAward, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerRegister() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [password, setPassword] = useState("");
  
  // Real-time fetched invite data
  const [inviteData, setInviteData] = useState<{ name: string; area: string } | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { user, userData } = useAuth();
  const router = useRouter();

  const getFriendlyErrorMessage = (err: any) => {
    const code = err.code || "";
    const message = err.message || "";

    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Please Login instead.";
    }
    if (code === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    }
    return message || "Registration failed. Please try again.";
  };

  useEffect(() => {
    if (user && userData) {
      if (userData.role === "partner") {
        router.push("/partner");
      } else if (userData.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, userData, router]);

  // Check invitation in Firestore
  const verifyInvitation = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }

    setCheckingInvite(true);
    setError("");
    setInviteData(null);
    setInviteChecked(false);

    try {
      const emailLower = email.toLowerCase().trim();
      const inviteRef = doc(db, "partner_invites", emailLower);
      const inviteSnap = await getDoc(inviteRef);

      if (inviteSnap.exists()) {
        const data = inviteSnap.data();
        if (data.status === "pending") {
          setInviteData({
            name: data.name || "Mehndi Artist",
            area: data.area || "Agra"
          });
          setInviteChecked(true);
        } else {
          setError("This invitation has already been claimed. Please log in.");
        }
      } else {
        setError("This email has not been invited by the admin yet. Please contact support@jyotimehendi.in.");
      }
    } catch (err) {
      console.error(err);
      setError("Error checking invitation. Please try again.");
    } finally {
      setCheckingInvite(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!inviteChecked || !inviteData) {
      setLoading(false);
      return setError("Please verify your email invitation first.");
    }
    if (phone.length !== 10) {
      setLoading(false);
      return setError("Please enter a valid 10-digit mobile number");
    }
    if (password.length < 6) {
      setLoading(false);
      return setError("Password must be at least 6 characters");
    }

    try {
      const emailLower = email.toLowerCase().trim();

      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
      const uid = userCredential.user.uid;

      // 2. Add to partners collection using Admin's Name and Operational Area
      await setDoc(doc(db, "partners", uid), {
        id: uid,
        name: inviteData.name,
        email: emailLower,
        phone: phone,
        area: inviteData.area,
        experience: Number(experience) || 0,
        isAvailable: true,
        earnings: 0,
        completedJobs: 0,
        rating: 5.0,
        joinedAt: new Date()
      });

      // 3. Add to main users collection as 'partner' role
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        name: inviteData.name,
        email: emailLower,
        phone: phone,
        role: "partner",
        createdAt: new Date(),
      });

      // 4. Update invite status to claimed
      await setDoc(doc(db, "partner_invites", emailLower), {
        status: "claimed",
        claimedAt: new Date()
      }, { merge: true });

      setSuccess("Account claimed successfully! Welcome to the Team!");
      
      setTimeout(() => {
        router.push("/partner");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Claim Partner Account | Jyoti Mehendi Artist</title>
      </Head>

      <div className="min-h-[90vh] flex items-center justify-center bg-pink-50/20 px-4 py-16 relative overflow-hidden">
        {/* Background Graphic Accents */}
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-pink-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-amber-100 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-pink-100/30 relative z-10"
        >
          {/* Top Brand Banner */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-pink-600 p-8 text-center text-white relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-15 mix-blend-overlay"></div>
            <h2 className="text-3xl font-serif font-bold mb-2 relative z-10">Partner Portal</h2>
            <p className="text-pink-100 text-sm relative z-10">Claim the partner invitation created by your administrator</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 text-red-500 p-3.5 rounded-xl text-sm mb-6 border border-red-100 text-center font-semibold flex items-center justify-center space-x-2">
                <FiAlertCircle className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3.5 rounded-xl text-sm mb-6 border border-green-100 text-center font-extrabold flex items-center justify-center space-x-2">
                <FiCheckCircle className="flex-shrink-0 text-lg" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Address Verification Block */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Invited Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setInviteChecked(false);
                        setInviteData(null);
                      }}
                      disabled={inviteChecked || loading}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-[var(--color-primary)] text-sm"
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  {!inviteChecked && (
                    <button
                      onClick={() => verifyInvitation()}
                      disabled={checkingInvite || !email}
                      className="bg-[var(--color-primary)] hover:bg-pink-700 text-white font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center space-x-1"
                    >
                      {checkingInvite ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Verify"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Revealed Invitation details */}
              <AnimatePresence>
                {inviteChecked && inviteData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-start space-x-3">
                      <FiCheckCircle className="text-green-500 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-green-700 uppercase tracking-widest">Active Invitation Verified</p>
                        <p className="text-xs text-green-600 mt-1 font-medium">This email is invited to claim their workspace.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name - Prefilled & Frozen */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Full Name (Set by Admin)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FiUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={inviteData.name}
                            disabled
                            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                          />
                        </div>
                      </div>

                      {/* Operational Area - Prefilled & Frozen */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Operational Area (Set by Admin)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FiMapPin className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={inviteData.area}
                            disabled
                            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Completion Form */}
                    <form onSubmit={handleRegister} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mobile Number */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Mobile Number</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <FiPhone className="text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={handlePhoneChange}
                              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-[var(--color-primary)] text-sm"
                              placeholder="9876543210"
                              required
                            />
                          </div>
                        </div>

                        {/* Experience */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Experience (Years)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <FiAward className="text-gray-400" />
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={40}
                              value={experience}
                              onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))}
                              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-[var(--color-primary)] text-sm"
                              placeholder="e.g. 5"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Create Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FiLock className="text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-[var(--color-primary)] text-sm"
                            placeholder="••••••"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--color-primary)] hover:bg-pink-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors disabled:opacity-70 mt-4 flex justify-center items-center space-x-2 text-sm uppercase tracking-wider"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <span>Register & Claim Account</span>
                            <FiArrowRight />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-500">
                Already claimed your workspace?{" "}
                <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
                  Log In Here
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
