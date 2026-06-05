import sys

filepath = r"c:\Users\shubh\OneDrive\Desktop\mhendi store\pages\booking.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Run all basic replacements that worked perfectly previously
content = content.replace(
    'import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";',
    'import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";'
)
content = content.replace(
    'import { db, storage } from "@/lib/firebase";',
    'import { auth, db, storage } from "@/lib/firebase";\nimport { createUserWithEmailAndPassword } from "firebase/auth";'
)

if 'setReferralInput' not in content:
    content = content.replace(
        'const [verifyingCoupon, setVerifyingCoupon] = useState(false);',
        'const [verifyingCoupon, setVerifyingCoupon] = useState(false);\n  const [applyWallet, setApplyWallet] = useState(false);\n  const [referralInput, setReferralInput] = useState("");\n  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);\n  const [referralError, setReferralError] = useState("");\n  const [verifyingReferral, setVerifyingReferral] = useState(false);\n  const [referralDiscountAmount, setReferralDiscountAmount] = useState(0);'
    )

import re

content = re.sub(
    r'phone:\s*userData\?\.phone \|\| user\?\.phoneNumber \|\| "",\r?\n\s*address:\s*userData\?\.address \|\| "",',
    'phone: userData?.phone || user?.phoneNumber || "",\n      email: userData?.email || user?.email || "",\n      password: "",\n      address: userData?.address || "",',
    content
)

content = re.sub(
    r'setIsReturningCustomer\(retDiscount > 0\);\r?\n\s*setLoading\(false\);\r?\n\s*\}\r?\n\s*\}, \[user, userData\]\);',
    'setIsReturningCustomer(retDiscount > 0);\n      \n      setLoading(false);\n      \n      // Auto-apply referral if from URL\n      if (typeof window !== "undefined" && !userData?.isReferralClaimed) {\n        const urlParams = new URLSearchParams(window.location.search);\n        const ref = urlParams.get("ref");\n        if (ref) {\n          setReferralInput(ref.toUpperCase());\n        }\n      }\n    }\n  }, [user, userData]);',
    content
)

content = re.sub(
    r'if \(finalPrice < 0\) finalPrice = 0;',
    'if (finalPrice < 0) finalPrice = 0;\n\n  let walletDeduction = 0;\n  if (applyWallet && userData?.walletBalance > 0) {\n    walletDeduction = Math.min(finalPrice, userData.walletBalance);\n    finalPrice -= walletDeduction;\n  }',
    content
)

if 'applyReferralCode = async' not in content:
    apply_ref_func = """
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

  const onSubmit = async (data: any) => {"""
    content = content.replace('const onSubmit = async (data: any) => {', apply_ref_func)

if 'finalCustomerId = userCredential.user.uid' not in content:
    booking_replacement = """    // Final Step - Create Booking (Bypassing Razorpay for offline payments)
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
            alert("This email is already registered. Please log in first to book.");
          } else {
            alert("Failed to create account: " + authErr.message);
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

      const bRef = "JM-" + Math.random().toString(36).substring(2, 8).toUpperCase();"""
    content = re.sub(
        r'    // Final Step - Create Booking \(Bypassing Razorpay for offline payments\)\r?\n\s*setLoading\(true\);\r?\n\s*try \{\r?\n\s*const bRef = "JM-" \+ Math\.random\(\)\.toString\(36\)\.substring\(2, 8\)\.toUpperCase\(\);',
        booking_replacement,
        content
    )

if 'referralDiscountAmount' not in content:
    booking_data_replace = """        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount,
        returningDiscount: returningDiscount,
        referralDiscount: referralDiscountAmount,
        walletDeduction: walletDeduction,
        isPackage: !!data.packageName,"""
    content = re.sub(
        r'        couponCode: appliedCoupon\?\.code \|\| null,\r?\n\s*couponDiscount: couponDiscount,\r?\n\s*returningDiscount: returningDiscount,\r?\n\s*isPackage: !!data\.packageName,',
        booking_data_replace,
        content
    )
    content = content.replace('customerId: user?.uid || "guest",', 'customerId: finalCustomerId,')

if 'finalWalletBalance - walletDeduction' not in content:
    after_booking_insert = """      const docRef = await addDoc(collection(db, "bookings"), bookingData);

      // Deduct wallet balance
      if (walletDeduction > 0 && finalCustomerId !== "guest") {
        await updateDoc(doc(db, "users", finalCustomerId), {
          walletBalance: finalWalletBalance - walletDeduction
        });
      }
      
      // Send Email Notification"""
    content = re.sub(
        r'      const docRef = await addDoc\(collection\(db, "bookings"\), bookingData\);\r?\n\s*// Send Email Notification',
        after_booking_insert,
        content
    )
    content = content.replace('email: user?.email || ""', 'email: finalUserEmail')
    content = re.sub(
        r'router\.push\(`/booking-slip/\$\{docRef\.id\}`\);',
        'router.push(`/dashboard?bookingSuccess=true`);',
        content
    )


# 10. Step 3 UI
if 'Create Password' not in content:
    email_ui = """                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="your@email.com" 
                          {...register("email", { 
                            required: "Email is required",
                            pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: "Please enter a valid email address" }
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><FiMapPin className="mr-1 text-[var(--color-primary)]"/> Complete Address (Agra Only)</label>"""
    content = re.sub(
        r'                      <div>\r?\n\s*<label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><FiMapPin className="mr-1 text-\[var\(--color-primary\)\]"/> Complete Address \(Agra Only\)</label>',
        email_ui,
        content
    )


# Now for the specific part that failed:

# Wallet display
wallet_ui = """                        {/* Referral Display */}
                        {appliedReferral && (
                          <div className="flex justify-between items-center text-green-600">
                            <span className="font-medium text-xs">Referral Applied ({appliedReferral})</span>
                            <span className="font-bold text-sm">Reward Unlocked!</span>
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
                          <span className="text-gray-800 font-bold">Final Amount</span>"""

if "Use Wallet Balance" not in content:
    idx = content.find('                        <div className="pt-3 mt-3 border-t border-pink-200 flex justify-between items-center">\n                          <span className="text-gray-800 font-bold">Final Amount</span>')
    if idx == -1:
        # Fallback to look with \r\n
        idx = content.find('                        <div className="pt-3 mt-3 border-t border-pink-200 flex justify-between items-center">\r\n                          <span className="text-gray-800 font-bold">Final Amount</span>')
        
    if idx != -1:
        target = content[idx:idx+200].split('</span>')[0] + '</span>'
        content = content.replace(target, wallet_ui)


referral_ui = """                    {/* Coupon Input Area */}
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
                    </div>"""

if "Have a Referral Code?" not in content:
    start_str = '                    {/* Coupon Input Area */}'
    end_str = 'Coupon applied successfully!</p>\n                    </div>'
    
    idx_start = content.find(start_str)
    if idx_start != -1:
        idx_end = content.find(end_str, idx_start)
        if idx_end == -1:
             end_str = 'Coupon applied successfully!</p>\r\n                    </div>'
             idx_end = content.find(end_str, idx_start)
             
        if idx_end != -1:
            target = content[idx_start:idx_end + len(end_str)]
            content = content.replace(target, referral_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
