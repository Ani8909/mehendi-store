import SEO from "@/components/SEO";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import { FiCalendar, FiArrowLeft, FiClock, FiCheckCircle } from "react-icons/fi";
import { GetStaticPaths, GetStaticProps } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { slugify } from "@/lib/slugify";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";

interface ServicePageProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    duration: string;
    category: string;
    image?: string;
  } | null;
}

export default function ServiceDetail({ service }: ServicePageProps) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shareBtnText, setShareBtnText] = useState("Share Link");

  useEffect(() => {
    if (router.isReady && service?.title) {
      const { sharedBy } = router.query;
      if (sharedBy && typeof sharedBy === "string") {
        localStorage.setItem("sharedServiceReferral", sharedBy);
        localStorage.setItem("sharedServiceSlug", slugify(service.title));
      }
    }
  }, [router.isReady, router.query, service?.title]);

  const handleShareLink = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const refCode = userData?.referralCode || "";
    const shareUrl = `${window.location.origin}/services/${slugify(service?.title || "")}?sharedBy=${refCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book ${service?.title} at Jyoti Mehendi`,
          text: `Check out this gorgeous ${service?.title} mehndi design at Jyoti Mehendi Agra!`,
          url: shareUrl
        });
      } catch (err) {
        console.error("Web Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareBtnText("Copied! ✅");
        setTimeout(() => setShareBtnText("Share Link"), 2000);
      } catch (err) {
        alert("Failed to copy link. Please manually copy the URL.");
      }
    }
  };

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

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
        <h1 className="text-2xl font-bold mb-4 font-serif text-pink-700">Service Not Found</h1>
        <p className="mb-6 text-gray-500">The service you are looking for does not exist or has been removed.</p>
        <Link href="/services" className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full font-bold">
          View All Services
        </Link>
      </div>
    );
  }

  const phone = "7906297942";
  const whatsappMessage = encodeURIComponent(`Hi Jyoti Mehendi! I am interested in booking the "${service.title}" package. Please share availability.`);

  const getDefaultImage = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('bridal')) return '/images/services/bridal.png';
    if (t.includes('arabic')) return '/images/services/arabic.png';
    if (t.includes('portrait')) return '/images/services/portrait.png';
    if (t.includes('mandala')) return '/images/services/mandala.png';
    if (t.includes('fusion')) return '/images/services/fusion.png';
    return '/images/services/minimalist.png';
  };

  const imageSrc = service.image || getDefaultImage(service.title);

  // Schema for Local SEO / AEO / GEO
  const serviceSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.description,
    "serviceType": "Mehndi Design",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Jyoti Mehendi Artist",
      "image": "https://jyotimehendi.in/logo.png",
      "telephone": `+91${phone}`,
      "priceRange": `₹${service.price}`,
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
      "price": service.price,
      "priceCurrency": "INR",
      "url": `https://jyotimehendi.in/services/${slugify(service.title)}`
    }
  });

  return (
    <>
      <SEO 
        title={`Best ${service.title} in Agra | Top Mehndi Artist`}
        description={`Book professional ${service.title} in Agra by Jyoti Mehendi Artist. Premium designs, budget friendly prices (₹${service.price}), duration: ${service.duration}. Book now!`}
        schema={serviceSchema}
        ogImage={imageSrc.startsWith('/') ? `https://jyotimehendi.in${imageSrc}` : imageSrc}
      />

      <div className="bg-[var(--color-background)] min-h-screen pb-16">
        {/* Back Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/services" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors font-bold text-sm">
            <FiArrowLeft size={16} />
            Back to Services
          </Link>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-pink-50 grid grid-cols-1 lg:grid-cols-2">
            
            {/* Image side */}
            <div className="relative h-96 lg:h-auto min-h-[400px]">
              <img 
                src={imageSrc} 
                alt={`${service.title} - Best Mehndi in Agra`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = getDefaultImage(service.title); }}
              />
              <div className="absolute top-6 left-6">
                <span className="bg-white/95 backdrop-blur-md text-[var(--color-primary)] text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {service.category || 'Service'}
                </span>
              </div>
            </div>

            {/* Info side */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-[var(--color-header)] leading-tight mb-4">
                  {service.title}
                </h1>
                
                {/* Price and Duration pill */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-full font-bold text-lg shadow-md shadow-pink-600/20">
                    ₹{service.price}
                  </div>
                  <div className="bg-pink-50 border border-pink-100 text-pink-700 px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                    <FiClock />
                    {service.duration}
                  </div>
                </div>

                <div className="border-t border-pink-50 pt-6 mt-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Service Description</h3>
                  <p className="text-gray-600 leading-relaxed mb-6 text-base">
                    {service.description}
                  </p>

                  {/* Highlights section for SEO rich snippet */}
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">Our Quality Guarantees</h3>
                  <ul className="space-y-2 mb-8">
                    <li className="flex items-center gap-2.5 text-sm text-gray-600 font-medium">
                      <FiCheckCircle className="text-green-500" size={16} />
                      100% natural organic henna leaves paste (safe and rich stain)
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-gray-600 font-medium">
                      <FiCheckCircle className="text-green-500" size={16} />
                      Done by certified professional mehndi artist Jyoti
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-gray-600 font-medium">
                      <FiCheckCircle className="text-green-500" size={16} />
                      Home visits available all across Agra
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-4 border-t border-pink-50 pt-6">
                <Link 
                  href={{ pathname: '/booking', query: { serviceId: service.id } }}
                  className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white text-center font-bold rounded-2xl block hover:shadow-lg hover:shadow-pink-600/30 active:scale-[0.98] transition-all"
                >
                  Book This Experience
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
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-sm transition-transform hover:scale-[1.02]"
                  >
                    <FaPhone size={14} style={{ transform: "scaleX(-1)" }} />
                    Call Now
                  </a>
                </div>

                {/* Share & Earn Card */}
                <div className="bg-pink-50/50 rounded-2xl p-5 border border-pink-100/50 flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <div className="text-center sm:text-left flex-grow">
                    <p className="text-xs font-black text-pink-700 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1 mb-0.5">
                      <span>🔗 Share Design & Earn ₹20</span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Get ₹20 credited directly to your wallet when someone books this design using your shared link!
                    </p>
                  </div>
                  <button 
                    onClick={handleShareLink}
                    className="w-full sm:w-auto px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all whitespace-nowrap active:scale-[0.98]"
                  >
                    {shareBtnText}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  if (!adminDb) {
    return { paths: [], fallback: "blocking" };
  }

  try {
    const snapshot = await adminDb.collection("services").get();
    const paths = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (data.title && data.isActive !== false) {
          return { params: { slug: slugify(data.title) } };
        }
        return null;
      })
      .filter((p): p is { params: { slug: string } } => p !== null);

    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error in getStaticPaths for services:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  if (!adminDb || !slug) {
    return { props: { service: null } };
  }

  try {
    const snapshot = await adminDb.collection("services").get();
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Find the service that slugifies to the parameter slug
    const service = services.find(s => slugify((s as any).title) === slug);

    if (!service) {
      return {
        notFound: true,
      };
    }

    // Convert Firestore Timestamp or other non-serializable fields if any
    const serializedService = JSON.parse(JSON.stringify(service));

    return {
      props: {
        service: serializedService,
      },
      revalidate: 60, // Revalidate every 60 seconds (ISR)
    };
  } catch (error) {
    console.error(`Error in getStaticProps for service slug: ${slug}`, error);
    return { props: { service: null } };
  }
};
