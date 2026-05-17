import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowLeft, FiFileText, FiClock, FiDollarSign, FiAlertTriangle, FiCheck } from "react-icons/fi";
import Layout from "@/components/Layout";

export default function TermsAndConditions() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Jyoti Mehendi Artist Agra</title>
        <meta name="description" content="Terms of Service for Jyoti Mehendi Artist. Review booking policies, cancellation, and artist guidelines." />
      </Head>

      <div className="min-h-screen bg-[#fff8f9] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-bold mb-8 transition-colors">
            <FiArrowLeft /> <span>Back to Home</span>
          </Link>

          {/* Heading block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_15px_50px_rgba(219,39,119,0.05)] border border-pink-100/50 mb-8"
          >
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 shadow-inner">
              <FiFileText size={30} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-gray-800 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-gray-400 text-sm">
              Last Updated: May 17, 2026
            </p>
          </motion.div>

          {/* Body Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_15px_50px_rgba(219,39,119,0.03)] border border-pink-100/30 space-y-8 text-gray-600 leading-relaxed text-sm md:text-base"
          >
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <FiClock className="text-pink-500" />
                <span>1. Booking & Scheduling Policy</span>
              </h2>
              <p>
                To provide Agra's best mehndi experience, we operate on a strict booking schedule. By submitting an appointment form, you agree to:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Provide accurate, verified details including a 10-digit Indian contact number and exact home address.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Ensure the designated venue has clean seating, adequate lighting, and back support for the client during lengthy bridal applications (typically 4–6 hours).</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Respect the designated time slot. Our artists wait a maximum of 30 minutes at the venue before marking the booking as missed.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <FiDollarSign className="text-pink-500" />
                <span>2. Pricing, Deposits & Payments</span>
              </h2>
              <p>
                Prices shown on our platform reflect clean estimates for individual services and wedding contracts:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Luxury Packages:</strong> Require a small, secure booking deposit online to reserve the wedding date, with the balance payable in cash or UPI to the artist upon completion of work.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Express Services:</strong> Are priced based on immediate travel proximity. No extra travel charges apply in designated Agra 20-min express zones.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <FiAlertTriangle className="text-pink-500" />
                <span>3. Cancellation & Rescheduling</span>
              </h2>
              <p>
                We understand plans can change during busy wedding celebrations. 
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Cancellations:</strong> Made 48 hours prior to the scheduled date receive a full deposit refund. Cancellations inside 48 hours will forfeit the initial deposit as a scheduling compensation for our senior artists.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Rescheduling:</strong> Can be requested up to 24 hours in advance, subject to matching time-slot and artist availability.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <span className="text-pink-500">🌸</span>
                <span>4. Aftercare & Stain Guarantee</span>
              </h2>
              <p>
                We use 100% pure organic henna that yields deep mahogany/rich maroon stains. However, final stain results depend directly on skin chemistry and adherence to recommended aftercare guidelines (e.g. keeping henna on for 6+ hours, applying mustard oil/clove steam, and avoiding water contact for the first 12 hours). We do not accept legal liability for light stains due to poor aftercare practice.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-pink-50">
              <h2 className="text-xl font-bold text-gray-800 font-serif">5. Contact Legal Office</h2>
              <p>
                For questions regarding bookings, pricing policies, or partner agreements:
              </p>
              <p className="font-semibold text-pink-600">
                Email: hello@jyotimehendi.com <br />
                Phone: +91 7906297942
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}
