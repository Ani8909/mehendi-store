import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch or create user document in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            let currentData = userDoc.data();
            const isAdminEmail = currentUser.email === "anuj@jyotimhendi.in" || currentUser.email === "singhani5549@gmail.com";
            if (isAdminEmail && currentData.role !== "admin") {
              await setDoc(userDocRef, { ...currentData, role: "admin" }, { merge: true });
              currentData.role = "admin";
            }
            setUserData(currentData);
          } else {
            // Check for partner invites (using email primarily now)
            let isPartner = false;
            let partnerArea = "";
            let partnerName = currentUser.displayName || "";
            const identifier = currentUser.email || currentUser.phoneNumber;
            
            if (identifier) {
              const inviteRef = doc(db, "partner_invites", identifier);
              const inviteDoc = await getDoc(inviteRef);
              
              if (inviteDoc.exists() && inviteDoc.data().status === "pending") {
                isPartner = true;
                partnerArea = inviteDoc.data().area || "";
                partnerName = inviteDoc.data().name || partnerName;
                
                // Mark invite as claimed
                await setDoc(inviteRef, { ...inviteDoc.data(), status: "claimed" }, { merge: true });
                
                // Add to actual partners collection
                await setDoc(doc(db, "partners", currentUser.uid), {
                  name: partnerName,
                  email: currentUser.email || "",
                  phone: currentUser.phoneNumber || "",
                  area: partnerArea,
                  isAvailable: true,
                  earnings: 0,
                  completedJobs: 0
                }, { merge: true });
              }
            }

            // Check URL for referral code (assuming they came from a referral link and logged in with Google)
            let referredBy = null;
            if (typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              referredBy = urlParams.get("ref");
            }

            // Generate referral code
            const baseName = (partnerName || "USER").replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            const referralCode = `${baseName}-${randomStr}`;

            const isAdminEmail = currentUser.email === "anuj@jyotimhendi.in" || currentUser.email === "singhani5549@gmail.com";
            const newUserData = {
              uid: currentUser.uid,
              name: partnerName || (isAdminEmail ? "Jyoti Admin" : ""),
              phone: currentUser.phoneNumber || "",
              email: currentUser.email || "",
              role: isAdminEmail ? "admin" : (isPartner ? "partner" : "customer"),
              createdAt: new Date(),
              referralCode: isAdminEmail ? "ADMIN" : referralCode,
              walletBalance: 0,
              pendingWalletBalance: 0,
              referredBy: referredBy || null,
              isReferralClaimed: false,
            };
            
            await setDoc(userDocRef, newUserData);
            
            // Process Referral Reward if referred
            if (referredBy) {
              try {
                // Get referral settings
                const settingsSnap = await getDoc(doc(db, "settings", "referral"));
                if (settingsSnap.exists() && settingsSnap.data().isActive) {
                  const settingsData = settingsSnap.data();
                  
                  // Give the new user their welcome discount in their wallet
                  await updateDoc(userDocRef, {
                    walletBalance: settingsData.refereeDiscount || 50
                  });
                  
                  // Find referrer
                  const usersRef = collection(db, "users");
                  const q = query(usersRef, where("referralCode", "==", referredBy));
                  const querySnapshot = await getDocs(q);
                  
                  if (!querySnapshot.empty) {
                    const referrerDoc = querySnapshot.docs[0];
                    const referrerData = referrerDoc.data();
                    
                    // Add reward to referrer's pending balance
                    await updateDoc(doc(db, "users", referrerDoc.id), {
                      pendingWalletBalance: (referrerData.pendingWalletBalance || 0) + (settingsData.referrerReward || 100)
                    });
                  }
                }
              } catch (err) {
                console.error("Error processing referral:", err);
              }
            }
            
            setUserData(newUserData);
          }
        } catch (err) {
          console.error("Error fetching user data from Firestore (offline?):", err);
          // Fallback user data if offline
          const isAdminEmail = currentUser.email === "anuj@jyotimhendi.in" || currentUser.email === "singhani5549@gmail.com";
          setUserData({
            uid: currentUser.uid,
            name: currentUser.displayName || (isAdminEmail ? "Jyoti Admin" : "User"),
            email: currentUser.email || "",
            role: isAdminEmail ? "admin" : "customer",
            isOffline: true
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
