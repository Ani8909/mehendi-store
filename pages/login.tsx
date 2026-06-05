import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { FiCheckCircle, FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "ADMIN" | "FORGOT_PASSWORD" | "LOGIN_OTP">("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"DETAILS" | "OTP">("DETAILS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { user, userData } = useAuth();
  const router = useRouter();

  const getFriendlyErrorMessage = (err: any) => {
    const code = err.code || "";
    const message = err.message || "";

    if (code === "auth/invalid-credential" || message.includes("auth/invalid-credential")) {
      return "Invalid email or password. If you haven't created an account yet, please Sign Up first.";
    }
    if (code === "auth/user-not-found") return "No account found with this email. Please sign up.";
    if (code === "auth/wrong-password") return "Incorrect password. Please try again.";
    if (code === "auth/email-already-in-use") return "This email is already registered. Please login instead.";
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    if (code === "auth/network-request-failed") return "Network error. Please check your internet connection.";
    
    return message || "Authentication failed. Please try again.";
  };

  useEffect(() => {
    if (user && userData && authMode !== "FORGOT_PASSWORD") {
      if (userData.role === "admin") router.push("/admin");
      else if (userData.role === "partner") router.push("/partner");
      else router.push("/dashboard");
    }
  }, [user, userData, router, authMode]);

  // Check URL query parameters for special modes
  useEffect(() => {
    if (router.isReady) {
      const mode = router.query.mode;
      if (mode === "admin" || router.query.admin === "true") {
        setAuthMode("ADMIN");
      }
    }
  }, [router.isReady, router.query]);

  // Handle Initial Form Submit (Login, Signup Request, or Forgot Password Request)
  const onSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (authMode === "ADMIN" || authMode === "LOGIN") {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth context handles redirection
      } 
      else if (authMode === "SIGNUP") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        
        // 1. Create account in Firebase Auth directly (OTP bypassed for now)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Setup User Profile & Check Partner Invites
        const userDocRef = doc(db, "users", userCredential.user.uid);
        let isPartner = false;
        let partnerArea = "";

        // Check for partner invites by email
        const inviteRef = doc(db, "partner_invites", email.toLowerCase().trim());
        const inviteDoc = await getDoc(inviteRef);
        
        if (inviteDoc.exists() && inviteDoc.data().status === "pending") {
          isPartner = true;
          partnerArea = inviteDoc.data().area || "";
          
          await setDoc(inviteRef, { ...inviteDoc.data(), status: "claimed" }, { merge: true });
          
          await setDoc(doc(db, "partners", userCredential.user.uid), {
            name: name,
            email: email,
            area: partnerArea,
            isAvailable: true,
            earnings: 0,
            completedJobs: 0
          }, { merge: true });
        }

        // Check URL for referral code
        let referredBy = null;
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          referredBy = urlParams.get("ref");
        }

        // Generate referral code
        const baseName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const referralCode = `${baseName}-${randomStr}`;

        const newUserData = {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: isPartner ? "partner" : "customer",
          createdAt: new Date(),
          referralCode: referralCode,
          walletBalance: 0,
          pendingWalletBalance: 0,
          referredBy: referredBy || null,
          isReferralClaimed: false,
        };

        await setDoc(userDocRef, newUserData, { merge: true });

        // Process Referral Reward if referred
        if (referredBy) {
          try {
            const settingsSnap = await getDoc(doc(db, "settings", "referral"));
            if (settingsSnap.exists() && settingsSnap.data().isActive) {
              const settingsData = settingsSnap.data();
              
              // Give the new user their welcome discount in their wallet
              await updateDoc(userDocRef, {
                walletBalance: settingsData.refereeDiscount || 50
              });

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

        setSuccess("Account created successfully!");
      }
      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "login" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setStep("OTP");
      }
      else if (authMode === "FORGOT_PASSWORD") {
        // Send OTP via our API
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type: "reset" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setStep("OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Submission (For Signup or Password Reset)
  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authMode === "SIGNUP") {
        // 1. Verify OTP
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // 2. OTP is valid, create account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Setup User Profile & Check Partner Invites
        const userDocRef = doc(db, "users", userCredential.user.uid);
        let isPartner = false;
        let partnerArea = "";

        // We previously used phoneNum for partner invites. If they signed up with email, 
        // we should ideally invite them by email now. Let's check by email.
        const inviteRef = doc(db, "partner_invites", email);
        const inviteDoc = await getDoc(inviteRef);
        
        if (inviteDoc.exists() && inviteDoc.data().status === "pending") {
          isPartner = true;
          partnerArea = inviteDoc.data().area || "";
          
          await setDoc(inviteRef, { ...inviteDoc.data(), status: "claimed" }, { merge: true });
          
          await setDoc(doc(db, "partners", userCredential.user.uid), {
            name: name,
            email: email, // Changed from phone to email
            area: partnerArea,
            isAvailable: true,
            earnings: 0,
            completedJobs: 0
          }, { merge: true });
        }

        // Check URL for referral code
        let referredBy = null;
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          referredBy = urlParams.get("ref");
        }

        // Generate referral code
        const baseName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const referralCode = `${baseName}-${randomStr}`;

        const newUserData = {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: isPartner ? "partner" : "customer",
          createdAt: new Date(),
          referralCode: referralCode,
          walletBalance: 0,
          pendingWalletBalance: 0,
          referredBy: referredBy || null,
          isReferralClaimed: false,
        };

        await setDoc(userDocRef, newUserData, { merge: true });

        // Process Referral Reward if referred
        if (referredBy) {
          try {
            const settingsSnap = await getDoc(doc(db, "settings", "referral"));
            if (settingsSnap.exists() && settingsSnap.data().isActive) {
              const settingsData = settingsSnap.data();

              // Give the new user their welcome discount in their wallet
              await updateDoc(userDocRef, {
                walletBalance: settingsData.refereeDiscount || 50
              });

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

      } 
      else if (authMode === "LOGIN_OTP") {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Sign in with Custom Token
        await signInWithCustomToken(auth, data.token);
      }
      else if (authMode === "FORGOT_PASSWORD") {
        if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
        
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSuccess("Password reset successfully! You can now login.");
        setAuthMode("LOGIN");
        setStep("DETAILS");
        setOtp("");
        setPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Jyoti Mehendi Artist</title>
      </Head>

      <div className="min-h-[80vh] flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-8 text-center text-white relative">
            <h2 className="text-3xl font-serif font-bold mb-2">
              {authMode === "ADMIN" ? "Admin Login" 
              : authMode === "SIGNUP" ? "Create Account" 
              : authMode === "FORGOT_PASSWORD" ? "Reset Password"
              : "Welcome Back"}
            </h2>
            <p className="text-white/90">
              {authMode === "ADMIN" ? "Restricted access for store management" 
              : authMode === "FORGOT_PASSWORD" ? "We'll send an OTP to your email"
              : "Sign in to book your mehndi appointment"}
            </p>
            
            {/* Toggle Tabs */}
            {authMode !== "FORGOT_PASSWORD" && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex bg-white rounded-full shadow-md p-1 border border-pink-100 w-[90%] max-w-[240px]">
                <button 
                  type="button"
                  onClick={() => { setAuthMode("LOGIN"); setStep("DETAILS"); setError(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${authMode === "LOGIN" || authMode === "ADMIN" ? "bg-[var(--color-primary)] text-white" : "text-gray-500"}`}
                >
                  Login
                </button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setStep("DETAILS"); setError(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${authMode === "SIGNUP" ? "bg-[var(--color-primary)] text-white" : "text-gray-500"}`}
                >
                  Sign Up
                </button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode("LOGIN_OTP"); setStep("DETAILS"); setError(""); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${authMode === "LOGIN_OTP" ? "bg-pink-500 text-white" : "text-gray-500"}`}
                >
                  Email OTP
                </button>
              </div>
            )}
          </div>

          <div className={`p-8 ${authMode !== "FORGOT_PASSWORD" ? "pt-12" : "pt-8"}`}>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100 text-center font-bold">
                {success}
              </div>
            )}

            {step === "DETAILS" ? (
              <form onSubmit={onSubmitDetails} className="space-y-4">
                {authMode === "SIGNUP" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50))}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                        placeholder="Your Name"
                        required={authMode === "SIGNUP"}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {authMode !== "FORGOT_PASSWORD" && authMode !== "LOGIN_OTP" && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      {authMode === "LOGIN" && (
                        <button type="button" onClick={() => setAuthMode("FORGOT_PASSWORD")} className="text-xs text-[var(--color-primary)] hover:underline font-bold">
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                        placeholder="••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition-colors disabled:opacity-70 mt-2 flex justify-center items-center space-x-2 ${authMode === "ADMIN" ? "bg-gray-800 hover:bg-black" : "bg-[var(--color-primary)] hover:bg-[var(--color-header)]"}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Please wait...</span>
                    </>
                  ) : authMode === "LOGIN" || authMode === "ADMIN" ? "Login to Dashboard" 
                    : authMode === "FORGOT_PASSWORD" ? "Send Reset OTP" 
                    : authMode === "LOGIN_OTP" ? "Send Login OTP"
                    : "Create Account"}
                </button>

                {authMode === "FORGOT_PASSWORD" && (
                  <button type="button" onClick={() => setAuthMode("LOGIN")} className="w-full text-sm text-gray-400 hover:text-[var(--color-primary)] text-center mt-4">
                    Back to Login
                  </button>
                )}

                {authMode !== "ADMIN" && authMode !== "FORGOT_PASSWORD" && (
                  <>
                    <div className="relative flex items-center justify-center my-6">
                      <div className="absolute border-t border-gray-200 w-full"></div>
                      <div className="bg-white px-4 relative text-sm text-gray-500 font-medium uppercase tracking-wider">OR</div>
                    </div>

                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      disabled={loading}
                      className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center space-x-2"
                    >
                      <FcGoogle size={22} />
                      <span>{authMode === "SIGNUP" ? "Sign up with Google" : "Login with Google"}</span>
                    </button>

                    <div className="text-center pt-6 mt-4 border-t border-gray-100 text-xs text-gray-500">
                      Are you a Mehndi Artist?{" "}
                      <Link href="/partner-register" className="text-[var(--color-primary)] font-bold hover:underline">
                        Join as a Partner
                      </Link>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={onOtpSubmit} className="space-y-6">
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle size={32} />
                  </div>
                  <p className="text-gray-600 text-sm">OTP sent to <span className="font-bold">{email}</span></p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full text-center text-3xl font-bold tracking-[0.5em] py-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                    placeholder="000000"
                    required
                  />
                </div>

                {authMode === "FORGOT_PASSWORD" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Create New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-[var(--color-primary)]"
                        placeholder="••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || (authMode === "FORGOT_PASSWORD" && newPassword.length < 6)}
                  className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-md hover:bg-[var(--color-header)] transition-colors flex justify-center items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : authMode === "FORGOT_PASSWORD" ? "Verify & Reset Password" : "Verify & Create Account"}
                </button>
                <button type="button" onClick={() => setStep("DETAILS")} className="w-full text-sm text-gray-400 hover:text-[var(--color-primary)]">Change email</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
