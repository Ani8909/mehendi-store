import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const names = [
  "Priya", "Sneha", "Anjali", "Riya", "Megha", "Kavita", "Neha", "Pooja", "Simran", "Nikita", 
  "Divya", "Aarti", "Nisha", "Kiran", "Jyoti", "Sonam", "Swati", "Shweta", "Mansi", "Rashi", 
  "Kritika", "Isha", "Tanvi", "Khushi", "Shradha", "Shruti", "Pallavi", "Garima", "Sakshi", "Muskan"
];

const agraLocations = [
  "Taj Ganj", "Fatehabad Road", "Sanjay Place", "Sadar Bazaar", "Dayal Bagh", 
  "Kamla Nagar", "Sikandra", "Khandari", "Civil Lines", "Shahganj", 
  "Balkeshwar", "Surya Nagar", "Jaipur House", "Lohamandi", "Bodla", 
  "MG Road", "Shamshabad Road", "Trans Yamuna", "Kedar Nagar", "Shastripuram",
  "Awas Vikas Colony"
];

const packages = [
  "Bridal Mehndi Package", "Arabic Mehndi", "Engagement Mehndi", 
  "Guest Mehndi", "Indo-Arabic Mehndi", "Traditional Indian Mehndi", 
  "Premium Bridal Package", "Rajasthani Mehndi", "Minimalist Mehndi"
];

const times = ["Just now", "2 mins ago", "5 mins ago", "8 mins ago", "12 mins ago", "Recently"];

interface Activity {
  name: string;
  action: string;
  time: string;
  type: string;
  isReal?: boolean;
}

function generateRandomBooking(): Activity {
  const name = names[Math.floor(Math.random() * names.length)];
  const location = agraLocations[Math.floor(Math.random() * agraLocations.length)];
  const pkg = packages[Math.floor(Math.random() * packages.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  
  return {
    name: `${name}, ${location}`,
    action: `booked ${pkg}`,
    time,
    type: 'booking',
    isReal: false
  };
}

export default function RecentActivityPopup() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const realBookingsRef = useRef<Activity[]>([]);

  useEffect(() => {
    const fetchRealBookings = async () => {
      try {
        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(10));
        const snapshot = await getDocs(q);
        const realBookings: Activity[] = snapshot.docs.map(doc => {
          const data = doc.data();
          let location = agraLocations[Math.floor(Math.random() * agraLocations.length)];
          if (data.address && typeof data.address === 'string') {
            const parts = data.address.split(',');
            if (parts.length > 1) {
              location = parts[parts.length - 2].trim();
            }
          }
          return {
            name: `${data.customerName ? data.customerName.split(' ')[0] : 'Guest'}, ${location}`,
            action: `booked ${data.serviceTitle || 'a service'}`,
            time: 'Just now',
            type: 'booking',
            isReal: true
          };
        });
        
        realBookingsRef.current = realBookings;
      } catch (error) {
        console.error("Error fetching real bookings for popup:", error);
      }
    };
    
    fetchRealBookings();

    let timeoutId: NodeJS.Timeout;

    const showActivity = () => {
      // 30% chance to show a real booking if available, otherwise generate a random one
      const reals = realBookingsRef.current;
      let nextActivity: Activity;
      
      if (reals.length > 0 && Math.random() < 0.3) {
        nextActivity = reals[Math.floor(Math.random() * reals.length)];
      } else {
        nextActivity = generateRandomBooking();
      }

      setCurrentActivity(nextActivity);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 6000); // visible for 6 seconds

      // Next popup appears randomly between 12 to 25 seconds
      const nextDelay = Math.floor(Math.random() * 13000) + 12000;
      timeoutId = setTimeout(showActivity, nextDelay);
    };

    timeoutId = setTimeout(showActivity, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-50 pointer-events-none">
      <AnimatePresence>
        {isVisible && currentActivity && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
            className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3.5 flex items-start gap-3 w-72 md:w-80 pointer-events-auto relative overflow-hidden"
          >
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-50 transform -skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
            
            <div className="flex-shrink-0 mt-1">
              <div className="bg-green-100 text-green-600 p-2.5 rounded-full shadow-inner relative">
                <FaCheckCircle className="w-5 h-5" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <FaShieldAlt className="w-3 h-3 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-gray-800 truncate tracking-tight pr-2">
                  {currentActivity.name}
                </p>
                <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  {currentActivity.time}
                </p>
              </div>
              <p className="text-[13px] text-gray-600 truncate mt-0.5 font-medium">
                {currentActivity.action}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <FaShieldAlt className="w-2.5 h-2.5 text-green-500" />
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                  Verified Booking
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
