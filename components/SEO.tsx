import Head from "next/head";
import { useRouter } from "next/router";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  schema?: string;
}

export default function SEO({ 
  title, 
  description, 
  keywords = "Mehndi artist Agra, Bridal Mehndi, Arabic Mehndi, Jyoti Mehendi Artist, Best Henna Agra, Mehndi booking", 
  ogImage = "https://jyotimehendi.in/logo.png",
  ogType = "website",
  schema
}: SEOProps) {
  const router = useRouter();
  const siteUrl = "https://jyotimehendi.in";
  const canonicalUrl = `${siteUrl}${router.asPath === '/' ? '' : router.asPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl.split('?')[0]} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Jyoti Mehendi Artist" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Schema Markup */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schema }}
        />
      )}
    </Head>
  );
}
