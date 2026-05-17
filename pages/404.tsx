import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Jyoti Mehendi</title>
      </Head>
      <div className="min-h-[80vh] flex items-center justify-center bg-[var(--color-background)] px-4">
        <div className="text-center">
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-serif font-bold text-[var(--color-primary)] opacity-20"
          >
            404
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 -mt-12"
          >
            <h2 className="text-3xl font-bold font-serif text-[var(--color-header)] mb-4">Oops! Page not found</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We can't seem to find the page you're looking for. It might have been removed or the link is incorrect.
            </p>
            <Link 
              href="/"
              className="inline-block bg-[var(--color-primary)] text-white font-semibold px-8 py-3 rounded-full hover:bg-[var(--color-header)] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Return Home
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
