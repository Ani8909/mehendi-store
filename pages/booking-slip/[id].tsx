import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiMapPin, FiPhone, FiCheck, FiDownload, FiHome, FiMessageCircle } from "react-icons/fi";
import { FullScreenLoader } from "@/components/Loader";

export default function BookingSlip() {
  const router = useRouter();
  const { id } = router.query;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchBooking() {
      try {
        const docRef = doc(db, "bookings", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBooking({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  const handleShareWhatsApp = () => {
    if (!booking) return;
    const text = `🎉 *Jyoti Mehendi Booking Confirmed!* 🎉\n\n` +
      `*Booking ID:* ${booking.bookingRef || '#' + booking.id?.slice(-8).toUpperCase()}\n` +
      `*Customer:* ${booking.customerName}\n` +
      `*Service:* ${booking.serviceTitle}\n` +
      `*Date:* ${booking.bookingDateString}\n` +
      `*Time:* ${booking.timeSlot}\n` +
      `*Price:* ₹${booking.price}\n\n` +
      `View your official receipt here:\n` +
      `${window.location.origin}/booking-slip/${booking.id}\n\n` +
      `Thank you for choosing Jyoti Mehendi Art!`;
    
    const phone = booking.phone?.replace(/\D/g, "");
    let waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (phone && phone.length >= 10) {
      const waPhone = phone.length === 10 ? `91${phone}` : phone;
      waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
    }
    window.open(waUrl, "_blank");
  };

  if (loading) return <FullScreenLoader />;

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h1>
        <Link href="/" className="text-pink-600 font-bold underline">Go Back Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF5F7] py-12 px-4">
      <Head>
        <title>Booking Confirmation - Jyoti Mehendi</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8 no-print">
          <Link href="/" className="flex items-center text-gray-500 hover:text-pink-600 font-bold transition-colors">
            <FiHome className="mr-2"/> Home
          </Link>
          <div className="flex space-x-3">
            <button 
              onClick={handleShareWhatsApp}
              className="bg-green-500 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 flex items-center transition-all"
            >
              <FiMessageCircle className="mr-2"/> Share via WhatsApp
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-full font-bold shadow-lg hover:shadow-pink-200 flex items-center transition-all"
            >
              <FiDownload className="mr-2"/> Print/PDF
            </button>
          </div>
        </div>

        {/* THE SLIP */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white shadow-2xl relative max-w-lg mx-auto"
          style={{ 
            filter: "drop-shadow(0 20px 13px rgba(0, 0, 0, 0.08))",
            clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 5px) 100%, calc(100% - 10px) calc(100% - 10px), calc(100% - 15px) 100%, calc(100% - 20px) calc(100% - 10px), calc(100% - 25px) 100%, calc(100% - 30px) calc(100% - 10px), calc(100% - 35px) 100%, calc(100% - 40px) calc(100% - 10px), calc(100% - 45px) 100%, calc(100% - 50px) calc(100% - 10px), calc(100% - 55px) 100%, calc(100% - 60px) calc(100% - 10px), calc(100% - 65px) 100%, calc(100% - 70px) calc(100% - 10px), calc(100% - 75px) 100%, calc(100% - 80px) calc(100% - 10px), calc(100% - 85px) 100%, calc(100% - 90px) calc(100% - 10px), calc(100% - 95px) 100%, calc(100% - 100px) calc(100% - 10px), calc(100% - 105px) 100%, calc(100% - 110px) calc(100% - 10px), calc(100% - 115px) 100%, calc(100% - 120px) calc(100% - 10px), calc(100% - 125px) 100%, calc(100% - 130px) calc(100% - 10px), calc(100% - 135px) 100%, calc(100% - 140px) calc(100% - 10px), calc(100% - 145px) 100%, calc(100% - 150px) calc(100% - 10px), calc(100% - 155px) 100%, calc(100% - 160px) calc(100% - 10px), calc(100% - 165px) 100%, calc(100% - 170px) calc(100% - 10px), calc(100% - 175px) 100%, calc(100% - 180px) calc(100% - 10px), calc(100% - 185px) 100%, calc(100% - 190px) calc(100% - 10px), calc(100% - 195px) 100%, calc(100% - 200px) calc(100% - 10px), calc(100% - 205px) 100%, calc(100% - 210px) calc(100% - 10px), calc(100% - 215px) 100%, calc(100% - 220px) calc(100% - 10px), calc(100% - 225px) 100%, calc(100% - 230px) calc(100% - 10px), calc(100% - 235px) 100%, calc(100% - 240px) calc(100% - 10px), calc(100% - 245px) 100%, calc(100% - 250px) calc(100% - 10px), calc(100% - 255px) 100%, calc(100% - 260px) calc(100% - 10px), calc(100% - 265px) 100%, calc(100% - 270px) calc(100% - 10px), calc(100% - 275px) 100%, calc(100% - 280px) calc(100% - 10px), calc(100% - 285px) 100%, calc(100% - 290px) calc(100% - 10px), calc(100% - 295px) 100%, calc(100% - 300px) calc(100% - 10px), calc(100% - 305px) 100%, calc(100% - 310px) calc(100% - 10px), calc(100% - 315px) 100%, calc(100% - 320px) calc(100% - 10px), calc(100% - 325px) 100%, calc(100% - 330px) calc(100% - 10px), calc(100% - 335px) 100%, calc(100% - 340px) calc(100% - 10px), calc(100% - 345px) 100%, calc(100% - 350px) calc(100% - 10px), calc(100% - 355px) 100%, calc(100% - 360px) calc(100% - 10px), calc(100% - 365px) 100%, calc(100% - 370px) calc(100% - 10px), calc(100% - 375px) 100%, calc(100% - 380px) calc(100% - 10px), calc(100% - 385px) 100%, calc(100% - 390px) calc(100% - 10px), calc(100% - 395px) 100%, calc(100% - 400px) calc(100% - 10px), calc(100% - 405px) 100%, calc(100% - 410px) calc(100% - 10px), calc(100% - 415px) 100%, calc(100% - 420px) calc(100% - 10px), calc(100% - 425px) 100%, calc(100% - 430px) calc(100% - 10px), calc(100% - 435px) 100%, calc(100% - 440px) calc(100% - 10px), calc(100% - 445px) 100%, calc(100% - 450px) calc(100% - 10px), calc(100% - 455px) 100%, calc(100% - 460px) calc(100% - 10px), calc(100% - 465px) 100%, calc(100% - 470px) calc(100% - 10px), calc(100% - 475px) 100%, calc(100% - 480px) calc(100% - 10px), calc(100% - 485px) 100%, calc(100% - 490px) calc(100% - 10px), calc(100% - 495px) 100%, calc(100% - 500px) calc(100% - 10px), 0 100%)"
          }}
        >
          {/* Header */}
          <div className="p-8 text-center border-b-[3px] border-double border-gray-200 bg-white">
            <h1 className="text-4xl font-serif font-black text-gray-900 mb-2 tracking-tighter uppercase">Jyoti Mehendi</h1>
            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-4">Official Receipt</p>
            
            {/* Barcode Visualization */}
            <div className="flex justify-center mb-4 opacity-80 h-10 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <div key={i} className="bg-gray-800" style={{ width: Math.random() > 0.5 ? '2px' : '4px', margin: '0 1px', height: '100%' }}></div>
              ))}
            </div>
            <p className="font-mono text-xs tracking-[0.3em] text-gray-500 mb-6">{booking.bookingRef || booking.id?.toUpperCase()}</p>
            
            <div className="inline-flex items-center bg-green-700 text-white px-5 py-2 text-xs font-bold tracking-widest uppercase rounded-full shadow-sm">
              <FiCheck className="mr-2" strokeWidth={3}/> BOOKING CONFIRMED
            </div>

            {/* Express Dispatch Live Tracking Dashboard */}
            {booking.bookingType === "express" && (
              <div className="mt-6 p-5 bg-gradient-to-br from-pink-50 to-pink-50/20 border border-pink-100 rounded-2xl text-center space-y-3 no-print">
                <div className="flex items-center justify-center space-x-2 text-[var(--color-primary)] font-bold text-sm tracking-wider uppercase">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-600"></span>
                  </span>
                  <span>Artist Dispatched (ETA: 20 Mins)</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed font-sans">
                  A senior professional artist has been dynamically matched for you. They are dispatching to <strong className="text-gray-700">{booking.expressZone}</strong> right now. Please keep your phone active!
                </p>
                <div className="flex justify-center items-center space-x-2 font-sans pt-1">
                  <a href={`tel:+917906297942`} className="bg-white border border-pink-200 text-[var(--color-primary)] text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-pink-50 transition-colors flex items-center">
                    <FiPhone className="mr-1.5" /> Call Dispatch
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-8 space-y-6 bg-white font-mono text-sm relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[70px] sm:text-[90px] font-bold text-gray-900 -rotate-45 tracking-tighter">CONFIRMED</span>
            </div>

            {/* Date / Time */}
            <div className="flex justify-between items-end border-b border-dashed border-gray-300 pb-4">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Date</p>
                <p className="text-gray-900 font-bold">{booking.bookingDateString}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Time</p>
                <p className="text-gray-900 font-bold">{booking.timeSlot}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-b border-dashed border-gray-300 pb-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-[10px] tracking-widest">Customer</span>
                <span className="text-gray-900 font-bold text-right">{booking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-[10px] tracking-widest">Phone</span>
                <span className="text-gray-900 font-bold text-right">{booking.phone}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 uppercase text-[10px] tracking-widest w-24 flex-shrink-0">Address</span>
                <span className="text-gray-900 font-bold text-right leading-tight max-w-[200px]">{booking.address}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-b-[3px] border-double border-gray-300 pb-4">
              <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-widest mb-3">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-900 font-bold text-base">{booking.serviceTitle}</p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">
                    {booking.isPackage ? "Premium Package" : "Standard Service"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold text-lg">₹{booking.originalPrice || booking.price}.00</p>
                </div>
              </div>
            </div>

            {/* Discounts */}
            {((booking.couponDiscount && booking.couponDiscount > 0) || (booking.returningDiscount && booking.returningDiscount > 0)) && (
              <div className="border-b-[3px] border-double border-gray-300 pb-4 pt-2 space-y-2">
                {booking.returningDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Loyalty Discount</span>
                    <span className="font-bold">-₹{booking.returningDiscount}.00</span>
                  </div>
                )}
                {booking.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Coupon ({booking.couponCode})</span>
                    <span className="font-bold">-₹{booking.couponDiscount}.00</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-4">
              <span className="text-gray-900 uppercase font-black tracking-widest">Total</span>
              <span className="text-gray-900 font-black text-2xl">₹{booking.price}.00</span>
            </div>
            <div className="flex justify-between items-center pb-8 mt-2">
              <span className="text-gray-500 uppercase text-[10px] tracking-widest">Payment Method</span>
              <span className="text-gray-900 font-bold text-xs uppercase">Offline (Cash/UPI)</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-12 pt-4 bg-white text-center">
            <p className="text-gray-900 font-bold text-sm mb-2 uppercase tracking-widest">Thank you!</p>
            <p className="text-gray-500 text-xs italic mb-4">Please present this receipt to our artist upon arrival.</p>
            <div className="w-full h-px bg-gray-200 mb-4"></div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Jyoti Mehendi Art • Agra</p>
          </div>
        </motion.div>

        {/* Help Note */}
        <p className="mt-8 text-center text-gray-500 text-sm font-medium no-print">
          Track your booking using ID: <span className="text-pink-600 font-bold">{booking.bookingRef || booking.id?.slice(-8).toUpperCase()}</span> at <Link href="/verify" className="underline hover:text-pink-700">jyotimehendi.in/verify</Link><br/>
          In case of any issue, call us at <span className="text-gray-900 font-bold">+91 7906297942</span> or email <span className="text-gray-900 font-bold text-pink-600">suport@jyotimehendi.in</span>
        </p>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
