import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowLeft, FiShield, FiLock, FiEye, FiCheck } from "react-icons/fi";
import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Jyoti Mehendi Artist Agra</title>
        <meta name="description" content="Privacy Policy for Jyoti Mehendi Artist. Learn how we protect and manage your personal details." />
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
              <FiShield size={30} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-gray-800 mb-4">
              Privacy Policy
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
                <FiLock className="text-pink-500" />
                <span>1. Information We Collect</span>
              </h2>
              <p>
                At Jyoti Mehendi, we respect your privacy and are committed to protecting it. When you book an appointment or register an account on our platform, we collect relevant details to deliver high-quality, professional mehndi services:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Contact Information:</strong> Your name, phone number, email address, and home/venue address where the artist needs to reach.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Booking Details:</strong> Selected mehendi services, wedding contracts, selected event packages, time slots, and event dates.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span><strong>Payment Information:</strong> Transaction details when paying secure booking deposits (processed through encrypted 3rd-party gateways like Razorpay).</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <FiEye className="text-pink-500" />
                <span>2. How We Use Your Information</span>
              </h2>
              <p>
                We use the gathered details solely to provide a seamless, high-end bridal and event experience:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Assigning professional local mehndi artists to your doorstep.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Sending booking confirmations, invoice slips, and critical OTP codes for secure account access.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <FiCheck className="text-pink-500 mt-1 flex-shrink-0" />
                  <span>Communicating scheduling adjustments, organic stain care instructions, and customer support queries.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <FiShield className="text-pink-500" />
                <span>3. Data Security & Storage</span>
              </h2>
              <p>
                All user and booking details are secured inside our state-of-the-art Firebase database infrastructure. We implement strict access controls to ensure your personal details are never sold, traded, or shared with unauthorized third parties. 
              </p>
              <p>
                Only the assigned mehndi artist has access to your contact number and venue location to successfully perform the services on your scheduled day.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center space-x-2">
                <span className="text-pink-500">✨</span>
                <span>4. Chemical-Free Organic Henna Safety</span>
              </h2>
              <p>
                While this pertains to physical application, user health is central to our policy. We use only 100% natural, chemical-free organic henna cones prepared by our primary artist in Agra. However, we advise clients with extremely sensitive skin or pre-existing conditions to request a quick patch test prior to complete application.
              </p>
            </section>

            <section className="space-y-4 pt-6 border-t border-pink-50">
              <h2 className="text-xl font-bold text-gray-800 font-serif">5. Contact Support</h2>
              <p>
                If you have any questions about this Privacy Policy, your saved data, or wish to delete your account, please reach out to us:
              </p>
              <p className="font-semibold text-pink-600">
                Email: hello@jyotimehendi.com <br />
                Call / WhatsApp: +91 7906297942
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}
