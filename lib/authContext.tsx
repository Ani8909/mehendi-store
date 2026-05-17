import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

          // Create new user record
          const isAdminEmail = currentUser.email === "anuj@jyotimhendi.in" || currentUser.email === "singhani5549@gmail.com";
          const newUserData = {
            uid: currentUser.uid,
            name: partnerName || (isAdminEmail ? "Jyoti Admin" : ""),
            phone: currentUser.phoneNumber || "",
            email: currentUser.email || "",
            role: isAdminEmail ? "admin" : (isPartner ? "partner" : "customer"),
            createdAt: new Date(),
          };
          await setDoc(userDocRef, newUserData);
          setUserData(newUserData);
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
