import SEO from "@/components/SEO";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import { FiCheck, FiArrowLeft, FiClock, FiCheckCircle } from "react-icons/fi";
import { GetStaticPaths, GetStaticProps } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { slugify } from "@/lib/slugify";

interface PackagePageProps {
  pkg: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
  } | null;
}

export default function PackageDetail({ pkg }: PackagePageProps) {
  const router = useRouter();

  // If page is fallback or loading
  if (router.isFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-pink-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 w-32 rounded"></div>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
        <h1 className="text-2xl font-bold mb-4 font-serif text-pink-700">Package Not Found</h1>
        <p className="mb-6 text-gray-500">The event package you are looking for does not exist or has been removed.</p>
        <Link href="/packages" className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full font-bold">
          View All Packages
        </Link>
      </div>
    );
  }

  const phone = "7906297942";
  const whatsappMessage = encodeURIComponent(`Hi Jyoti Mehendi! I am interested in booking the "${pkg.name}" event package. Please share details.`);

  const isPremium = pkg.price >= 8000;
  const imageSrc = "/images/gallery/bridal_2.png"; // Shared high quality package image

  // Schema for Local SEO / AEO / GEO
  const packageSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": pkg.name,
    "description": pkg.description,
    "serviceType": "Mehndi Event Package",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Jyoti Mehendi Artist",
      "image": "https://jyotimehendi.in/logo.png",
      "telephone": `+91${phone}`,
      "priceRange": `₹${pkg.price}`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Nagla Latoori Singh, Deori Road",
        "addressLocality": "Agra",
        "addressRegion": "Uttar Pradesh",
        "postalCode": "282001",
        "addressCountry": "IN"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Agra"
    },
    "offers": {
      "@type": "Offer",
      "price": pkg.price,
      "priceCurrency": "INR",
      "url": `https://jyotimehendi.in/packages/${slugify(pkg.name)}`
    }
  });

  return (
    <>
      <SEO 
        title={`Best ${pkg.name} Mehndi Package in Agra | Group Bookings`}
        description={`Book our premium "${pkg.name}" mehndi package in Agra. Covers grand weddings, sangeet, and bridal group bookings. Price: ₹${pkg.price}. Professional artists led by Jyoti.`}
        schema={packageSchema}
        ogImage={imageSrc.startsWith('/') ? `https://jyotimehendi.in${imageSrc}` : imageSrc}
      />

      <div className="bg-[var(--color-background)] min-h-screen pb-16">
        {/* Back Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/packages" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors font-bold text-sm">
            <FiArrowLeft size={16} />
            Back to Packages
          </Link>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className={`rounded-[3rem] shadow-xl overflow-hidden border grid grid-cols-1 lg:grid-cols-2 ${
            isPremium 
              ? "bg-gradient-to-br from-[#500724] via-[#310012] to-[#180008] border-pink-500/30 text-white shadow-[0_20px_50px_rgba(80,7,36,0.4)]" 
              : "bg-white border-pink-50 text-gray-800"
          }`}>
            
            {/* Image side */}
            <div className="relative h-96 lg:h-auto min-h-[400px]">
              <img 
                src={imageSrc} 
                alt={`${pkg.name} - Mehndi Package in Agra`}
                className="w-full h-full object-cover"
              />
              {isPremium && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-pink-500 via-pink-600 to-rose-700 text-white text-[10px] font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg border border-pink-400/30 animate-pulse">
                  ⭐ Royal Choice Package
                </div>
              )}
            </div>

            {/* Info side */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-2 ${
                  isPremium ? 'text-pink-300' : 'text-[var(--color-primary)]'
                }`}>
                  {isPremium ? 'Royal Wedding Special' : 'Elegant Celebration'}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold font-serif leading-tight mb-4">
                  {pkg.name}
                </h1>
                
                {/* Price and Duration pill */}
                <div className="flex flex-wrap items-baseline gap-3 mb-6">
                  <span className={`text-4xl font-extrabold tracking-tight ${isPremium ? 'text-pink-300' : 'text-gray-900'}`}>
                    ₹{pkg.price}
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isPremium ? 'text-pink-100/50' : 'text-gray-400'}`}>
                    / Complete Event Package
                  </span>
                </div>

                <div className={`border-t pt-6 mt-6 ${isPremium ? 'border-pink-900/30' : 'border-pink-50'}`}>
                  <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${isPremium ? 'text-pink-200/70' : 'text-gray-400'}`}>Package Description</h3>
                  <p className={`leading-relaxed mb-8 text-base ${isPremium ? 'text-pink-100/80' : 'text-gray-600'}`}>
                    {pkg.description}
                  </p>

                  {/* Highlights section for SEO rich snippet */}
                  <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${isPremium ? 'text-pink-200/70' : 'text-gray-400'}`}>What's Included</h3>
                  <div className="space-y-4 mb-8">
                    {pkg.features?.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isPremium 
                            ? 'bg-pink-500/20 text-pink-300' 
                            : 'bg-pink-50 text-[var(--color-primary)]'
                        }`}>
                          <FiCheck size={11} strokeWidth={4} />
                        </div>
                        <span className={`font-semibold ${isPremium ? 'text-pink-50/90' : 'text-gray-600'}`}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className={`space-y-4 border-t pt-6 ${isPremium ? 'border-pink-900/30' : 'border-pink-50'}`}>
                <Link 
                  href={`/booking?package=${encodeURIComponent(pkg.name)}&price=${pkg.price}`}
                  className={`w-full py-4 rounded-2xl font-bold text-center shadow-md transition-all block ${
                    isPremium
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-rose-600 hover:to-pink-500 hover:shadow-[0_10px_25px_rgba(219,39,119,0.4)]'
                      : 'bg-gradient-to-r from-[var(--color-primary)] to-pink-700 text-white hover:from-pink-700 hover:to-[var(--color-primary)] hover:shadow-[0_10px_25px_rgba(219,39,119,0.3)]'
                  }`}
                >
                  Book This Package
                </Link>

                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`https://wa.me/91${phone}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-transform hover:scale-[1.02]"
                  >
                    <FaWhatsapp size={16} />
                    WhatsApp
                  </a>
                  <a 
                    href={`tel:+91${phone}`}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-transform hover:scale-[1.02] ${
                      isPremium ? 'bg-pink-950/40 text-pink-300 hover:bg-pink-950/60 border border-pink-500/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FaPhone size={14} style={{ transform: "scaleX(-1)" }} />
                    Call Now
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const LEGACY_PACKAGE_MAPPING: Record<string, string> = {
  'royal-bridal-package-agra': 'The Royal Queen (Bridal Contract)',
  'budget-bridal-package-agra': 'Suhagan Group Pack (Family Special)',
  'premium-wedding-package-agra': 'Shagun Party Contract (Events)',
  'engagement-mehndi-package-agra': 'The Royal Queen (Bridal Contract)',
  'karwa-chauth-mehndi-agra': 'Suhagan Group Pack (Family Special)',
  'full-wedding-family-package-agra': 'Shagun Party Contract (Events)',
};

export const getStaticPaths: GetStaticPaths = async () => {
  if (!adminDb) {
    return { paths: [], fallback: "blocking" };
  }

  try {
    const snapshot = await adminDb.collection("event_packages").get();
    const dbPaths = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (data.name && data.isActive !== false) {
          return { params: { slug: slugify(data.name) } };
        }
        return null;
      })
      .filter((p): p is { params: { slug: string } } => p !== null);

    const legacyPaths = Object.keys(LEGACY_PACKAGE_MAPPING).map(slug => ({ params: { slug } }));
    const paths = [...dbPaths, ...legacyPaths];

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error in getStaticPaths for packages:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  if (!adminDb || !slug) {
    return { props: { pkg: null } };
  }

  try {
    // 1. Resolve legacy/hardcoded slugs to actual database names
    let targetSlug = slug;
    const mappedName = LEGACY_PACKAGE_MAPPING[slug];
    if (mappedName) {
      targetSlug = slugify(mappedName);
    }

    const snapshot = await adminDb.collection("event_packages").get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Find the package that slugifies to targetSlug
    const pkg = packages.find(p => slugify((p as any).name) === targetSlug);

    if (!pkg) {
      return {
        notFound: true,
      };
    }

    // Convert Firestore Timestamp or other non-serializable fields if any
    const serializedPkg = JSON.parse(JSON.stringify(pkg));

    return {
      props: {
        pkg: serializedPkg,
      },
      revalidate: 60, // Revalidate every 60 seconds (ISR)
    };
  } catch (error) {
    console.error(`Error in getStaticProps for package slug: ${slug}`, error);
    return { props: { pkg: null } };
  }
};
